-- Migration: 007_legacy_import_support.sql
-- Description: Adds legacy identifier columns for data migration from old PHP platform

DO $$
BEGIN
  -- Add legacy_user_id and phone to profiles if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='legacy_user_id') THEN
    ALTER TABLE public.profiles ADD COLUMN legacy_user_id text UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='account_type') THEN
    ALTER TABLE public.profiles ADD COLUMN account_type text DEFAULT 'masyarakat_umum';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='username') THEN
    ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='location') THEN
    ALTER TABLE public.profiles ADD COLUMN location text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='website_url') THEN
    ALTER TABLE public.profiles ADD COLUMN website_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN is_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='old_avatar_path') THEN
    ALTER TABLE public.profiles ADD COLUMN old_avatar_path text;
  END IF;

  -- Add legacy_pesantren_id to pesantren if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pesantren' AND column_name='legacy_pesantren_id') THEN
    ALTER TABLE public.pesantren ADD COLUMN legacy_pesantren_id text UNIQUE;
  END IF;

  -- Add legacy_product_id to products if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='legacy_product_id') THEN
    ALTER TABLE public.products ADD COLUMN legacy_product_id text UNIQUE;
  END IF;
END $$;

-- Fix constraint on profiles.role to allow only 'admin', 'operator', 'user'
DO $$
BEGIN
  -- We drop the existing check constraint on 'role' if any. Since constraint name might be unknown or auto-generated, we drop and recreate if possible, or just drop it if we know the name.
  -- In 001_patch_existing_database.sql it was created via ALTER TABLE ... ADD COLUMN ... CHECK (...)
  -- Let's drop it by querying the constraint name:
  DECLARE
    constraint_name text;
  BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%role%';
    
    IF constraint_name IS NOT NULL THEN
      EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
  END;
END $$;

-- Update existing profiles that have legacy roles
UPDATE public.profiles SET 
  account_type = 'pesantren', role = 'user' 
WHERE role = 'pesantren';

UPDATE public.profiles SET 
  account_type = 'seller', role = 'user' 
WHERE role = 'seller';

UPDATE public.profiles SET 
  account_type = 'masyarakat_umum', role = 'user' 
WHERE role = 'member';

UPDATE public.profiles SET 
  account_type = 'lembaga' 
WHERE role IN ('admin', 'operator');

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'operator', 'user'));

-- Update handle_new_user to properly map legacy roles to new system
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  mapped_role text;
  mapped_account_type text;
  raw_role text;
BEGIN
  raw_role := COALESCE(new.raw_user_meta_data->>'role', 'user');

  -- Mapping
  IF raw_role = 'admin' THEN
    mapped_role := 'admin';
    mapped_account_type := 'lembaga';
  ELSIF raw_role = 'operator' THEN
    mapped_role := 'operator';
    mapped_account_type := 'lembaga';
  ELSIF raw_role = 'pesantren' THEN
    mapped_role := 'user';
    mapped_account_type := 'pesantren';
  ELSIF raw_role = 'seller' THEN
    mapped_role := 'user';
    mapped_account_type := 'seller';
  ELSE
    mapped_role := 'user';
    mapped_account_type := 'masyarakat_umum';
  END IF;

  INSERT INTO public.profiles (id, name, role, account_type, status)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', new.email), 
    mapped_role,
    mapped_account_type,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    account_type = COALESCE(public.profiles.account_type, EXCLUDED.account_type),
    status = COALESCE(public.profiles.status, 'active');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
