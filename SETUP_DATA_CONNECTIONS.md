# Quick Setup: Create data_connections Table

You're seeing an error because the `data_connections` table doesn't exist in your Supabase database yet.

## Fastest Way to Fix:

1. **Open your Supabase Dashboard:**
   https://supabase.com/dashboard/project/cgqqttkxvudnncavvuky/sql/new

2. **Copy this entire SQL block:**

```sql
-- Create data_connections table to store user's data source connections
CREATE TABLE IF NOT EXISTS public.data_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL,
  label TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_data_connections_user_id ON public.data_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_data_connections_last_used ON public.data_connections(last_used DESC);

-- Enable Row Level Security
ALTER TABLE public.data_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own data connections"
  ON public.data_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data connections"
  ON public.data_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data connections"
  ON public.data_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data connections"
  ON public.data_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_data_connections_updated_at
  BEFORE UPDATE ON public.data_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

3. **Paste it in the SQL Editor and click "Run"**

4. **Refresh your app** - The error should be gone!

## What This Creates:

- A table to store your previously used data connections (Google Sheets, Shopify, etc.)
- Security policies so users can only see their own connections
- Automatic timestamp updates

## Verification:

After running the SQL, you can verify it worked by running:
```sql
SELECT * FROM public.data_connections LIMIT 1;
```

This should return an empty result (not an error) if the table was created successfully.