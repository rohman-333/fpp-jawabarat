-- Migration 023: Content Ads & Banners

CREATE TABLE IF NOT EXISTS public.site_banners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text,
    subtitle text,
    image_url text NOT NULL,
    cta_label text,
    cta_url text,
    placement text NOT NULL DEFAULT 'landing_hero', -- landing_hero, marketplace_hero, feed_inline, sidebar, pesantren_detail
    sponsor_name text,
    sponsor_url text,
    is_sponsored boolean DEFAULT false,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    starts_at timestamptz,
    ends_at timestamptz,
    sort_order integer DEFAULT 0,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua orang bisa melihat banner aktif"
ON public.site_banners FOR SELECT
USING (status = 'active');

CREATE POLICY "Admin/Superadmin/Team bisa kelola banner"
ON public.site_banners
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);
