-- Migration 053: Auth Migration Helpers
-- Idempotently create helper view/queries joining profiles and auth.users

CREATE OR REPLACE VIEW public.auth_migration_profiles AS
SELECT 
  p.id,
  p.name,
  p.role,
  p.account_type,
  p.status,
  p.legacy_user_id,
  p.phone,
  p.username,
  p.must_change_password,
  p.password_changed_at,
  p.legacy_import_id,
  p.created_at,
  au.email AS auth_email,
  au.id AS auth_user_id
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id;

REVOKE ALL ON public.auth_migration_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.auth_migration_profiles TO service_role;
