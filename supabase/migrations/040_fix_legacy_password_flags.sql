-- Migration 040: Fix legacy password flags

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS legacy_import_id text;

NOTIFY pgrst, 'reload schema';
