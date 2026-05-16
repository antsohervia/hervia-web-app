# ADR-0001 — Architecture des notifications multi-canaux

- **Statut :** Accepté
- **Date :** 2026-05-16
- **Décideurs :** Mendrika
- **US concernées :** [US-C4.1, US-C4.2](../../us/US-CLIENT-notifications.md)

---

## Contexte

L'épic C4 (notifications client) impose dès la V1 deux canaux : email transactionnel et centre in-app. Les épics suivants prévoient SMS, push et webhooks tenant. Trois besoins structurent l'architecture :

1. **Ajouter un canal doit être local** — pas de refonte du déclencheur métier ni du dispatcher à chaque nouveau canal.
2. **Préférences par destinataire × canal × event** — un client peut désactiver l'email de suivi tout en gardant l'in-app et les emails critiques.
3. **Fiabilité et observabilité** — l'US-C4.1 exige 3 tentatives de renvoi (5 min / 30 min / 2 h) et une visibilité des rebonds côté tenant. Une perte silencieuse de notification est inacceptable.

La stack impose également : Supabase (Postgres + Realtime + Edge Functions + RLS), pas de bus d'événements externe, latence < 2 min entre événement métier et envoi.

## Décision

Adopter un pattern **Strategy + Dispatcher + Outbox**, déclenché par **trigger Postgres → Edge Function**.

### 1. Strategy — un canal = une classe

Chaque canal implémente l'interface `NotificationChannel` (`id`, `isEnabledFor`, `send`). Les canaux vivent dans `lib/notifications/channels/{email,inapp,sms,push,webhook}.ts` et sont déclarés dans un registry. Ajouter un canal = créer un fichier + l'enregistrer ; aucun autre point du code à modifier.

### 2. Dispatcher centralisé

Le dispatcher reçoit un `NotificationPayload` (event, recipientId, tenantId, data), lit les préférences du destinataire, et **insère une ligne par canal actif dans l'outbox**. Il ne fait pas d'I/O réseau lui-même : il enfile.

### 3. Outbox comme source de fiabilité

Table `notification_outbox` : `(id, notification_id, channel, status, attempts, next_retry_at, last_error, provider_id)`. Un worker dépile les lignes `pending` ou `retry`, appelle `channel.send()`, met à jour le statut. Retries selon US-C4.1 : 5 min, 30 min, 2 h, puis `failed`. Le worker tourne dans une Edge Function planifiée (cron Supabase).

### 4. Déclenchement : trigger Postgres → Next.js Route Handler

`AFTER INSERT ON parcel_events` (chaque insert dans `parcel_events` = un changement de statut canonique avec son `comment`, `occurred_at`, `actor_id`) :

1. Insère une ligne dans `notifications` (source de vérité, alimente le centre in-app via Realtime).
2. Invoque la route `POST /api/notifications/dispatch` via `pg_net.http_post` avec le `notification.id` et un header `x-notify-secret`.
3. La route charge la notification + les préférences, et insère dans `notification_outbox` une ligne par canal actif, puis lance les `channel.send()` en fire-and-forget.

Pourquoi un Route Handler Next.js plutôt qu'une Supabase Edge Function : les libs d'envoi (`nodemailer`, templates) sont Node-only et déjà en place côté Next.js. Une Edge Function en Deno obligerait à réécrire l'envoi mail. Le contrat `NotificationChannel` reste agnostique du runtime, on pourra migrer plus tard.

Le worker de retry vit dans `POST /api/notifications/worker`, appelé par un cron (Supabase cron + `pg_net`, ou Vercel Cron selon le déploiement).

### 5. Schéma DB

| Table                       | Rôle                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `notifications`             | Événements métier — 1 ligne par event, alimente l'in-app via Supabase Realtime           |
| `notification_preferences`  | `(user_id, channel, event_type, enabled)` — granularité fine, désinscription = `enabled=false` |
| `notification_outbox`       | File d'attente par canal avec statut, tentatives, retries                                |

RLS sur `notifications` filtrée par `recipient_id = auth.uid()`. Publication Realtime activée sur `notifications`.

## Alternatives écartées

- **Appel direct depuis le code Next.js après l'update statut** — couplage acceptable mais perte de fiabilité si crash entre l'update et le dispatch. Le trigger Postgres garantit la transactionnalité.
- **Observer pur (chaque canal s'abonne aux events)** — élégant mais éclate l'observabilité ; un outbox centralisé donne une vue unique de l'état de livraison.
- **Bus d'événements externe (Inngest, Trigger.dev, SQS)** — surdimensionné jusqu'à plusieurs milliers d'events/jour. Réévaluable plus tard sans casser le contrat `NotificationChannel`.
- **Job cron qui scanne les changements de statut** — latence incompatible avec l'objectif des 2 minutes et contre-nature pour du push.

## Conséquences

**Positives :**
- Nouveau canal = 1 fichier + 1 enregistrement, sans toucher au déclencheur ni au dispatcher.
- Retries et rebonds visibles via une seule table (`notification_outbox`).
- L'in-app exploite Realtime sans polling (cf. `MEMORY.md` → `project-realtime-supabase`).
- Le trigger Postgres rend l'émission atomique avec l'update métier.

**Négatives / dette acceptée :**
- 3 tables dédiées + 1 Edge Function dispatcher + 1 Edge Function worker à maintenir.
- Le worker outbox doit être idempotent (clé : `(notification_id, channel)`) pour résister aux re-livraisons.
- `pg_net` introduit une dépendance Supabase ; si on quitte Supabase, le déclenchement doit être réécrit (mais le contrat `NotificationChannel` survit).

## Suivi

- Implémentation : migrations Supabase, scaffolding TS `lib/notifications/`, route handlers `app/api/notifications/dispatch` et `app/api/notifications/worker`.
- Métriques à exposer côté admin tenant (épic suivant) : taux de livraison par canal, rebonds, latence p95 event → send.
