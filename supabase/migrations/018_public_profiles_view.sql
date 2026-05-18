-- Migration 018: Public Profiles View
-- Safely expose public profile data to avoid RLS restrictions blocking /u/[username]

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  name,
  username,
  avatar_url,
  bio,
  location,
  role,
  has_pesantren,
  is_seller,
  is_courier,
  created_at
FROM public.profiles;

-- Grant permissions to access the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
