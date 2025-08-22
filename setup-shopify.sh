#!/bin/bash

echo "========================================="
echo "Shopify App Setup Script"
echo "========================================="
echo ""
echo "Since you're authenticated, run these commands directly in your terminal:"
echo ""

# Command 1: Create app
echo "STEP 1: Create the app"
echo "----------------------"
echo "shopify app init"
echo ""
echo "When prompted:"
echo "  - App name: data-moodboard-integration" 
echo "  - Select: 'Start with Remix (recommended)'"
echo "  - Or select: 'Start by adding your first extension' then exit"
echo ""

# Command 2: Get credentials  
echo "STEP 2: After app is created, get credentials"
echo "----------------------------------------------"
echo "The app will create a shopify.app.toml file with your client_id"
echo "To see it: cat shopify.app.toml | grep client_id"
echo ""

# Command 3: Get the secret
echo "STEP 3: Get the client secret"
echo "------------------------------"
echo "shopify app env show"
echo ""
echo "Or open in Partners Dashboard:"
echo "shopify app open"
echo ""

# Command 4: Update env
echo "STEP 4: Update your .env.local"
echo "-------------------------------"
echo "Add these lines to .env.local:"
echo "SHOPIFY_CLIENT_ID=<your-client-id-from-toml>"
echo "SHOPIFY_CLIENT_SECRET=<your-secret-from-dashboard>"
echo ""

echo "========================================="
echo "Alternative: Use existing app"
echo "========================================="
echo ""
echo "If you already have an app in Partners:"
echo "shopify app config link"
echo "Then select your existing app from the list"
echo ""

echo "========================================="
echo "Need to see your apps?"
echo "========================================="
echo "Open Partners Dashboard:"
echo "open https://partners.shopify.com/organizations"
echo ""