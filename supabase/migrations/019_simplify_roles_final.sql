-- Migration 019: Simplify Roles Final

-- 1. Ensure all the new flag columns exist in public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_pesantren BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seller_status TEXT DEFAULT 'none' CHECK (seller_status IN ('none', 'pending', 'approved', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_courier BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS courier_status TEXT DEFAULT 'none' CHECK (courier_status IN ('none', 'pending', 'approved', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_division TEXT;

-- 2. Ensure role column is properly constrained
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('superadmin', 'admin', 'team', 'user'));

-- Convert old role 'operator' to 'admin'
UPDATE public.profiles 
SET role = 'admin' 
WHERE role = 'operator';

-- 3. Convert legacy 'account_type' semantics into flags (assuming we had account_type or similar logic in role)
-- If role was 'pesantren', they become user with has_pesantren
UPDATE public.profiles 
SET role = 'user', has_pesantren = true
WHERE role = 'pesantren';

-- If role was 'seller', they become user with is_seller and approved
UPDATE public.profiles 
SET role = 'user', is_seller = true, seller_status = 'approved'
WHERE role = 'seller';

-- 4. Default all other non-system roles to 'user'
UPDATE public.profiles
SET role = 'user'
WHERE role NOT IN ('superadmin', 'admin', 'team', 'user') AND role IS NOT NULL;

-- 5. Set default role to 'user' for profiles where role is null
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL;

-- 6. Recreate public_profiles view to ensure it has the latest columns
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  name,
  username,
  avatar_url,
  bio,
  location,
  role,
  has_pesantren,
  is_seller,
  is_courier,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
