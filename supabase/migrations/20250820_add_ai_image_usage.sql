-- Daily AI image usage tracking

-- Table to track per-user daily AI image generation usage
CREATE TABLE IF NOT EXISTS public.ai_image_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, usage_date)
);

-- Index for faster lookups by user and date
CREATE INDEX IF NOT EXISTS idx_ai_image_usage_user_date ON public.ai_image_usage(user_id, usage_date);

-- Enable RLS and add policies
ALTER TABLE public.ai_image_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own ai_image_usage" ON public.ai_image_usage;
CREATE POLICY "Users can manage their own ai_image_usage" ON public.ai_image_usage
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Helper: get today's limit based on subscription tier
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
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(subscription_tier, 'free') INTO v_tier FROM public.profiles WHERE id = v_user;
  v_limit := CASE WHEN v_tier = 'pro' THEN 50 ELSE 10 END;

  RETURN QUERY
  SELECT COALESCE(u.used, 0) AS used, v_limit AS daily_limit
  FROM public.ai_image_usage u
  WHERE u.user_id = v_user AND u.usage_date = CURRENT_DATE;

  -- If no row exists, still return 0/v_limit
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, v_limit;
  END IF;
END;
$$;

-- Atomically increment usage if under limit. Returns whether increment succeeded and the new used/count/limit
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
  v_used INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(subscription_tier, 'free') INTO v_tier FROM public.profiles WHERE id = v_user;
  v_limit := CASE WHEN v_tier = 'pro' THEN 50 ELSE 10 END;

  -- Ensure a row exists for today
  INSERT INTO public.ai_image_usage (user_id, usage_date, used)
  VALUES (v_user, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  -- Try to increment only if below limit
  UPDATE public.ai_image_usage
  SET used = used + 1, updated_at = NOW()
  WHERE user_id = v_user AND usage_date = CURRENT_DATE AND used < v_limit
  RETURNING used INTO v_used;

  IF NOT FOUND THEN
    -- At or above limit
    SELECT used INTO v_used FROM public.ai_image_usage WHERE user_id = v_user AND usage_date = CURRENT_DATE;
    RETURN QUERY SELECT FALSE, COALESCE(v_used, 0), v_limit;
  ELSE
    RETURN QUERY SELECT TRUE, v_used, v_limit;
  END IF;
END;
$$;

-- Decrement usage for today (used for rollback on failure)
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

  UPDATE public.ai_image_usage
  SET used = GREATEST(used - 1, 0), updated_at = NOW()
  WHERE user_id = v_user AND usage_date = CURRENT_DATE AND used > 0
  RETURNING used INTO v_used;

  IF NOT FOUND THEN
    -- No row or already zero
    SELECT used INTO v_used FROM public.ai_image_usage WHERE user_id = v_user AND usage_date = CURRENT_DATE;
    RETURN QUERY SELECT COALESCE(v_used, 0);
  ELSE
    RETURN QUERY SELECT v_used;
  END IF;
END;
$$;


