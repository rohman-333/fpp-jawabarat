-- Migration 013: Complete Pesantren Application Fields

-- Update pesantren table
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS hp text;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS lembaga_formal boolean DEFAULT false;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS santri_sd integer DEFAULT 0;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS santri_smp integer DEFAULT 0;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS santri_sma integer DEFAULT 0;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS guru_ustadz integer DEFAULT 0;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS media_sosial text;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS koperasi_bmt_usaha text;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS saran_pemda text;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS harapan_pemda_forum text;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Set created_by equal to profile_id for existing records
UPDATE public.pesantren SET created_by = profile_id WHERE created_by IS NULL;

-- Trigger to auto-update profile has_pesantren and pesantren_id when application is approved
CREATE OR REPLACE FUNCTION public.update_profile_pesantren_status()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    PERFORM set_config('my.bypassing_role_protect', 'true', true);
    
    UPDATE public.profiles
    SET 
      has_pesantren = (NEW.status = 'verified'),
      pesantren_id = CASE WHEN NEW.status = 'verified' THEN NEW.id ELSE pesantren_id END
    WHERE id = NEW.profile_id;

    PERFORM set_config('my.bypassing_role_protect', 'false', true);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_pesantren_status_change ON public.pesantren;
CREATE TRIGGER on_pesantren_status_change
AFTER INSERT OR UPDATE ON public.pesantren
FOR EACH ROW
EXECUTE PROCEDURE public.update_profile_pesantren_status();

NOTIFY pgrst, 'reload schema';
