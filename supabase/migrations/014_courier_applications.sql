-- Migration 014: Courier Applications

CREATE TABLE IF NOT EXISTS public.courier_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name text NOT NULL,
    whatsapp text NOT NULL,
    service_area text NOT NULL,
    vehicle_type text NOT NULL,
    license_plate text,
    experience text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason text,
    reviewed_by uuid REFERENCES public.profiles(id),
    reviewed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS for courier_applications
ALTER TABLE public.courier_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own courier application"
    ON public.courier_applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own courier application"
    ON public.courier_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all courier applications"
    ON public.courier_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('superadmin', 'admin', 'team')
        )
    );

CREATE POLICY "Admins can update courier applications"
    ON public.courier_applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('superadmin', 'admin', 'team')
        )
    );

-- Trigger to update profile is_courier and courier_status automatically
CREATE OR REPLACE FUNCTION public.update_profile_courier_status()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    PERFORM set_config('my.bypassing_role_protect', 'true', true);
    
    UPDATE public.profiles
    SET 
      is_courier = (NEW.status = 'approved'),
      courier_status = NEW.status
    WHERE id = NEW.user_id;

    PERFORM set_config('my.bypassing_role_protect', 'false', true);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_courier_status_change ON public.courier_applications;
CREATE TRIGGER on_courier_status_change
AFTER INSERT OR UPDATE ON public.courier_applications
FOR EACH ROW
EXECUTE PROCEDURE public.update_profile_courier_status();

NOTIFY pgrst, 'reload schema';
