create type tenant_status as enum ('active', 'suspended', 'deleted');

create type suspension_reason as enum (
  'impaye',
  'fraude',
  'demande_client',
  'maintenance',
  'autre'
);

create type tenant_member_role as enum ('entreprise_admin', 'entreprise_member');

create type parcel_status_kind as enum (
  'pending',
  'in_transit',
  'delivered',
  'cancelled',
  'custom'
);
