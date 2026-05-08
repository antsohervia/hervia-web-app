-- gen_random_uuid() is built-in in PostgreSQL 13+; no uuid-ossp required.
-- Supabase installs pgcrypto and citext into the `extensions` schema by default;
-- they're already on the default search_path. Re-run idempotently.
create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext   with schema extensions;
