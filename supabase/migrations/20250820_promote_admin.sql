-- Promote a specific user to admin by email
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'tetrahedronglobal@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    UPDATE public.profiles SET role = 'admin', subscription_tier = 'pro' WHERE id = v_user_id;
  END IF;
END $$;


