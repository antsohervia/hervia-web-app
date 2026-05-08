create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id),
  actor_email text,
  action      text not null,
  tenant_id   uuid references public.tenants(id) on delete set null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index audit_logs_tenant_idx     on public.audit_logs(tenant_id);
create index audit_logs_actor_idx      on public.audit_logs(actor_id);
create index audit_logs_action_idx     on public.audit_logs(action);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);
