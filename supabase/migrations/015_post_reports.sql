-- Migration 015: Post Reports

CREATE TABLE IF NOT EXISTS public.post_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
    reporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason text NOT NULL CHECK (reason IN ('spam', 'konten_tidak_pantas', 'penipuan', 'ujaran_kebencian', 'informasi_palsu', 'lainnya')),
    details text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'ignored', 'resolved')),
    created_at timestamptz DEFAULT now(),
    reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    UNIQUE(post_id, reporter_id)
);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- RLS for post_reports
CREATE POLICY "user login bisa membuat laporan"
ON public.post_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "user bisa melihat laporan miliknya sendiri"
ON public.post_reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "admin/superadmin/team bisa melihat semua laporan"
ON public.post_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

CREATE POLICY "admin/superadmin/team bisa update status laporan"
ON public.post_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

-- Update social_posts policy so user can see their own hidden posts
DROP POLICY IF EXISTS "user bisa membaca post miliknya sendiri" ON public.social_posts;
CREATE POLICY "user bisa membaca post miliknya sendiri"
ON public.social_posts FOR SELECT
USING (auth.uid() = author_id);
