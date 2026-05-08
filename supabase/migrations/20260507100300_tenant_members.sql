create table public.tenant_members (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        tenant_member_role not null default 'entreprise_member',
  invited_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index tenant_members_user_idx   on public.tenant_members(user_id);
create index tenant_members_tenant_idx on public.tenant_members(tenant_id);
