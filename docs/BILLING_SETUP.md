# Billing System Setup Guide

## Overview
The Data Moodboard application includes a complete billing system integration with Stripe for subscription management.

## Features
- Free and Pro subscription tiers
- Stripe Checkout for upgrades
- Stripe Customer Portal for subscription management
- Billing history tracking
- Usage analytics and limits
- Automatic webhook handling for subscription lifecycle

## Setup Instructions

### 1. Stripe Configuration

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Create products and prices:
   - Free Plan: $0/month
   - Pro Plan: $29/month (price_1QidMgLO5PJjRdJuEoXLHxRY)

### 2. Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_1QidMgLO5PJjRdJuEoXLHxRY

# Supabase Service Role (for webhooks)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Database Setup

Apply the billing history migration:

```sql
-- Run the migration in supabase/migrations/20250821_billing_history.sql
-- This creates:
-- - billing_events table for transaction history
-- - get_billing_history() function for fetching user's billing history
-- - record_billing_event() function for webhook use
```

### 4. Stripe Webhook Setup

1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/billing/webhook`
3. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
4. Copy the webhook signing secret to STRIPE_WEBHOOK_SECRET

### 5. Testing

For local testing with Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/billing/webhook

# Use the webhook secret provided by the CLI
```

## User Flows

### Upgrading to Pro
1. User clicks "Upgrade to Pro" in BillingModal
2. Redirected to Stripe Checkout
3. Completes payment
4. Webhook updates user profile to Pro tier
5. User redirected back with success message

### Managing Subscription
1. Pro users click "Manage Subscription"
2. Redirected to Stripe Customer Portal
3. Can update payment method, download invoices, or cancel

### Downgrading/Canceling
1. Pro users access Stripe Customer Portal
2. Cancel subscription
3. Webhook updates user profile to Free tier at period end

## Tier Limits

### Free Tier
- 5 AI images per month
- 1 dashboard
- 3 data tables
- Basic features

### Pro Tier ($29/month)
- 100 AI images per month
- Unlimited dashboards
- Unlimited data tables
- Advanced features
- Priority support
- API access

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Verify webhook endpoint URL
   - Check webhook signing secret
   - Ensure service role key is configured

2. **User not upgraded after payment**
   - Check webhook logs in Stripe Dashboard
   - Verify user metadata is passed in checkout session
   - Check Supabase profiles table for updates

3. **Billing history not showing**
   - Ensure billing_events table exists
   - Verify RPC function is created
   - Check if events are being recorded via webhook

## API Endpoints

### `/api/billing/checkout`
Creates a Stripe Checkout session for upgrading to Pro

### `/api/billing/portal`
Creates a Stripe Customer Portal session for subscription management

### `/api/billing/webhook`
Handles Stripe webhook events for subscription lifecycle

## Security Considerations

- Always verify webhook signatures
- Use service role key only on server-side
- Never expose secret keys in client code
- Implement proper error handling
- Log webhook events for auditing

## Next Steps

1. Configure production Stripe keys
2. Set up proper webhook endpoint in production
3. Test complete upgrade/downgrade flows
4. Monitor webhook delivery in Stripe Dashboard
5. Set up alerting for failed payments