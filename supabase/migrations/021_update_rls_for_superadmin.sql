-- Migration 021: Update RLS for Superadmin
-- Ensure older policies that only checked 'admin' or 'operator' now include 'superadmin' and 'team' where appropriate

-- 1. Update Marketplace Products Policies
DROP POLICY IF EXISTS "Admins can view all products." ON public.products;
DROP POLICY IF EXISTS "Admins can update all products." ON public.products;

CREATE POLICY "Admins can view all products." ON public.products 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'team'))
);

CREATE POLICY "Admins can update all products." ON public.products 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'team'))
);

-- 2. Update Notifications Policies
DROP POLICY IF EXISTS "Admins can create system notifications" ON public.notifications;

CREATE POLICY "Admins can create system notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'team')
  )
);

-- 3. Reload schema
NOTIFY pgrst, 'reload schema';
