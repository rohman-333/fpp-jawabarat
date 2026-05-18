-- Migration 010: Simplify Roles and Permissions

-- 1. Add new columns to profiles table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'has_pesantren') THEN
        ALTER TABLE public.profiles ADD COLUMN has_pesantren boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_seller') THEN
        ALTER TABLE public.profiles ADD COLUMN is_seller boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'seller_status') THEN
        ALTER TABLE public.profiles ADD COLUMN seller_status text DEFAULT 'none';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_courier') THEN
        ALTER TABLE public.profiles ADD COLUMN is_courier boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'courier_status') THEN
        ALTER TABLE public.profiles ADD COLUMN courier_status text DEFAULT 'none';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'team_division') THEN
        ALTER TABLE public.profiles ADD COLUMN team_division text NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'invited_by') THEN
        ALTER TABLE public.profiles ADD COLUMN invited_by uuid NULL REFERENCES public.profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'invited_at') THEN
        ALTER TABLE public.profiles ADD COLUMN invited_at timestamptz NULL;
    END IF;
END $$;

-- 2. Migrate existing roles
-- 'operator' -> 'admin'
UPDATE public.profiles 
SET role = 'admin' 
WHERE role = 'operator';

-- 'pesantren' -> 'user' + has_pesantren = true
UPDATE public.profiles 
SET role = 'user', has_pesantren = true 
WHERE role = 'pesantren';

-- 'seller' -> 'user' + is_seller = true + seller_status = 'approved'
UPDATE public.profiles 
SET role = 'user', is_seller = true, seller_status = 'approved' 
WHERE role = 'seller';

-- Anything else that is not 'superadmin', 'admin', 'team', or 'user' -> 'user'
UPDATE public.profiles 
SET role = 'user' 
WHERE role NOT IN ('superadmin', 'admin', 'team', 'user') AND role IS NOT NULL;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
