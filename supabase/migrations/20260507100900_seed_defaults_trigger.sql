create or replace function public.seed_default_parcel_statuses()
returns trigger
language plpgsql
as $$
begin
  insert into public.parcel_statuses (tenant_id, code, label, kind, position) values
    (new.id, 'received',          'Reçu',         'pending',    10),
    (new.id, 'in_transit',        'En transit',   'in_transit', 20),
    (new.id, 'out_for_delivery',  'En livraison', 'in_transit', 30),
    (new.id, 'delivered',         'Livré',        'delivered',  40),
    (new.id, 'cancelled',         'Annulé',       'cancelled',  50);
  return new;
end;
$$;

create trigger tenants_seed_statuses
after insert on public.tenants
for each row execute function public.seed_default_parcel_statuses();
