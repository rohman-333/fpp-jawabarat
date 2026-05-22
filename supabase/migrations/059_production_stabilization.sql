-- Migration 059: Production Stabilization (Safety Net)
-- IDEMPOTENT: Safe to re-run. Does not drop data. Does not alter auth/password/push.
-- Purpose: Ensure all critical fixes from 058 are applied if that migration was missed.

--------------------------------------------------------------------------------
-- A. Normalize programs status constraint
-- Allows: draft, published, active, completed, cancelled, archived
--------------------------------------------------------------------------------
ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_status_check;
ALTER TABLE public.programs ADD CONSTRAINT programs_status_check 
  CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled', 'archived'));

--------------------------------------------------------------------------------
-- B. Normalize profiles role constraint
-- Allows: member, admin, superadmin, operator, team, seller, courier, user
--------------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('member', 'admin', 'superadmin', 'operator', 'team', 'seller', 'courier', 'user'));

--------------------------------------------------------------------------------
-- C. Forum moderation columns on forum_posts
--------------------------------------------------------------------------------
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Also add to forum_discussions if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='forum_discussions') THEN
    EXECUTE 'ALTER TABLE public.forum_discussions ADD COLUMN IF NOT EXISTS status text DEFAULT ''active''';
    EXECUTE 'ALTER TABLE public.forum_discussions ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false';
    EXECUTE 'ALTER TABLE public.forum_discussions ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false';
  END IF;
END $$;

--------------------------------------------------------------------------------
-- D. Pesantren review columns (idempotent)
--------------------------------------------------------------------------------
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS reviewed_by uuid;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS rejection_reason text;

--------------------------------------------------------------------------------
-- E. delivery_fares compatibility view
-- marketplace/actions.ts queries 'delivery_fares' with 'destination_zone_id' and 'per_km_rate'
-- Actual table is 'delivery_fare_rules' with 'zone_id' and 'per_km_fare'
--------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.delivery_fares AS
SELECT 
  id,
  service_type_id,
  zone_id AS destination_zone_id,
  base_fare,
  per_km_fare AS per_km_rate,
  minimum_fare,
  platform_fee,
  is_active
FROM public.delivery_fare_rules;

GRANT SELECT ON public.delivery_fares TO public, anon, authenticated;

--------------------------------------------------------------------------------
-- F. add_to_cart_v2 RPC (safe, uses ON CONFLICT)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_to_cart_v2(p_product_id uuid, p_quantity int DEFAULT 1)
RETURNS public.cart_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_seller_id uuid;
  v_item public.cart_items;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT seller_id INTO v_seller_id FROM public.products WHERE id = p_product_id;

  INSERT INTO public.cart_items (user_id, product_id, seller_id, quantity, created_at, updated_at)
  VALUES (v_user_id, p_product_id, v_seller_id, greatest(p_quantity, 1), now(), now())
  ON CONFLICT (user_id, product_id)
  DO UPDATE SET
    quantity = public.cart_items.quantity + excluded.quantity,
    updated_at = now()
  RETURNING * INTO v_item;

  RETURN v_item;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_to_cart_v2(uuid, int) TO authenticated;

--------------------------------------------------------------------------------
-- G. Admin RLS Policies (idempotent)
--------------------------------------------------------------------------------
DO $$
BEGIN
  -- Orders: superadmin/admin can view all
  DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
  CREATE POLICY "Admin can view all orders" ON public.orders
    FOR SELECT USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'operator', 'team')
    ));

  -- Orders: superadmin/admin/seller can update
  DROP POLICY IF EXISTS "Sellers/Admin can update own orders" ON public.orders;
  CREATE POLICY "Sellers/Admin can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = seller_id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'operator', 'team')
    ));

  -- Forum posts: admin moderation policies
  DROP POLICY IF EXISTS "Admin can update forum posts" ON public.forum_posts;
  CREATE POLICY "Admin can update forum posts" ON public.forum_posts
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'operator', 'team'))
    );

  DROP POLICY IF EXISTS "Admin can delete forum posts" ON public.forum_posts;
  CREATE POLICY "Admin can delete forum posts" ON public.forum_posts
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'operator', 'team'))
    );

  -- Profiles: admin can update any profile (for role change)
  DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
  CREATE POLICY "Admin can update any profile" ON public.profiles
    FOR UPDATE USING (
      auth.uid() = id OR
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
    );
END $$;

--------------------------------------------------------------------------------
-- H. Reload PostgREST Cache
--------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
