# Stripe Webhook Setup Instructions

## Production Webhook Setup

1. **Go to Stripe Dashboard Webhooks:**
   https://dashboard.stripe.com/webhooks

2. **Click "Add endpoint"**

3. **Enter these details:**
   - **Endpoint URL:** `https://data-moodboard-app.vercel.app/api/billing/webhook`
   - Or use your custom domain if you have one

4. **Select these events:**
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `checkout.session.completed`

5. **Click "Add endpoint"**

6. **Get the Signing Secret:**
   - After creating the endpoint, click on it
   - Click "Reveal" under "Signing secret"
   - Copy the secret (starts with `whsec_`)

7. **Add to Vercel:**
   Run this command with your webhook secret:
   ```bash
   echo "YOUR_WEBHOOK_SECRET_HERE" | vercel env add STRIPE_WEBHOOK_SECRET production
   ```

## Local Development Setup (Optional)

For testing locally:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/billing/webhook

# Copy the webhook signing secret shown and add to .env.local
```

## Verify Setup

After adding the webhook secret:

1. Deploy to production:
   ```bash
   vercel --prod
   ```

2. Test a webhook from Stripe Dashboard:
   - Go to your webhook endpoint in Stripe
   - Click "Send test webhook"
   - Select any event type
   - Check if it returns 200 OK

## Troubleshooting

If webhooks fail:
- Check the webhook logs in Stripe Dashboard
- Verify all environment variables are set in Vercel
- Check Vercel function logs: `vercel logs`