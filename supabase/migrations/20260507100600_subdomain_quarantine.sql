create table public.tenant_subdomain_quarantine (
  subdomain     citext primary key,
  released_at   timestamptz not null,
  former_tenant uuid,
  created_at    timestamptz not null default now()
);

create index tenant_subdomain_quarantine_released_idx
  on public.tenant_subdomain_quarantine(released_at);
