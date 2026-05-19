-- Migration 044: Add Ads tracking and description columns to site_banners
-- Idempotent patch migration

ALTER TABLE public.site_banners ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.site_banners ADD COLUMN IF NOT EXISTS target_url text;
ALTER TABLE public.site_banners ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;
ALTER TABLE public.site_banners ADD COLUMN IF NOT EXISTS impression_count integer DEFAULT 0;
ALTER TABLE public.site_banners ADD COLUMN IF NOT EXISTS click_count integer DEFAULT 0;

-- Comments for documentation
COMMENT ON COLUMN public.site_banners.description IS 'Deskripsi atau narasi singkat iklan sponsored content';
COMMENT ON COLUMN public.site_banners.target_url IS 'URL tujuan ketika iklan sponsored content diklik oleh pengguna';
COMMENT ON COLUMN public.site_banners.impression_count IS 'Jumlah penayangan / impresi unik iklan di feed/berita';
COMMENT ON COLUMN public.site_banners.click_count IS 'Jumlah klik pada iklan sponsored content oleh pengguna';
COMMENT ON COLUMN public.site_banners.priority IS 'Prioritas kemunculan banner/iklan di feed';
