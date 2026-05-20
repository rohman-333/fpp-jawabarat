-- Migration 055: Consolidate Notifications Schema
-- Ensures notifications table has all required columns and proper RLS.
-- Also ensures push_subscriptions has is_active column.

DO $$
BEGIN
  -- Notifications table columns
  ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title text;
  ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body text;
  ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message text;
  ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS href text;
  ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_url text;
  ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
  ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
  ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at timestamptz;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'actor_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- Push subscriptions: add is_active if missing
  ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
  ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

  -- Create index for faster unread count queries
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_unread'
  ) THEN
    CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_created'
  ) THEN
    CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Notification RLS (idempotent with DROP IF EXISTS)
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create notifications as themselves" ON public.notifications;
CREATE POLICY "Users can create notifications as themselves"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

DROP POLICY IF EXISTS "Admins can create system notifications" ON public.notifications;
CREATE POLICY "Admins can create system notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'operator', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Push subscriptions RLS
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

NOTIFY pgrst, 'reload schema';
