alter table public.tenants
  add column timezone text not null default 'Europe/Paris';
