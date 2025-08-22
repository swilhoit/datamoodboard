# OAuth Setup Guide

This guide explains how to set up OAuth authentication for the various integrations in the Data Moodboard app.

## Shopify OAuth

### Prerequisites
1. A Shopify Partner account
2. A development store or production store

### Setup Steps
1. Create a Shopify app in your Partner Dashboard
2. Set the App URL to your application URL
3. Add the following redirect URI: `https://yourdomain.com/api/auth/shopify/callback`
4. Set the following environment variables:
   ```
   SHOPIFY_APP_API_KEY=your_app_api_key
   SHOPIFY_APP_API_SECRET=your_app_api_secret
   ```

### Required Scopes
- `read_orders`
- `read_products`
- `read_customers`
- `read_inventory`
- `read_analytics`
- `read_reports`
- `read_fulfillments`

## Stripe OAuth

### Prerequisites
1. A Stripe account
2. Access to Stripe Dashboard

### Setup Steps
1. Go to Stripe Dashboard > Settings > Connect settings
2. Add your platform details
3. Add the following redirect URI: `https://yourdomain.com/api/auth/stripe/callback`
4. Set the following environment variables:
   ```
   STRIPE_CLIENT_ID=ca_xxxxxxxxxxxxx
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   ```

### Required Scopes
- `read_write` (for accessing payment data)

## Google Ads OAuth

### Prerequisites
1. Google Cloud Console account
2. Google Ads account
3. OAuth consent screen configured

### Setup Steps

#### Development Setup (Testing)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Google Ads API
4. Configure OAuth consent screen:
   - User Type: External
   - Add test users (your email) to bypass verification during development
5. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/google-ads/callback`
6. Set environment variables:
   ```
   GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_ADS_CLIENT_SECRET=your_client_secret
   ```

#### Production Setup
For production use with non-test users, you must:
1. Complete OAuth consent screen configuration with all required information
2. Add privacy policy and terms of service URLs
3. Submit for Google verification (this can take several weeks)
4. Pass security assessment if requesting sensitive scopes

### Required Scopes
- `https://www.googleapis.com/auth/adwords`

### Verification Requirements
Google requires verification for apps that:
- Request sensitive or restricted scopes
- Have more than 100 users
- Are publicly available

During verification, Google will review:
- Your app's OAuth consent screen
- Privacy policy
- How you handle user data
- Security practices

## Google Sheets OAuth

### Prerequisites
1. Google Cloud Console account
2. Enable Google Sheets API and Drive API

### Setup Steps
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials for Web application
3. Add redirect URI: https://yourdomain.com/api/auth/google-sheets/callback
4. Set env vars:
   GOOGLE_SHEETS_CLIENT_ID=your_client_id
   GOOGLE_SHEETS_CLIENT_SECRET=your_client_secret

### Required Scopes
- https://www.googleapis.com/auth/spreadsheets.readonly
- https://www.googleapis.com/auth/drive.readonly

## Supabase Setup

All OAuth tokens are stored securely in Supabase. Ensure you have the following table:

```sql
CREATE TABLE integration_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own credentials
CREATE POLICY "Users can manage own credentials" ON integration_credentials
  FOR ALL USING (auth.uid() = user_id);
```

Also create the OAuth states table for security:

```sql
CREATE TABLE oauth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clean up old states
CREATE OR REPLACE FUNCTION cleanup_old_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
```

## Environment Variables Summary

Add these to your `.env.local` file:

```bash
# Shopify OAuth
SHOPIFY_APP_API_KEY=your_shopify_api_key
SHOPIFY_APP_API_SECRET=your_shopify_api_secret

# Stripe OAuth
STRIPE_CLIENT_ID=ca_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# Google Ads OAuth
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret

# Google Sheets OAuth
GOOGLE_SHEETS_CLIENT_ID=your_client_id
GOOGLE_SHEETS_CLIENT_SECRET=your_client_secret

# App URL (for callbacks)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Testing OAuth Flows

1. **Shopify**: Use a development store for testing
2. **Stripe**: Use test mode API keys (sk_test_xxx)
3. **Google Ads**: Add your email as a test user in Google Cloud Console

## Troubleshooting

### Google OAuth "doesn't comply" error
- Add your email as a test user in Google Cloud Console
- Or submit for verification for production use

### Shopify redirect issues
- Ensure your app URL is correctly configured in Partner Dashboard
- Check that redirect URI matches exactly

### Stripe connection issues
- Verify your platform settings in Stripe Dashboard
- Ensure redirect URI is added to Connect settings