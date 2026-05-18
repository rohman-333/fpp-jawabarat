-- RUN THIS IN SUPABASE SQL EDITOR BEFORE RUNNING MIGRATION SCRIPT
-- Disable the trigger that automatically creates public.profiles 
-- to prevent 500 unexpected_failure during auth.users creation.

ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
