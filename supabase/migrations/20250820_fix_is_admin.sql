-- Harden is_admin to handle both profiles.id and profiles.user_id, and allow whitelisted admin emails
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_role TEXT;
  v_email TEXT;
BEGIN
  IF v_user IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Email whitelist fallback (make sure to keep list minimal)
  SELECT email INTO v_email FROM auth.users WHERE id = v_user;
  IF v_email IN ('tetrahedronglobal@gmail.com') THEN
    RETURN TRUE;
  END IF;

  -- Try id-based profile
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='id') THEN
    SELECT role INTO v_role FROM public.profiles WHERE id = v_user;
    IF v_role = 'admin' THEN RETURN TRUE; END IF;
  END IF;

  -- Try user_id-based profile
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='user_id') THEN
    SELECT role INTO v_role FROM public.profiles WHERE user_id = v_user;
    IF v_role = 'admin' THEN RETURN TRUE; END IF;
  END IF;

  RETURN FALSE;
END;
$$;


