create or replace function public.is_subdomain_available(p_subdomain citext)
returns boolean
language sql
stable
as $$
  select
    not exists (
      select 1 from public.tenants
      where subdomain = p_subdomain and status <> 'deleted'
    )
    and not exists (
      select 1 from public.tenant_subdomain_quarantine
      where subdomain = p_subdomain and released_at > now()
    );
$$;

create or replace function public.is_platform_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select (raw_app_meta_data->>'role') = 'platform_admin'
      from auth.users
      where id = uid
    ),
    false
  );
$$;

create or replace function public.current_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.tenant_members where user_id = auth.uid();
$$;

create or replace function public.get_user_id_by_email(p_email citext)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from auth.users where email = p_email limit 1;
$$;
