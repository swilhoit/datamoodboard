-- First, drop the existing trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company TEXT,
  role TEXT,
  -- Billing fields
  stripe_customer_id TEXT,
  subscription_status TEXT, -- e.g. active, past_due, canceled, trialing
  subscription_tier TEXT, -- e.g. free, pro, team
  subscription_price_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User data tables (imported data from various sources)
CREATE TABLE IF NOT EXISTS user_data_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL, -- 'googlesheets', 'csv', 'api', 'database', 'shopify', 'stripe'
  source_config JSONB, -- Connection details, spreadsheet ID, etc.
  data JSONB NOT NULL, -- The actual data
  schema JSONB, -- Column definitions
  row_count INTEGER,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active', -- 'active', 'paused', 'error'
  sync_frequency TEXT, -- 'manual', 'hourly', 'daily', 'weekly'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data transformations (aggregations, filters, joins)
CREATE TABLE IF NOT EXISTS data_transformations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_table_ids UUID[] NOT NULL, -- Array of source table IDs
  transform_type TEXT NOT NULL, -- 'filter', 'aggregate', 'join', 'pivot', 'custom'
  transform_config JSONB NOT NULL, -- Configuration for the transformation
  result_data JSONB, -- Cached result
  result_schema JSONB,
  is_cached BOOLEAN DEFAULT false,
  cache_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved dashboards
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  is_public BOOLEAN DEFAULT false,
  canvas_mode TEXT DEFAULT 'design', -- 'design' or 'data'
  canvas_items JSONB NOT NULL, -- Array of visualization items (charts, tables)
  canvas_elements JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of canvas elements (text, images, shapes, gifs, emojis, marker strokes)
  data_tables JSONB, -- Referenced data tables
  connections JSONB, -- Data flow connections
  canvas_background JSONB, -- Background settings
  theme TEXT DEFAULT 'light',
  thumbnail_url TEXT,
  view_count INTEGER DEFAULT 0,
  -- New sharing/state fields
  state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  state JSONB,
  is_unlisted BOOLEAN DEFAULT false,
  share_slug TEXT,
  allow_comments BOOLEAN DEFAULT false,
  allow_downloads BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard templates
CREATE TABLE IF NOT EXISTS dashboard_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'business', 'marketing', 'sales', 'analytics'
  thumbnail_url TEXT,
  canvas_items JSONB NOT NULL,
  required_data_schema JSONB, -- Expected data structure
  is_featured BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User saved charts/visualizations
CREATE TABLE IF NOT EXISTS saved_charts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  chart_type TEXT NOT NULL, -- 'line', 'bar', 'pie', etc.
  chart_library TEXT NOT NULL, -- 'recharts', 'chartjs', 'plotly', etc.
  data_source_id UUID REFERENCES user_data_tables(id),
  transform_id UUID REFERENCES data_transformations(id),
  config JSONB NOT NULL, -- Chart configuration
  position JSONB, -- x, y, width, height
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys for external data sources
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL, -- 'shopify', 'stripe', 'custom'
  key_name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  permissions JSONB,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'data_import', 'dashboard_create', 'chart_update', etc.
  resource_type TEXT, -- 'dashboard', 'data_table', 'chart'
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_data_tables_user_id ON user_data_tables(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_slug ON dashboards(slug);
CREATE INDEX IF NOT EXISTS idx_dashboards_share_slug ON dashboards(share_slug);
CREATE INDEX IF NOT EXISTS idx_saved_charts_user_id ON saved_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_charts_dashboard_id ON saved_charts(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own data tables" ON user_data_tables;
DROP POLICY IF EXISTS "Users can create their own data tables" ON user_data_tables;
DROP POLICY IF EXISTS "Users can update their own data tables" ON user_data_tables;
DROP POLICY IF EXISTS "Users can delete their own data tables" ON user_data_tables;
DROP POLICY IF EXISTS "Users can view their own dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can create their own dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can update their own dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can delete their own dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can manage their own transformations" ON data_transformations;
DROP POLICY IF EXISTS "Users can manage their own charts" ON saved_charts;
DROP POLICY IF EXISTS "Users can manage their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view their own activity" ON activity_log;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- IMPORTANT: Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User data tables policies
CREATE POLICY "Users can view their own data tables" ON user_data_tables
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data tables" ON user_data_tables
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data tables" ON user_data_tables
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data tables" ON user_data_tables
  FOR DELETE USING (auth.uid() = user_id);

-- Dashboards policies
CREATE POLICY "Users can view their own dashboards" ON dashboards
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own dashboards" ON dashboards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboards" ON dashboards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboards" ON dashboards
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can manage their own transformations" ON data_transformations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own charts" ON saved_charts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_data_tables_updated_at ON user_data_tables;
CREATE TRIGGER update_user_data_tables_updated_at BEFORE UPDATE ON user_data_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboards_updated_at ON dashboards;
CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_charts_updated_at ON saved_charts;
CREATE TRIGGER update_saved_charts_updated_at BEFORE UPDATE ON saved_charts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FIXED: Simpler profile creation function that handles errors better
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure billing columns exist even if profiles table already existed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_price_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cancel_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;