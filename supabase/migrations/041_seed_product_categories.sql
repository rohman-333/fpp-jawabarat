-- Migration 041: Seed Product Categories

CREATE TABLE IF NOT EXISTS public.product_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text UNIQUE,
    is_active boolean DEFAULT true,
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Categories viewable by everyone') THEN
    CREATE POLICY "Categories viewable by everyone" ON public.product_categories
    FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage categories') THEN
    CREATE POLICY "Admins can manage categories" ON public.product_categories
    FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) IN ('superadmin', 'admin') );
  END IF;
END $$;

-- Insert seed data safely
INSERT INTO public.product_categories (name, slug, sort_order) VALUES
('Fashion & Pakaian', 'fashion-pakaian', 1),
('Makanan & Minuman', 'makanan-minuman', 2),
('Kitab & Buku', 'kitab-buku', 3),
('Kerajinan', 'kerajinan', 4),
('Kesehatan', 'kesehatan', 5),
('Elektronik', 'elektronik', 6),
('Jasa', 'jasa', 7),
('Lainnya', 'lainnya', 8)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;

NOTIFY pgrst, 'reload schema';
