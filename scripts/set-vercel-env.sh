#!/bin/bash

echo "🚀 Setting Vercel Environment Variables"
echo "======================================="

# Read from .env.local file
if [ -f .env.local ]; then
    # Extract values from .env.local
    STRIPE_SECRET=$(grep "^STRIPE_SECRET_KEY=" .env.local | cut -d '=' -f2)
    STRIPE_PUBLIC=$(grep "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" .env.local | cut -d '=' -f2)
    STRIPE_PRICE=$(grep "^NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=" .env.local | cut -d '=' -f2)
    
    if [ -n "$STRIPE_SECRET" ]; then
        echo "$STRIPE_SECRET" | vercel env add STRIPE_SECRET_KEY production
    fi
    
    if [ -n "$STRIPE_PUBLIC" ]; then
        echo "$STRIPE_PUBLIC" | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
    fi
    
    if [ -n "$STRIPE_PRICE" ]; then
        echo "$STRIPE_PRICE" | vercel env add NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY production
    fi
else
    echo "❌ .env.local file not found"
    echo "Please ensure your .env.local file exists with the required keys"
    exit 1
fi

# Note: You'll need to add these manually as they need to be obtained:
echo ""
echo "⚠️  Please add these manually:"
echo ""
echo "1. STRIPE_WEBHOOK_SECRET"
echo "   - Get from Stripe Dashboard after creating webhook"
echo "   - Run: vercel env add STRIPE_WEBHOOK_SECRET production"
echo ""
echo "2. SUPABASE_SERVICE_ROLE_KEY"
echo "   - Get from: https://supabase.com/dashboard/project/cgqqttkxvudnncavvuky/settings/api"
echo "   - Run: vercel env add SUPABASE_SERVICE_ROLE_KEY production"
echo ""
echo "✅ Added Stripe keys to production!"
echo ""
echo "To verify, run: vercel env ls"