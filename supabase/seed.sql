-- Promote the bootstrapping admin to super_admin (idempotent).
-- The user must already exist in auth.users.
update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"super_admin"'
)
where email = 'antso@yopmail.com';
