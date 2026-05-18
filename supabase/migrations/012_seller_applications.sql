-- Migration 012: Seller Applications and Shop Support

CREATE TABLE IF NOT EXISTS public.seller_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    shop_name text NOT NULL,
    business_category text,
    description text,
    whatsapp text,
    address text,
    reason text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by uuid REFERENCES public.profiles(id),
    reviewed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS for seller_applications
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own applications" ON public.seller_applications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all applications" ON public.seller_applications
FOR SELECT USING ( (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin', 'team') );

CREATE POLICY "Users can insert own applications" ON public.seller_applications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update applications" ON public.seller_applications
FOR UPDATE USING ( (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin', 'team') );

-- Alter products and orders to support seller_id directly, allowing users without pesantren to sell
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update RLS for products if needed so sellers can manage their own products
-- Currently products might have RLS based on pesantren_id. We need to add policies for seller_id.
DO $$
BEGIN
  -- Attempt to drop old policy if it exists and recreate
  -- This is a bit complex, so we just add a new policy allowing seller_id
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Sellers can manage own products' AND tablename = 'products') THEN
    CREATE POLICY "Sellers can manage own products" ON public.products
    FOR ALL USING (auth.uid() = seller_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Sellers can manage own orders' AND tablename = 'orders') THEN
    CREATE POLICY "Sellers can manage own orders" ON public.orders
    FOR ALL USING (auth.uid() = seller_id);
  END IF;
END $$;

-- Backfill existing products/orders to have seller_id = pesantren's owner
UPDATE public.products p
SET seller_id = ps.profile_id
FROM public.pesantren ps
WHERE p.pesantren_id = ps.id AND p.seller_id IS NULL;

UPDATE public.orders o
SET seller_id = ps.profile_id
FROM public.pesantren ps
WHERE o.pesantren_id = ps.id AND o.seller_id IS NULL;

-- Trigger to auto-update profile is_seller and seller_status when application changes
CREATE OR REPLACE FUNCTION public.update_profile_seller_status()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    PERFORM set_config('my.bypassing_role_protect', 'true', true);
    
    UPDATE public.profiles
    SET 
      is_seller = (NEW.status = 'approved'),
      seller_status = NEW.status
    WHERE id = NEW.user_id;

    PERFORM set_config('my.bypassing_role_protect', 'false', true);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_seller_application_status_change ON public.seller_applications;
CREATE TRIGGER on_seller_application_status_change
AFTER INSERT OR UPDATE ON public.seller_applications
FOR EACH ROW
EXECUTE PROCEDURE public.update_profile_seller_status();

NOTIFY pgrst, 'reload schema';
