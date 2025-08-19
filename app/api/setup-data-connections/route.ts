import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', {
      query: `
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
      `
    })
    
    if (error) {
      console.error('Error creating table:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'data_connections table created successfully!' 
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to create table' 
    }, { status: 500 })
  }
}