# Notifications — Setup par environnement

Checklist à dérouler **une fois par environnement** (dev local, staging, prod) après chaque nouveau déploiement Supabase + Next.js. Architecture : voir [ADR-0001](adr/0001-architecture-notifications.md).

---

## 1. Générer un shared secret

Aléatoire, 32+ caractères, jamais commit. Au choix :

```bash
openssl rand -base64 32
# ou :
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Garde la valeur — elle sert aux deux étapes suivantes et doit être **identique des deux côtés**.

---

## 2. Côté Next.js — `.env.local` / variables d'env de déploiement

```env
NOTIFICATIONS_SHARED_SECRET=<le-secret-généré-à-l-étape-1>
```

Sur Vercel : Dashboard → Project → Settings → Environment Variables, scope `Production` + `Preview` + `Development`.

---

## 3. Côté Supabase — settings DB (GUC)

Ces 4 settings sont lus par la fonction trigger `notify_on_parcel_event` via `current_setting('app.xxx', true)`. Ils ne peuvent pas vivre dans une migration (le secret est sensible et l'URL varie par env).

**Comment les poser** : Supabase Studio → SQL Editor, ou `psql "$DATABASE_URL" -c "..."`.

### Production

```sql
alter database postgres set app.notifications_dispatch_url = 'https://app.trackapp.com/api/notifications/dispatch';
alter database postgres set app.notifications_secret       = '<le-secret-généré-à-l-étape-1>';
alter database postgres set app.notifications_app_domain   = 'trackapp.com';
alter database postgres set app.notifications_url_scheme   = 'https';
```

### Staging

```sql
alter database postgres set app.notifications_dispatch_url = 'https://staging.trackapp.com/api/notifications/dispatch';
alter database postgres set app.notifications_secret       = '<secret-staging>';
alter database postgres set app.notifications_app_domain   = 'staging.trackapp.com';
alter database postgres set app.notifications_url_scheme   = 'https';
```

### Dev local

`host.docker.internal` permet à Postgres (qui tourne dans Docker via `supabase start`) d'atteindre Next.js qui tourne sur la machine hôte.

```sql
alter database postgres set app.notifications_dispatch_url = 'http://host.docker.internal:3000/api/notifications/dispatch';
alter database postgres set app.notifications_secret       = 'dev-secret-no-need-to-be-strong';
alter database postgres set app.notifications_app_domain   = 'localhost:3000';
alter database postgres set app.notifications_url_scheme   = 'http';
```

### Vérifier

```sql
show app.notifications_dispatch_url;
show app.notifications_secret;
show app.notifications_app_domain;
show app.notifications_url_scheme;
```

Si un `show` retourne `unrecognized configuration parameter`, le trigger lit `null` (graceful) et **les notifications sont créées en DB mais aucun dispatch HTTP n'est tenté** — utile en dev quand Next.js n'est pas up.

---

## 4. Cron pour le worker de retry

Le worker dépile la `notification_outbox` (lignes `pending` / `retry` dont `next_attempt_at <= now()`) et retente les envois selon le backoff 5 min / 30 min / 2 h (US-C4.1).

### Option A — Supabase cron + pg_net (recommandé)

Dans SQL Editor :

```sql
select cron.schedule(
  'notifications-worker',
  '*/5 * * * *',  -- toutes les 5 minutes
  $$
    select net.http_post(
      url := current_setting('app.notifications_dispatch_url')
             || replace('/api/notifications/dispatch', '/dispatch', '/worker'),
      headers := jsonb_build_object(
        'content-type', 'application/json',
        'x-notify-secret', current_setting('app.notifications_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  $$
);
```

Vérifier : `select * from cron.job;` puis `select * from cron.job_run_details order by start_time desc limit 5;`

### Option B — Vercel Cron

Dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/notifications/worker",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Note : Vercel Cron ne peut pas envoyer le header `x-notify-secret`. Si tu prends cette option, accepter aussi `Authorization: Bearer <CRON_SECRET>` (avec un autre secret défini dans Vercel) dans `worker/route.ts`.

---

## 5. Smoke test

1. Sur ton admin tenant : changer le statut d'un colis attribué à un client `status='active'` avec une `email` non null.
2. Vérifier en DB :
   ```sql
   select id, event_type, title, created_at from public.notifications order by created_at desc limit 5;
   select id, notification_id, channel, status, attempts, last_error
     from public.notification_outbox order by created_at desc limit 5;
   ```
3. Attendu : 1 ligne dans `notifications`, 2 lignes dans `notification_outbox` (channels `inapp` + `email`), toutes deux `status='sent'`.
4. Si `email` est en `retry` ou `failed`, regarder `last_error` (souvent : SMTP non configuré, ou URL/secret incorrect).
5. Côté Next.js logs : aucune erreur `[notifications/dispatch]`.

---

## 6. Checklist nouveau déploiement (résumé)

- [ ] Secret généré et noté
- [ ] `NOTIFICATIONS_SHARED_SECRET` ajouté aux env vars Next.js (tous les scopes)
- [ ] 4 `alter database postgres set app.notifications_*` exécutés sur la DB de l'env
- [ ] Cron worker programmé (Supabase cron ou Vercel Cron)
- [ ] Smoke test passé sur l'env

---

## Annexes

### Rotation du secret

1. Générer un nouveau secret
2. Mettre à jour `NOTIFICATIONS_SHARED_SECRET` côté Next.js → **déployer**
3. Dans la même fenêtre, mettre à jour `app.notifications_secret` côté DB
4. Les notifications déclenchées pendant la transition retombent en `retry` dans l'outbox (403 de la route) puis sont rejouées par le worker avec le nouveau secret

### Désactiver temporairement les notifications externes

Mettre à `null` le dispatch URL côté DB :

```sql
alter database postgres reset app.notifications_dispatch_url;
```

Les notifications continuent d'être créées en DB (in-app via Realtime) mais aucun appel HTTP n'est tenté. Pratique en cas d'incident SMTP.
