create table public.tenants (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  subdomain           citext not null,
  country             text not null,
  default_currency    text not null check (char_length(default_currency) = 3),
  status              tenant_status not null default 'active',
  logo_url            text,
  suspension_reason   suspension_reason,
  suspension_note     text,
  suspension_message  text,
  suspended_at        timestamptz,
  suspended_by        uuid references auth.users(id),
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint tenants_subdomain_format
    check (
      subdomain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
      and char_length(subdomain) between 3 and 40
    )
);

create unique index tenants_subdomain_uniq
  on public.tenants(subdomain)
  where status <> 'deleted';

create index tenants_status_idx       on public.tenants(status);
create index tenants_created_at_idx   on public.tenants(created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_touch
before update on public.tenants
for each row execute function public.touch_updated_at();
