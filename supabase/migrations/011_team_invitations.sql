-- Migration 011: Team Invitations and Security Updates

CREATE TABLE IF NOT EXISTS public.team_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('team', 'admin')),
    team_division text,
    invited_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can manage invitations"
    ON public.team_invitations
    FOR ALL
    USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin' );

CREATE POLICY "Anyone can read invitation by token"
    ON public.team_invitations
    FOR SELECT
    USING (true);

-- Protect role elevation via API
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger AS $$
BEGIN
  -- Allow bypassing for internal functions
  IF current_setting('my.bypassing_role_protect', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Only apply when user updates their own profile (or other APIs)
  IF auth.uid() IS NOT NULL THEN
    -- If role or division changed, revert to old values silently
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      NEW.role = OLD.role;
    END IF;
    IF NEW.team_division IS DISTINCT FROM OLD.team_division THEN
      NEW.team_division = OLD.team_division;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.protect_profile_role();

-- Function to claim invite
CREATE OR REPLACE FUNCTION public.claim_team_invite(p_token uuid)
RETURNS boolean AS $$
DECLARE
  v_invite RECORD;
  v_user_email text;
BEGIN
  -- Must be logged in
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Validate token
  SELECT * INTO v_invite FROM public.team_invitations WHERE token = p_token AND expires_at > now();
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get auth user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  -- Verify email matches
  IF v_invite.email <> v_user_email THEN
    RETURN false;
  END IF;

  -- Update profile, bypass protection
  PERFORM set_config('my.bypassing_role_protect', 'true', true);
  
  UPDATE public.profiles SET 
    role = v_invite.role, 
    team_division = v_invite.team_division,
    invited_by = v_invite.invited_by,
    invited_at = now()
  WHERE id = auth.uid();
  
  -- Reset bypass
  PERFORM set_config('my.bypassing_role_protect', 'false', true);

  -- Delete invitation
  DELETE FROM public.team_invitations WHERE id = v_invite.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update handle_new_user to ensure we don't blindly trust raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  mapped_role text;
BEGIN
  -- We now force all new signups to be 'user'. 
  -- Admin/team roles must be claimed via claim_team_invite.
  mapped_role := 'user';

  INSERT INTO public.profiles (
    id, name, role, status
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', new.email), 
    mapped_role,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    status = COALESCE(public.profiles.status, 'active');
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
