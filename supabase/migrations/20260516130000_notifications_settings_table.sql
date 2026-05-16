-- Supabase Cloud bloque `alter database postgres set app.xxx`. On remplace
-- les GUC par une table de config lue par le trigger. RLS verrouille
-- l'accès : aucune policy authenticated/anon, donc seul service_role
-- (et le trigger via SECURITY DEFINER) peuvent lire.

create table public.notification_settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

-- (aucune policy ⇒ table inaccessible sauf via service_role / SECURITY DEFINER)

create trigger notification_settings_touch
before update on public.notification_settings
for each row execute function public.touch_updated_at();

-- Helper SECURITY DEFINER : la fonction trigger l'appelle pour lire la
-- config sans avoir besoin de policies sur la table.
create or replace function public.notification_setting(p_key text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select value from public.notification_settings where key = p_key;
$$;

-- Réécrit la fonction trigger : lit via notification_setting()
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

    v_scheme     := coalesce(public.notification_setting('url_scheme'),  'https');
    v_app_domain := coalesce(public.notification_setting('app_domain'),  'trackapp.com');
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

    v_dispatch_url := public.notification_setting('dispatch_url');
    v_secret       := public.notification_setting('secret');

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
    raise warning '[notify_on_parcel_event] échec pour parcel_event %: % / %',
                  new.id, sqlstate, sqlerrm;
  end;

  return new;
end;
$$;
