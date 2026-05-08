create table public.clients (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  full_name   text not null,
  email       citext,
  phone       text,
  created_at  timestamptz not null default now()
);
create index clients_tenant_idx on public.clients(tenant_id);

create table public.parcel_statuses (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  code        text not null,
  label       text not null,
  kind        parcel_status_kind not null default 'custom',
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  unique (tenant_id, code)
);
create index parcel_statuses_tenant_idx on public.parcel_statuses(tenant_id);

create table public.parcels (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete set null,
  reference   text not null,
  status_id   uuid references public.parcel_statuses(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index parcels_tenant_idx on public.parcels(tenant_id);
create index parcels_status_idx on public.parcels(status_id);

create trigger parcels_touch
before update on public.parcels
for each row execute function public.touch_updated_at();
