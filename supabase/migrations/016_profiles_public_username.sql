-- Migration 016: Auto-generate usernames for profiles

-- Ensure username column exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create a function to generate a slugified username from a name or email
CREATE OR REPLACE FUNCTION generate_username(full_name TEXT, user_email TEXT, user_id UUID) 
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    new_username TEXT;
    counter INT := 0;
BEGIN
    -- Try name first, then email, then fallback
    IF full_name IS NOT NULL AND trim(full_name) != '' THEN
        base_slug := lower(regexp_replace(full_name, '[^a-zA-Z0-9]', '', 'g'));
    ELSIF user_email IS NOT NULL AND trim(user_email) != '' THEN
        base_slug := lower(regexp_replace(split_part(user_email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
    ELSE
        base_slug := 'user';
    END IF;

    IF length(base_slug) = 0 THEN
        base_slug := 'user';
    END IF;

    -- Make sure base_slug is at least 3 chars if possible
    IF length(base_slug) < 3 THEN
        base_slug := base_slug || substr(replace(user_id::text, '-', ''), 1, 3 - length(base_slug));
    END IF;

    new_username := base_slug;
    
    -- Loop until we find a unique username
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username AND id != user_id) LOOP
        counter := counter + 1;
        new_username := base_slug || counter::TEXT;
    END LOOP;
    
    RETURN new_username;
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles that don't have a username
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT p.id, p.name, u.email 
             FROM public.profiles p
             LEFT JOIN auth.users u ON u.id = p.id
             WHERE p.username IS NULL OR p.username = ''
    LOOP
        UPDATE public.profiles 
        SET username = generate_username(r.name, r.email, r.id)
        WHERE id = r.id;
    END LOOP;
END $$;
