-- Migration: 006_notifications.sql
-- Description: Adds notifications table and RLS policies

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  target_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- System/Triggers/Functions will use bypass RLS or service role to insert internally,
-- BUT since we want to insert from server actions via authenticated user,
-- the authenticated user creating a like/comment/follow should be able to insert a notification for someone else.
-- So we need an INSERT policy for authenticated users.

CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Admin/Operator can insert notifications (covered by the rule above as they are authenticated)
-- Alternatively, if we only want people to create notifications where actor_id is themselves:
-- CREATE POLICY "Users can create notifications as themselves"
-- ON public.notifications
-- FOR INSERT
-- WITH CHECK (auth.uid() = actor_id);
-- I'll implement the stricter one.

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

CREATE POLICY "Users can create notifications as themselves"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = actor_id);

-- Admin can create system/announcement notifications without actor_id (or with their own)
-- Since we want admin to send to anyone, the above policy works if actor_id is the admin.
-- If actor_id is null, we can add a specific policy for admins.

CREATE POLICY "Admins can create system notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'operator')
  )
);
