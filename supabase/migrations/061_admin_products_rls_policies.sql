-- Migration 061: Admin Products RLS Policies
-- Description: Add missing SELECT, INSERT, UPDATE, and DELETE policies for administrative roles on public.products

DO $$
BEGIN
  -- 1. View (SELECT) Policy for Admins
  DROP POLICY IF EXISTS "Admins can view all products." ON public.products;
  CREATE POLICY "Admins can view all products." ON public.products 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin', 'operator', 'team')
    )
  );

  -- 2. Insert Policy for Admins
  DROP POLICY IF EXISTS "Admins can insert all products" ON public.products;
  CREATE POLICY "Admins can insert all products" ON public.products 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin', 'operator', 'team')
    )
  );

  -- 3. Update Policy for Admins
  DROP POLICY IF EXISTS "Admins can update all products." ON public.products;
  CREATE POLICY "Admins can update all products." ON public.products 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin', 'operator', 'team')
    )
  );

  -- 4. Delete Policy for Admins
  DROP POLICY IF EXISTS "Admins can delete all products" ON public.products;
  CREATE POLICY "Admins can delete all products" ON public.products 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin', 'operator', 'team')
    )
  );
END $$;

-- Reload PostgREST Cache
NOTIFY pgrst, 'reload schema';
