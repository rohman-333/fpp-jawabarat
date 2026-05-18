-- RUN THIS IN SUPABASE SQL EDITOR AFTER MIGRATION SCRIPT IS FINISHED
-- Re-enable the trigger to restore normal application behavior.

ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
