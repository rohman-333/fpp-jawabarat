-- Migration 056: Create Notification Preferences Schema
-- Creates public.notification_preferences table to control internal and push notifications.

DO $$
BEGIN
  -- Create notification_preferences table if not exists
  CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    enable_email boolean DEFAULT true,
    enable_push boolean DEFAULT true,
    enable_likes boolean DEFAULT true,
    enable_comments boolean DEFAULT true,
    enable_follows boolean DEFAULT true,
    enable_chats boolean DEFAULT true,
    enable_orders boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Create index for user_id on notification_preferences
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notification_preferences_user_id'
  ) THEN
    CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences (user_id);
  END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Service role full access notification_preferences" ON public.notification_preferences;

-- Create RLS Policies
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access notification_preferences"
  ON public.notification_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure updated_at updates automatically if supported
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER trigger_handle_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

NOTIFY pgrst, 'reload schema';
