alter table public.tenants                      enable row level security;
alter table public.tenant_members               enable row level security;
alter table public.clients                      enable row level security;
alter table public.parcels                      enable row level security;
alter table public.parcel_statuses              enable row level security;
alter table public.audit_logs                   enable row level security;
alter table public.tenant_subdomain_quarantine  enable row level security;

-- tenants
create policy tenants_admin_all on public.tenants
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy tenants_member_select on public.tenants
  for select to authenticated
  using (id in (select public.current_tenant_ids()));

-- tenant_members
create policy tenant_members_admin_all on public.tenant_members
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy tenant_members_self_select on public.tenant_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or tenant_id in (select public.current_tenant_ids())
  );

-- clients
create policy clients_admin_all on public.clients
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy clients_tenant_scope on public.clients
  for select to authenticated
  using (
    tenant_id in (select public.current_tenant_ids())
    or user_id = auth.uid()
  );

-- parcels
create policy parcels_admin_all on public.parcels
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy parcels_tenant_scope on public.parcels
  for select to authenticated
  using (
    tenant_id in (select public.current_tenant_ids())
    or client_id in (select id from public.clients where user_id = auth.uid())
  );

-- parcel_statuses
create policy parcel_statuses_admin_all on public.parcel_statuses
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy parcel_statuses_tenant_scope on public.parcel_statuses
  for select to authenticated
  using (tenant_id in (select public.current_tenant_ids()));

-- audit_logs (admin only)
create policy audit_logs_admin_all on public.audit_logs
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- quarantine (admin only)
create policy quarantine_admin_all on public.tenant_subdomain_quarantine
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
