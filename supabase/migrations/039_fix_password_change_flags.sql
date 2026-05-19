-- Migration 039: Add password change flags safely

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;

NOTIFY pgrst, 'reload schema';
