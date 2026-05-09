-- US-E1 (marque blanche) + US-E2 (statuts/colis)

-- ============================================================
-- 1. Branding tenant (logo + thème + couleurs)
-- ============================================================
create type tenant_theme as enum ('light', 'dark', 'corporate');

alter table public.tenants
  add column theme tenant_theme not null default 'light',
  add column primary_color text not null default '#1A56DB',
  add column secondary_color text;

create table public.tenant_theme_history (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  theme        tenant_theme not null,
  primary_color   text not null,
  secondary_color text,
  logo_url     text,
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz not null default now()
);
create index tenant_theme_history_tenant_idx
  on public.tenant_theme_history(tenant_id, published_at desc);

-- ============================================================
-- 2. Statuts colis : ajouter type métier (initial/intermediate/final)
--    + couleur + icône + description interne
-- ============================================================
create type parcel_status_type as enum ('initial', 'intermediate', 'final');

alter table public.parcel_statuses
  add column color text not null default '#6B7280',
  add column icon text,
  add column description text,
  add column type parcel_status_type not null default 'intermediate';

-- Aligner les statuts par défaut existants
update public.parcel_statuses
   set type = 'initial',
       color = '#3B82F6'
 where code = 'received';
update public.parcel_statuses
   set type = 'final',
       color = '#10B981'
 where code = 'delivered';
update public.parcel_statuses
   set type = 'final',
       color = '#EF4444'
 where code = 'cancelled';
update public.parcel_statuses
   set color = '#F59E0B'
 where code in ('in_transit', 'out_for_delivery');

-- Mettre à jour la fonction de seed pour intégrer les nouveaux champs
create or replace function public.seed_default_parcel_statuses()
returns trigger
language plpgsql
as $$
begin
  insert into public.parcel_statuses
    (tenant_id, code, label, kind, type, color, position) values
    (new.id, 'received',         'Reçu',         'pending',    'initial',      '#3B82F6', 10),
    (new.id, 'in_transit',       'En transit',   'in_transit', 'intermediate', '#F59E0B', 20),
    (new.id, 'out_for_delivery', 'En livraison', 'in_transit', 'intermediate', '#F59E0B', 30),
    (new.id, 'delivered',        'Livré',        'delivered',  'final',        '#10B981', 40),
    (new.id, 'cancelled',        'Annulé',       'cancelled',  'final',        '#EF4444', 50);
  return new;
end;
$$;

-- ============================================================
-- 3. Colis : champs métier additionnels
-- ============================================================
alter table public.parcels
  add column description          text,
  add column weight_kg             numeric(10,3),
  add column volume_m3             numeric(10,3),
  add column estimated_price       numeric(14,2),
  add column currency              text,
  add column origin_country        text,
  add column destination_country   text,
  add column shipped_at            timestamptz,
  add column estimated_delivery_at date,
  add constraint parcels_reference_unique_per_tenant unique (tenant_id, reference),
  add constraint parcels_estimated_price_positive
    check (estimated_price is null or estimated_price > 0);

create index parcels_client_idx on public.parcels(client_id);

-- ============================================================
-- 4. Évènements de colis (historique des changements de statut)
-- ============================================================
create table public.parcel_events (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  parcel_id     uuid not null references public.parcels(id) on delete cascade,
  status_id     uuid references public.parcel_statuses(id) on delete set null,
  comment       text,
  occurred_at   timestamptz not null default now(),
  actor_id      uuid references auth.users(id) on delete set null,
  actor_email   text,
  created_at    timestamptz not null default now()
);
create index parcel_events_parcel_idx
  on public.parcel_events(parcel_id, occurred_at desc);
create index parcel_events_tenant_idx
  on public.parcel_events(tenant_id);

alter table public.parcel_events enable row level security;

create policy parcel_events_admin_all on public.parcel_events
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy parcel_events_tenant_scope on public.parcel_events
  for select to authenticated
  using (
    tenant_id in (select public.current_tenant_ids())
    or parcel_id in (
      select p.id from public.parcels p
      join public.clients c on c.id = p.client_id
      where c.user_id = auth.uid()
    )
  );

alter table public.tenant_theme_history enable row level security;

create policy theme_history_admin_all on public.tenant_theme_history
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy theme_history_tenant_scope on public.tenant_theme_history
  for select to authenticated
  using (tenant_id in (select public.current_tenant_ids()));

-- ============================================================
-- 5. Helper : tenant courant (entreprise) pour le rôle "entreprise"
-- ============================================================
create or replace function public.is_tenant_member(p_tenant uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = p_tenant and user_id = p_uid
  );
$$;

create or replace function public.is_tenant_admin(p_tenant uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = p_tenant
      and user_id = p_uid
      and role = 'entreprise_admin'
  );
$$;

-- ============================================================
-- 6. Bucket de stockage logos (public)
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('tenant-assets', 'tenant-assets', true)
  on conflict (id) do nothing;
