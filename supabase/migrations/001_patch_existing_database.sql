-- ==========================================
-- Migration: 001_patch_existing_database.sql
-- Description: Aman dijalankan di database yang sudah ada isinya (idempotent).
-- ==========================================

-- 1. Patch Table: profiles
-- Menambahkan kolom jika belum ada. Jika database lama pakai 'full_name', kita tambahkan 'name'.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'pesantren' CHECK (role IN ('admin', 'operator', 'pesantren', 'seller', 'member'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pesantren_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create or Patch Table: pesantren
CREATE TABLE IF NOT EXISTS public.pesantren (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  nspp TEXT UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan kolom pesantren jika tabel sudah ada sebelumnya
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS nspp TEXT UNIQUE;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS pendiri TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS pengasuh TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS alamat_desa TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS kecamatan TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS province TEXT DEFAULT 'Jawa Barat';
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS tahun_berdiri INT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS jenis_pesantren TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS program_unggulan TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS potensi_ekonomi TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS kebutuhan_utama TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS minat_digital_ai TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected'));

-- Update Foreign Key profiles.pesantren_id (harus manual via constraint jika diperlukan, atau cukup foreign key biasa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_pesantren_id_fkey') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_pesantren_id_fkey FOREIGN KEY (pesantren_id) REFERENCES public.pesantren(id) ON DELETE SET NULL;
    END IF;
END $$;


-- 3. Create other tables if not exists
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  stock INT DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  total_amount DECIMAL(12, 2) NOT NULL,
  shipping_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  price_at_time DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  donor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Trigger Function handle_new_user (Aman karena OR REPLACE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, status)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', new.email), 
    COALESCE(new.raw_user_meta_data->>'role', 'pesantren'), 
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    status = COALESCE(public.profiles.status, 'active');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pastikan trigger on_auth_user_created ada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END
$$;

-- 5. Enable RLS and Create Policies safely
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesantren ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- Drop exist policies to recreate safely
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

DROP POLICY IF EXISTS "Pesantren are viewable by everyone." ON public.pesantren;
DROP POLICY IF EXISTS "Users can create own pesantren." ON public.pesantren;
DROP POLICY IF EXISTS "Users can update own pesantren." ON public.pesantren;

DROP POLICY IF EXISTS "Products are viewable by everyone." ON public.products;
DROP POLICY IF EXISTS "Pesantren owners can manage products." ON public.products;

DROP POLICY IF EXISTS "Forum posts are viewable by everyone." ON public.forum_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts." ON public.forum_posts;
DROP POLICY IF EXISTS "Authors can update own posts." ON public.forum_posts;

-- Recreate policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Pesantren are viewable by everyone." ON public.pesantren FOR SELECT USING (true);
CREATE POLICY "Users can create own pesantren." ON public.pesantren FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own pesantren." ON public.pesantren FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Products are viewable by everyone." ON public.products FOR SELECT USING (true);
CREATE POLICY "Pesantren owners can manage products." ON public.products FOR ALL USING (
  auth.uid() IN (SELECT profile_id FROM public.pesantren WHERE id = pesantren_id)
);

CREATE POLICY "Forum posts are viewable by everyone." ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts." ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts." ON public.forum_posts FOR UPDATE USING (auth.uid() = author_id);
