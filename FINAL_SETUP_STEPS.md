# ✅ Billing Setup - Final Steps

## ✅ Completed via Vercel CLI:

1. **Stripe API Keys** - Added to Vercel ✅
   - STRIPE_SECRET_KEY
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  
   - NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY

2. **Supabase Service Role Key** - Added to Vercel ✅
   - SUPABASE_SERVICE_ROLE_KEY

3. **Local Environment** - Updated .env.local ✅

## 🔴 Manual Steps Required:

### 1. Apply Database Migration (5 minutes)
1. Go to: https://supabase.com/dashboard/project/cgqqttkxvudnncavvuky/sql/new
2. Copy ALL contents from: `scripts/apply-billing-migration.sql`
3. Paste into SQL editor
4. Click "Run" button
5. You should see: "Billing migration applied successfully!"

### 2. Set Up Stripe Webhook (5 minutes)
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://data-moodboard-app.vercel.app/api/billing/webhook`
4. Select these events:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   - checkout.session.completed
5. Click "Add endpoint"
6. Click on the webhook you just created
7. Click "Reveal" under Signing secret
8. Copy the secret (starts with `whsec_`)
9. Add to Vercel:
   ```bash
   echo "YOUR_WEBHOOK_SECRET" | vercel env add STRIPE_WEBHOOK_SECRET production
   ```

### 3. Deploy to Production (2 minutes)
```bash
vercel --prod
```

## 🧪 Test Your Setup:

1. **Test Upgrade Flow:**
   - Go to your app
   - Click user menu → Billing
   - Click "Upgrade to Pro"
   - Use test card: 4242 4242 4242 4242
   - Verify subscription is activated

2. **Test Webhook:**
   - In Stripe Dashboard, go to your webhook
   - Click "Send test webhook"
   - Select "checkout.session.completed"
   - Should return 200 OK

3. **Test Portal:**
   - As a Pro user, click "Manage Subscription"
   - Should open Stripe Customer Portal

## 📞 Support:

If you encounter issues:
- Stripe webhook logs: https://dashboard.stripe.com/webhooks
- Vercel logs: `vercel logs`
- Supabase logs: https://supabase.com/dashboard/project/cgqqttkxvudnncavvuky/logs/explorer

---

Your billing system is 90% ready! Just complete the 2 manual steps above (10 minutes total) and you'll have a fully functional subscription system! 🚀