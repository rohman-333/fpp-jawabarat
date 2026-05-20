-- Migration 054: Add Media and Status Columns to social_stories
-- Description: Supports upload_status and media urls for stories in social feed.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='social_stories' AND column_name='image_url') THEN
    ALTER TABLE public.social_stories ADD COLUMN image_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='social_stories' AND column_name='video_url') THEN
    ALTER TABLE public.social_stories ADD COLUMN video_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='social_stories' AND column_name='status') THEN
    ALTER TABLE public.social_stories ADD COLUMN status text DEFAULT 'active';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='social_stories' AND column_name='upload_status') THEN
    ALTER TABLE public.social_stories ADD COLUMN upload_status text DEFAULT 'completed';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
