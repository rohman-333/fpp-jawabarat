-- Migration 026: Programs CRUD

CREATE TABLE IF NOT EXISTS public.programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    image_url text,
    category text,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    starts_at timestamptz,
    ends_at timestamptz,
    location text,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can see published programs"
ON public.programs FOR SELECT
USING (status = 'published');

CREATE POLICY "Admin/Superadmin/Team can manage programs"
ON public.programs
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);
