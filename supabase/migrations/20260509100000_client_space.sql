-- US-C1 / US-C4 : espace client final (auto-inscription, activation,
-- préférences de notification, désactivation)

-- ============================================================
-- 1. Statut du compte client (active / disabled / pending_activation)
-- ============================================================
alter table public.clients
  add column status text not null default 'active'
    check (status in ('active', 'disabled', 'pending_activation'));

-- ============================================================
-- 2. Préférence notification email (US-C4.1 désinscription)
-- ============================================================
alter table public.clients
  add column email_notifications_enabled boolean not null default true;

-- ============================================================
-- 3. Date de dernière connexion (US-E3.1 future + audit)
-- ============================================================
alter table public.clients
  add column last_login_at timestamptz;

-- ============================================================
-- 4. Unicité de l'email par tenant (exigée par US-C1.3)
-- ============================================================
create unique index clients_tenant_email_uniq
  on public.clients (tenant_id, lower(email))
  where email is not null;

-- ============================================================
-- 5. RLS : permettre au client connecté de mettre à jour
--    sa propre préférence de notification.
-- ============================================================
create policy clients_self_update on public.clients
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
