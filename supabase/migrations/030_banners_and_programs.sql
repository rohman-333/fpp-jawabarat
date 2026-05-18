-- Migration 030: Banners and Programs Enhancements

-- 1. Create or Update site_banners table
CREATE TABLE IF NOT EXISTS public.site_banners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text,
    subtitle text,
    image_url text NOT NULL,
    cta_label text,
    cta_url text,
    placement text NOT NULL,
    sponsor_name text,
    sponsor_url text,
    is_sponsored boolean DEFAULT false,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    starts_at timestamptz,
    ends_at timestamptz,
    sort_order integer DEFAULT 0,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS for site_banners
ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active banners" ON public.site_banners;
CREATE POLICY "Public can view active banners"
ON public.site_banners FOR SELECT
USING (status = 'active');

DROP POLICY IF EXISTS "Admin can view all banners" ON public.site_banners;
CREATE POLICY "Admin can view all banners"
ON public.site_banners FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

DROP POLICY IF EXISTS "Admin can insert banners" ON public.site_banners;
CREATE POLICY "Admin can insert banners"
ON public.site_banners FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

DROP POLICY IF EXISTS "Admin can update banners" ON public.site_banners;
CREATE POLICY "Admin can update banners"
ON public.site_banners FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

DROP POLICY IF EXISTS "Admin can delete banners" ON public.site_banners;
CREATE POLICY "Admin can delete banners"
ON public.site_banners FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

-- 2. Create or Update programs table
CREATE TABLE IF NOT EXISTS public.programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Add columns safely to programs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='title') THEN
        ALTER TABLE public.programs ADD COLUMN title text NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='slug') THEN
        ALTER TABLE public.programs ADD COLUMN slug text;
        ALTER TABLE public.programs ADD CONSTRAINT programs_slug_key UNIQUE (slug);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='description') THEN
        ALTER TABLE public.programs ADD COLUMN description text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='image_url') THEN
        ALTER TABLE public.programs ADD COLUMN image_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='category') THEN
        ALTER TABLE public.programs ADD COLUMN category text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='status') THEN
        ALTER TABLE public.programs ADD COLUMN status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='starts_at') THEN
        ALTER TABLE public.programs ADD COLUMN starts_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='ends_at') THEN
        ALTER TABLE public.programs ADD COLUMN ends_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='location') THEN
        ALTER TABLE public.programs ADD COLUMN location text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='created_by') THEN
        ALTER TABLE public.programs ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='created_at') THEN
        ALTER TABLE public.programs ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='updated_at') THEN
        ALTER TABLE public.programs ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- RLS for programs
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published programs" ON public.programs;
CREATE POLICY "Public can view published programs"
ON public.programs FOR SELECT
USING (status = 'published');

DROP POLICY IF EXISTS "Admin can view all programs" ON public.programs;
CREATE POLICY "Admin can view all programs"
ON public.programs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

DROP POLICY IF EXISTS "Admin can insert programs" ON public.programs;
CREATE POLICY "Admin can insert programs"
ON public.programs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

DROP POLICY IF EXISTS "Admin can update programs" ON public.programs;
CREATE POLICY "Admin can update programs"
ON public.programs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

DROP POLICY IF EXISTS "Admin can delete programs" ON public.programs;
CREATE POLICY "Admin can delete programs"
ON public.programs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);
