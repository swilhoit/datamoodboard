#!/bin/bash

echo "🔧 Stripe Webhook Setup Script"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in production or development
echo "Select environment:"
echo "1) Development (localhost)"
echo "2) Production (Vercel)"
read -p "Enter choice (1 or 2): " ENV_CHOICE

if [ "$ENV_CHOICE" = "1" ]; then
    echo -e "${YELLOW}For local development with Stripe CLI:${NC}"
    echo ""
    echo "1. Install Stripe CLI (if not already installed):"
    echo "   brew install stripe/stripe-cli/stripe"
    echo ""
    echo "2. Login to Stripe:"
    echo "   stripe login"
    echo ""
    echo "3. Forward webhooks to your local server:"
    echo "   stripe listen --forward-to localhost:3000/api/billing/webhook"
    echo ""
    echo "4. Copy the webhook signing secret shown and update .env.local:"
    echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
    echo ""
    echo -e "${GREEN}✅ Your local webhook is ready!${NC}"
elif [ "$ENV_CHOICE" = "2" ]; then
    echo -e "${YELLOW}For production setup:${NC}"
    echo ""
    echo "1. Go to Stripe Dashboard:"
    echo "   https://dashboard.stripe.com/webhooks"
    echo ""
    echo "2. Click 'Add endpoint'"
    echo ""
    echo "3. Enter your endpoint URL:"
    echo "   https://data-moodboard-app.vercel.app/api/billing/webhook"
    echo ""
    echo "4. Select these events to listen for:"
    echo "   ✓ customer.subscription.created"
    echo "   ✓ customer.subscription.updated"
    echo "   ✓ customer.subscription.deleted"
    echo "   ✓ invoice.payment_succeeded"
    echo "   ✓ invoice.payment_failed"
    echo "   ✓ checkout.session.completed"
    echo ""
    echo "5. After creating, click 'Reveal' on the Signing secret"
    echo ""
    echo "6. Copy the webhook signing secret (starts with whsec_)"
    echo ""
    echo "7. Add it to your Vercel environment variables:"
    echo "   - Go to: https://vercel.com/dashboard/project/data-moodboard-app/settings/environment-variables"
    echo "   - Add: STRIPE_WEBHOOK_SECRET = whsec_..."
    echo ""
    echo -e "${GREEN}✅ Production webhook setup complete!${NC}"
else
    echo -e "${RED}Invalid choice. Please run the script again.${NC}"
    exit 1
fi

echo ""
echo "=============================="
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Get your Supabase service role key from:"
echo "   https://supabase.com/dashboard/project/cgqqttkxvudnncavvuky/settings/api"
echo ""
echo "2. Update SUPABASE_SERVICE_ROLE_KEY in your environment"
echo ""
echo "3. Apply the database migration (see next instructions)"
echo ""