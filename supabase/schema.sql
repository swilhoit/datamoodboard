-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User data tables (imported data from various sources)
CREATE TABLE user_data_tables (
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
CREATE TABLE data_transformations (
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
CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  is_public BOOLEAN DEFAULT false,
  canvas_mode TEXT DEFAULT 'design', -- 'design' or 'data'
  canvas_items JSONB NOT NULL, -- Array of canvas items (charts, text, shapes)
  data_tables JSONB, -- Referenced data tables
  connections JSONB, -- Data flow connections
  canvas_background JSONB, -- Background settings
  theme TEXT DEFAULT 'light',
  thumbnail_url TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard templates
CREATE TABLE dashboard_templates (
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
CREATE TABLE saved_charts (
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
CREATE TABLE api_keys (
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
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'data_import', 'dashboard_create', 'chart_update', etc.
  resource_type TEXT, -- 'dashboard', 'data_table', 'chart'
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_data_tables_user_id ON user_data_tables(user_id);
CREATE INDEX idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX idx_dashboards_slug ON dashboards(slug);
CREATE INDEX idx_saved_charts_user_id ON saved_charts(user_id);
CREATE INDEX idx_saved_charts_dashboard_id ON saved_charts(dashboard_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

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
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_data_tables_updated_at BEFORE UPDATE ON user_data_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_charts_updated_at BEFORE UPDATE ON saved_charts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();