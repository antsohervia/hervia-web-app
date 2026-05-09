-- US : ajout d'un colis par numéro de tracking côté client
-- 1. Modes de transport configurables par tenant
-- 2. Statut système "En attente de réponse" + colonnes parcels
-- 3. Normalisation des références existantes en uppercase

-- ============================================================
-- 1. Table transport_modes (per tenant)
-- ============================================================
create table public.transport_modes (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  code        text not null,
  label       text not null,
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, code)
);
create index transport_modes_tenant_idx on public.transport_modes(tenant_id);

create trigger transport_modes_touch
before update on public.transport_modes
for each row execute function public.touch_updated_at();

alter table public.transport_modes enable row level security;

create policy transport_modes_admin_all on public.transport_modes
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy transport_modes_tenant_scope on public.transport_modes
  for select to authenticated
  using (tenant_id in (select public.current_tenant_ids()));

-- ============================================================
-- 2. parcels : transport_mode_id + is_client_initiated
-- ============================================================
alter table public.parcels
  add column transport_mode_id    uuid references public.transport_modes(id) on delete set null,
  add column is_client_initiated  boolean not null default false;

create index parcels_transport_mode_idx on public.parcels(transport_mode_id);

-- ============================================================
-- 3. parcel_statuses.system_code (statut verrouillé pour le système)
-- ============================================================
alter table public.parcel_statuses
  add column system_code text;

create unique index parcel_statuses_tenant_system_code_uniq
  on public.parcel_statuses (tenant_id, system_code)
  where system_code is not null;

-- ============================================================
-- 4. Backfill : modes par défaut + statut système pour tenants existants
-- ============================================================
insert into public.transport_modes (tenant_id, code, label, position)
select t.id, m.code, m.label, m.position
from public.tenants t
cross join (values
  ('maritime', 'Maritime', 10),
  ('aerien',   'Aérien',   20),
  ('routier',  'Routier',  30)
) as m(code, label, position)
on conflict (tenant_id, code) do nothing;

insert into public.parcel_statuses
  (tenant_id, code, label, kind, type, color, position, system_code)
select t.id,
       'pending_client_response',
       'En attente de réponse',
       'pending',
       'intermediate',
       '#9CA3AF',
       5,
       'pending_client_response'
from public.tenants t
on conflict (tenant_id, code) do nothing;

-- Marque la ligne avec le system_code si déjà présente sans tag
update public.parcel_statuses
   set system_code = 'pending_client_response'
 where code = 'pending_client_response'
   and system_code is null;

-- ============================================================
-- 5. Normalisation uppercase des références existantes
--    (le claim côté client compare en uppercase)
-- ============================================================
update public.parcels
   set reference = upper(reference)
 where reference <> upper(reference);

-- ============================================================
-- 6. Mise à jour du seed pour les futurs tenants
-- ============================================================
create or replace function public.seed_default_parcel_statuses()
returns trigger
language plpgsql
as $$
begin
  insert into public.parcel_statuses
    (tenant_id, code, label, kind, type, color, position, system_code) values
    (new.id, 'pending_client_response', 'En attente de réponse', 'pending',    'intermediate', '#9CA3AF',  5, 'pending_client_response'),
    (new.id, 'received',                'Reçu',                 'pending',    'initial',      '#3B82F6', 10, null),
    (new.id, 'in_transit',              'En transit',           'in_transit', 'intermediate', '#F59E0B', 20, null),
    (new.id, 'out_for_delivery',        'En livraison',         'in_transit', 'intermediate', '#F59E0B', 30, null),
    (new.id, 'delivered',               'Livré',                'delivered',  'final',        '#10B981', 40, null),
    (new.id, 'cancelled',               'Annulé',               'cancelled',  'final',        '#EF4444', 50, null);

  insert into public.transport_modes (tenant_id, code, label, position) values
    (new.id, 'maritime', 'Maritime', 10),
    (new.id, 'aerien',   'Aérien',   20),
    (new.id, 'routier',  'Routier',  30);

  return new;
end;
$$;
