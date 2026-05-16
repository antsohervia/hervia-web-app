-- ADR-0001 : déclenchement des notifications via trigger Postgres → Next.js
-- Le trigger fire AFTER INSERT ON parcel_events, crée la notification
-- canonique puis pousse vers /api/notifications/dispatch via pg_net.

-- ============================================================
-- 1. Extension pg_net (HTTP outbound depuis Postgres)
-- ============================================================
create extension if not exists pg_net with schema extensions;

-- ============================================================
-- 2. Fonction trigger : crée la notification + appelle dispatch
--
--    Settings GUC à configurer côté DB (une fois par environnement) :
--      alter database postgres set app.notifications_dispatch_url = 'https://<host>/api/notifications/dispatch';
--      alter database postgres set app.notifications_secret = '<shared-secret>';
--      alter database postgres set app.notifications_app_domain = 'trackapp.com';
--      alter database postgres set app.notifications_url_scheme = 'https';
--
--    Si dispatch_url ou secret sont absents, la notification est créée
--    (donc visible in-app via Realtime) mais aucun canal externe n'est
--    déclenché — utile en dev sans Next.js up.
-- ============================================================
create or replace function public.notify_on_parcel_event()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_parcel        record;
  v_client        record;
  v_status        record;
  v_tenant        record;
  v_notification_id uuid;
  v_dispatch_url  text;
  v_secret        text;
  v_app_domain    text;
  v_scheme        text;
  v_link_url      text;
  v_title         text;
begin
  -- N'émet que pour les changements de statut (parcel_events peut être étendu)
  if new.status_id is null then
    return new;
  end if;

  begin
    select id, reference, client_id, tenant_id
      into v_parcel
      from public.parcels
      where id = new.parcel_id;

    if v_parcel.client_id is null then
      return new;
    end if;

    select id, full_name, email, user_id, status
      into v_client
      from public.clients
      where id = v_parcel.client_id;

    if v_client.status is distinct from 'active' then
      return new;
    end if;

    select id, label, color, type
      into v_status
      from public.parcel_statuses
      where id = new.status_id;

    select id, name, subdomain
      into v_tenant
      from public.tenants
      where id = v_parcel.tenant_id;

    v_scheme     := coalesce(current_setting('app.notifications_url_scheme', true), 'https');
    v_app_domain := coalesce(current_setting('app.notifications_app_domain', true), 'trackapp.com');
    v_link_url   := format('%s://%s.%s/parcels/%s',
                          v_scheme, v_tenant.subdomain, v_app_domain, v_parcel.id);
    v_title      := format('Colis %s : %s', v_parcel.reference, v_status.label);

    insert into public.notifications (
      tenant_id, recipient_client_id, event_type,
      subject_type, subject_id, title, body, link_url, data
    )
    values (
      v_parcel.tenant_id, v_parcel.client_id, 'parcel.status_changed',
      'parcel', v_parcel.id,
      v_title,
      nullif(coalesce(new.comment, ''), ''),
      v_link_url,
      jsonb_build_object(
        'parcel_id', v_parcel.id,
        'parcel_reference', v_parcel.reference,
        'parcel_event_id', new.id,
        'status_id', v_status.id,
        'status_label', v_status.label,
        'status_color', v_status.color,
        'status_type', v_status.type,
        'comment', new.comment,
        'occurred_at', new.occurred_at
      )
    )
    returning id into v_notification_id;

    -- Push fire-and-forget vers la route Next.js (jamais bloquant)
    v_dispatch_url := current_setting('app.notifications_dispatch_url', true);
    v_secret       := current_setting('app.notifications_secret', true);

    if v_dispatch_url is not null and v_secret is not null then
      perform net.http_post(
        url := v_dispatch_url,
        headers := jsonb_build_object(
          'content-type', 'application/json',
          'x-notify-secret', v_secret
        ),
        body := jsonb_build_object('notification_id', v_notification_id),
        timeout_milliseconds := 5000
      );
    end if;

  exception when others then
    -- Jamais bloquer la mise à jour métier (US-C4.1)
    raise warning '[notify_on_parcel_event] échec pour parcel_event %: % / %',
                  new.id, sqlstate, sqlerrm;
  end;

  return new;
end;
$$;

-- ============================================================
-- 3. Trigger sur parcel_events
-- ============================================================
create trigger parcel_events_notify
after insert on public.parcel_events
for each row execute function public.notify_on_parcel_event();
