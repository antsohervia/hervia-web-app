-- US-C4 : architecture multi-canaux des notifications (ADR-0001)
-- Tables : notifications (event log canonique + in-app), notification_preferences
-- (granularité client × canal × event), notification_outbox (queue de livraison).

-- ============================================================
-- 1. notifications — event log canonique, alimente l'in-app via Realtime
-- ============================================================
create table public.notifications (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  recipient_client_id   uuid not null references public.clients(id) on delete cascade,
  event_type            text not null,
  subject_type          text,
  subject_id            uuid,
  title                 text not null,
  body                  text,
  link_url              text,
  data                  jsonb not null default '{}'::jsonb,
  read_at               timestamptz,
  created_at            timestamptz not null default now()
);
create index notifications_recipient_created_idx
  on public.notifications(recipient_client_id, created_at desc);
create index notifications_tenant_idx on public.notifications(tenant_id);
create index notifications_unread_idx
  on public.notifications(recipient_client_id)
  where read_at is null;

-- ============================================================
-- 2. notification_preferences — granularité client × canal × event_type
--    event_type = '*' = catch-all pour le canal
-- ============================================================
create table public.notification_preferences (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  channel     text not null,
  event_type  text not null default '*',
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (client_id, channel, event_type)
);
create index notification_preferences_client_idx
  on public.notification_preferences(client_id);

create trigger notification_preferences_touch
before update on public.notification_preferences
for each row execute function public.touch_updated_at();

-- ============================================================
-- 3. notification_outbox — queue de livraison par canal, retries
-- ============================================================
create table public.notification_outbox (
  id                    uuid primary key default gen_random_uuid(),
  notification_id       uuid not null references public.notifications(id) on delete cascade,
  channel               text not null,
  status                text not null default 'pending'
                        check (status in ('pending', 'sent', 'failed', 'retry')),
  attempts              int not null default 0,
  max_attempts          int not null default 3,
  next_attempt_at       timestamptz not null default now(),
  last_error            text,
  provider_message_id   text,
  sent_at               timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (notification_id, channel)
);
create index notification_outbox_due_idx
  on public.notification_outbox(next_attempt_at)
  where status in ('pending', 'retry');
create index notification_outbox_notification_idx
  on public.notification_outbox(notification_id);

create trigger notification_outbox_touch
before update on public.notification_outbox
for each row execute function public.touch_updated_at();

-- ============================================================
-- 4. RLS
-- ============================================================
alter table public.notifications              enable row level security;
alter table public.notification_preferences   enable row level security;
alter table public.notification_outbox        enable row level security;

-- notifications : platform admin tout ; client voit/update les siennes ;
-- tenant member voit celles de son tenant (observabilité)
create policy notifications_admin_all on public.notifications
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy notifications_client_select on public.notifications
  for select to authenticated
  using (
    recipient_client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  );

create policy notifications_client_update on public.notifications
  for update to authenticated
  using (
    recipient_client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  )
  with check (
    recipient_client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  );

create policy notifications_tenant_member_select on public.notifications
  for select to authenticated
  using (tenant_id in (select public.current_tenant_ids()));

-- préférences : platform admin tout ; client gère les siennes
create policy notification_preferences_admin_all on public.notification_preferences
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy notification_preferences_client_all on public.notification_preferences
  for all to authenticated
  using (
    client_id in (select id from public.clients where user_id = auth.uid())
  )
  with check (
    client_id in (select id from public.clients where user_id = auth.uid())
  );

-- outbox : admin uniquement (jamais exposé aux clients)
create policy notification_outbox_admin_all on public.notification_outbox
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- ============================================================
-- 5. Realtime — publication sur notifications (le client subscribe
--    `postgres_changes` event=INSERT filter=recipient_client_id=eq.<id>)
-- ============================================================
alter publication supabase_realtime add table public.notifications;
