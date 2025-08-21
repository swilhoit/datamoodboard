# ✅ Billing Setup Checklist

## Completed
- [x] Added Stripe live keys to .env.local
  - `STRIPE_SECRET_KEY` ✅
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ✅

## Required Actions

### 1. Get Supabase Service Role Key
- [ ] Go to: https://supabase.com/dashboard/project/cgqqttkxvudnncavvuky/settings/api
- [ ] Copy the `service_role` key (NOT the anon key)
- [ ] Update `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=<your_key>`

### 2. Set Up Stripe Webhook
- [ ] Run: `./scripts/setup-stripe-webhook.sh` and follow instructions
- [ ] For production: Add webhook at https://dashboard.stripe.com/webhooks
  - Endpoint URL: `https://data-moodboard-app.vercel.app/api/billing/webhook`
  - Events: subscription.*, invoice.*, checkout.session.completed
- [ ] Copy webhook signing secret to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_...`

### 3. Apply Database Migration
- [ ] Go to: https://supabase.com/dashboard/project/cgqqttkxvudnncavvuky/sql/new
- [ ] Copy contents of `scripts/apply-billing-migration.sql`
- [ ] Run the SQL query
- [ ] Verify tables created: `billing_events`

### 4. Deploy to Vercel
- [ ] Add environment variables to Vercel:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`
- [ ] Deploy: `vercel --prod`

### 5. Test the Flow
- [ ] Test upgrade from Free to Pro
- [ ] Verify webhook receives events
- [ ] Check billing history displays
- [ ] Test subscription management portal
- [ ] Test downgrade/cancellation

## Important URLs
- Supabase Dashboard: https://supabase.com/dashboard/project/cgqqttkxvudnncavvuky
- Stripe Dashboard: https://dashboard.stripe.com
- Vercel Project: https://vercel.com/dashboard/project/data-moodboard-app

## Support
If you encounter issues:
1. Check Stripe webhook logs for delivery status
2. Verify all environment variables are set
3. Check Supabase logs for database errors
4. Test with Stripe test mode first