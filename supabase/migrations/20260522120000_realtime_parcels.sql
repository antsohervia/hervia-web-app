-- Realtime — publication sur parcels + parcel_events
-- Permet au client (espace de suivi) de recevoir les changements de statut
-- en temps réel via `postgres_changes` (RLS déjà en place pour filtrer par client).

do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'parcels'
  ) then
    alter publication supabase_realtime add table public.parcels;
  end if;

  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'parcel_events'
  ) then
    alter publication supabase_realtime add table public.parcel_events;
  end if;
end
$$;
