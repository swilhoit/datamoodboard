-- Admin helpers and unlimited usage for admins

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_role TEXT;
BEGIN
  IF v_user IS NULL THEN
    RETURN FALSE;
  END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = v_user;
  RETURN v_role = 'admin';
END;
$$;

-- Update AI image limit functions to grant unlimited to admins
CREATE OR REPLACE FUNCTION public.get_ai_image_limits()
RETURNS TABLE (used INTEGER, daily_limit INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_tier TEXT;
  v_limit INTEGER;
  v_free_limit INTEGER;
  v_pro_limit INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF public.is_admin() THEN
    RETURN QUERY SELECT 0, 1000000; -- effectively unlimited
    RETURN;
  END IF;

  SELECT COALESCE(subscription_tier, 'free') INTO v_tier FROM public.profiles WHERE id = v_user;
  SELECT COALESCE((SELECT value::INTEGER FROM public.app_settings WHERE key = 'ai_free_daily_limit'), 10) INTO v_free_limit;
  SELECT COALESCE((SELECT value::INTEGER FROM public.app_settings WHERE key = 'ai_pro_daily_limit'), 50) INTO v_pro_limit;
  v_limit := CASE WHEN v_tier = 'pro' THEN v_pro_limit ELSE v_free_limit END;

  RETURN QUERY
  SELECT COALESCE(u.used, 0) AS used, v_limit AS daily_limit
  FROM public.ai_image_usage u
  WHERE u.user_id = v_user AND u.usage_date = CURRENT_DATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, v_limit;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_ai_image_usage()
RETURNS TABLE (allowed BOOLEAN, used INTEGER, daily_limit INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_tier TEXT;
  v_limit INTEGER;
  v_free_limit INTEGER;
  v_pro_limit INTEGER;
  v_used INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF public.is_admin() THEN
    RETURN QUERY SELECT TRUE, 0, 1000000;
    RETURN;
  END IF;

  SELECT COALESCE(subscription_tier, 'free') INTO v_tier FROM public.profiles WHERE id = v_user;
  SELECT COALESCE((SELECT value::INTEGER FROM public.app_settings WHERE key = 'ai_free_daily_limit'), 10) INTO v_free_limit;
  SELECT COALESCE((SELECT value::INTEGER FROM public.app_settings WHERE key = 'ai_pro_daily_limit'), 50) INTO v_pro_limit;
  v_limit := CASE WHEN v_tier = 'pro' THEN v_pro_limit ELSE v_free_limit END;

  INSERT INTO public.ai_image_usage (user_id, usage_date, used)
  VALUES (v_user, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  UPDATE public.ai_image_usage
  SET used = used + 1, updated_at = NOW()
  WHERE user_id = v_user AND usage_date = CURRENT_DATE AND used < v_limit
  RETURNING used INTO v_used;

  IF NOT FOUND THEN
    SELECT used INTO v_used FROM public.ai_image_usage WHERE user_id = v_user AND usage_date = CURRENT_DATE;
    RETURN QUERY SELECT FALSE, COALESCE(v_used, 0), v_limit;
  ELSE
    RETURN QUERY SELECT TRUE, v_used, v_limit;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_ai_image_usage()
RETURNS TABLE (used INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_used INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF public.is_admin() THEN
    RETURN QUERY SELECT 0; -- no-op for admins
    RETURN;
  END IF;

  UPDATE public.ai_image_usage
  SET used = GREATEST(used - 1, 0), updated_at = NOW()
  WHERE user_id = v_user AND usage_date = CURRENT_DATE AND used > 0
  RETURNING used INTO v_used;

  IF NOT FOUND THEN
    SELECT used INTO v_used FROM public.ai_image_usage WHERE user_id = v_user AND usage_date = CURRENT_DATE;
    RETURN QUERY SELECT COALESCE(v_used, 0);
  ELSE
    RETURN QUERY SELECT v_used;
  END IF;
END;
$$;


