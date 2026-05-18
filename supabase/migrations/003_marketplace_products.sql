-- ==========================================
-- Migration: 003_marketplace_products.sql
-- Description: Update products schema for marketplace
-- ==========================================

-- 1. Tambah kolom seller_id, status, dan image_url di tabel products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'hidden'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- (Opsional) Sinkronisasi data lama is_active ke status
UPDATE public.products SET status = 'active' WHERE is_active = true AND status = 'pending';

-- 2. Setup RLS untuk product_images (Storage)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('product_images', 'product_images', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
END $$;

DROP POLICY IF EXISTS "Public can view product_images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product_images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own product_images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own product_images" ON storage.objects;

CREATE POLICY "Public can view product_images" ON storage.objects
FOR SELECT USING (bucket_id = 'product_images');

CREATE POLICY "Authenticated users can upload product_images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'product_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own product_images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'product_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own product_images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'product_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Setup RLS Policies di tabel Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products are viewable by everyone." ON public.products;
DROP POLICY IF EXISTS "Sellers can manage their own products." ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products." ON public.products;

-- Publik hanya bisa melihat produk yang aktif
CREATE POLICY "Active products are viewable by everyone." ON public.products 
FOR SELECT USING (status = 'active');

-- Penjual bisa melihat semua produk mereka sendiri (termasuk pending/hidden)
CREATE POLICY "Sellers can view own products." ON public.products 
FOR SELECT USING (auth.uid() = seller_id);

-- Penjual bisa insert, update, delete produk mereka sendiri
CREATE POLICY "Sellers can insert own products." ON public.products 
FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products." ON public.products 
FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products." ON public.products 
FOR DELETE USING (auth.uid() = seller_id);

-- Admin bisa melihat dan mengubah semua produk
CREATE POLICY "Admins can view all products." ON public.products 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
);

CREATE POLICY "Admins can update all products." ON public.products 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
);
