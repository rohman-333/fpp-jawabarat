-- Migration 020: Set Superadmin
-- Update target email to grant superadmin role

UPDATE public.profiles p
SET role = 'superadmin'
FROM auth.users u
WHERE u.id = p.id AND u.email = 'alidrisiyah03@gmail.com';
