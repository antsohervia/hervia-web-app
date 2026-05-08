-- Étend l'identification d'un admin plateforme à plusieurs rôles
-- (super_admin, admin_support) tout en conservant le legacy `platform_admin`
-- pour les bases déjà migrées.

create or replace function public.is_platform_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select
        (raw_app_meta_data->>'role') in (
          'super_admin',
          'admin_support',
          'platform_admin'
        )
        and coalesce(
          (raw_app_meta_data->>'disabled')::boolean,
          false
        ) = false
      from auth.users
      where id = uid
    ),
    false
  );
$$;

create or replace function public.get_admin_role(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select raw_app_meta_data->>'role'
  from auth.users
  where id = uid;
$$;

create or replace function public.is_admin_disabled(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select coalesce(
        (raw_app_meta_data->>'disabled')::boolean,
        false
      )
      from auth.users
      where id = uid
    ),
    false
  );
$$;

-- Migrer les comptes existants `platform_admin` vers `super_admin`
update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"super_admin"'
)
where raw_app_meta_data->>'role' = 'platform_admin';
