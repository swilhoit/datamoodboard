-- Add preferences column to profiles table for storing user settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON public.profiles USING gin(preferences);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Add billing history table for tracking subscription changes
CREATE TABLE IF NOT EXISTS public.billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'subscription_created', 'subscription_updated', 'subscription_cancelled', 'payment_succeeded', 'payment_failed'
  plan_name TEXT,
  price_id TEXT,
  amount INTEGER, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for billing history
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- Users can only view their own billing history
CREATE POLICY "Users can view own billing history" ON public.billing_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert billing history (via webhook)
CREATE POLICY "System can insert billing history" ON public.billing_history
  FOR INSERT
  WITH CHECK (false);

-- Create function to track billing events
CREATE OR REPLACE FUNCTION public.track_billing_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_plan_name TEXT DEFAULT NULL,
  p_price_id TEXT DEFAULT NULL,
  p_amount INTEGER DEFAULT NULL,
  p_stripe_invoice_id TEXT DEFAULT NULL,
  p_stripe_subscription_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.billing_history (
    user_id,
    event_type,
    plan_name,
    price_id,
    amount,
    stripe_invoice_id,
    stripe_subscription_id,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_plan_name,
    p_price_id,
    p_amount,
    p_stripe_invoice_id,
    p_stripe_subscription_id,
    p_metadata
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Create storage bucket for avatars if not exists
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('avatars', 'avatars', true, false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add function to get user's billing history
CREATE OR REPLACE FUNCTION public.get_billing_history(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  plan_name TEXT,
  amount INTEGER,
  currency TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bh.id,
    bh.event_type,
    bh.plan_name,
    bh.amount,
    bh.currency,
    bh.status,
    bh.created_at
  FROM public.billing_history bh
  WHERE bh.user_id = auth.uid()
  ORDER BY bh.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Add team_id column for future team collaboration features
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS team_id UUID,
ADD COLUMN IF NOT EXISTS team_role TEXT; -- 'owner', 'admin', 'member', 'viewer'

-- Create teams table for future expansion
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  stripe_customer_id TEXT,
  subscription_tier TEXT DEFAULT 'team',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS for teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team members can view their team
CREATE POLICY "Team members can view team" ON public.teams
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT team_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Only team owners can update team settings
CREATE POLICY "Team owners can update team" ON public.teams
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.preferences IS 'User preferences stored as JSONB: emailNotifications, marketingEmails, weeklyReports, darkMode, language, timezone, publicProfile, etc.';
COMMENT ON COLUMN public.billing_history.event_type IS 'Type of billing event: subscription_created, subscription_updated, subscription_cancelled, payment_succeeded, payment_failed';
COMMENT ON TABLE public.teams IS 'Teams table for future team collaboration features';