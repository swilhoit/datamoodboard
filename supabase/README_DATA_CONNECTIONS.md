# Setting up the data_connections table

The application uses a `data_connections` table to store previously used data source connections for easy re-use.

## To create this table in your Supabase project:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to the SQL Editor (left sidebar)
4. Click "New query"
5. Copy and paste the entire contents of `create_data_connections_table.sql`
6. Click "Run" to execute the SQL

## What this creates:

- **data_connections table**: Stores user's data source connections with configuration
- **Row Level Security (RLS)**: Ensures users can only see/edit their own connections
- **Automatic timestamps**: Updates `updated_at` field on every change
- **Indexes**: Optimizes queries for user_id and last_used fields

## Table structure:

- `id`: Unique identifier for each connection
- `user_id`: Reference to the user who owns this connection
- `source_type`: Type of data source (googlesheets, shopify, stripe, etc.)
- `label`: User-friendly name for the connection
- `config`: JSON configuration for reconnecting to the source
- `last_used`: Timestamp of when this connection was last used
- `created_at`: When the connection was first saved
- `updated_at`: When the connection was last modified

## Troubleshooting:

If you see "Could not find the table 'public.data_connections' in the schema cache" error:
1. Run the SQL script above in your Supabase SQL Editor
2. Wait a few seconds for the schema to update
3. Refresh your application

## To verify the table was created:

Run this query in the SQL Editor:
```sql
SELECT * FROM public.data_connections LIMIT 1;
```