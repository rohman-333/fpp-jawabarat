-- Add password_changed_at column for legacy user security
alter table public.profiles add column if not exists password_changed_at timestamptz;

-- Refresh schema cache
notify pgrst, 'reload schema';
