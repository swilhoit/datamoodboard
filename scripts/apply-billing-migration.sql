-- Run this script in the Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/cgqqttkxvudnncavvuky/sql/new

-- Create billing_events table to track Stripe events
CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  event_type TEXT NOT NULL,
  amount INTEGER, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT,
  description TEXT,
  metadata JSONB,
  stripe_event_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON public.billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON public.billing_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_customer ON public.billing_events(stripe_customer_id);

-- Enable RLS
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own billing history
DROP POLICY IF EXISTS "Users can view own billing history" ON public.billing_events;
CREATE POLICY "Users can view own billing history" ON public.billing_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert billing events
DROP POLICY IF EXISTS "System can insert billing events" ON public.billing_events;
CREATE POLICY "System can insert billing events" ON public.billing_events
  FOR INSERT
  WITH CHECK (false);

-- Create function to get billing history
CREATE OR REPLACE FUNCTION public.get_billing_history(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  amount INTEGER,
  currency TEXT,
  status TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    be.id,
    be.event_type,
    be.amount,
    be.currency,
    be.status,
    be.description,
    be.created_at
  FROM public.billing_events be
  WHERE be.user_id = auth.uid()
  ORDER BY be.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_billing_history(INTEGER) TO authenticated;

-- Create function to record billing event (for webhook use)
CREATE OR REPLACE FUNCTION public.record_billing_event(
  p_user_id UUID,
  p_stripe_customer_id TEXT,
  p_event_type TEXT,
  p_amount INTEGER,
  p_currency TEXT,
  p_status TEXT,
  p_description TEXT,
  p_stripe_event_id TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.billing_events (
    user_id,
    stripe_customer_id,
    event_type,
    amount,
    currency,
    status,
    description,
    stripe_event_id,
    metadata
  ) VALUES (
    p_user_id,
    p_stripe_customer_id,
    p_event_type,
    p_amount,
    p_currency,
    p_status,
    p_description,
    p_stripe_event_id,
    p_metadata
  )
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Grant execute permission to service role only
GRANT EXECUTE ON FUNCTION public.record_billing_event(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- Success message
SELECT 'Billing migration applied successfully!' as message;