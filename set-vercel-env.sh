#!/bin/bash

# This script sets up environment variables for Vercel production

echo "Setting up Vercel environment variables..."

# Read the Google Service Account Key from .env.local
GOOGLE_KEY=$(grep "^GOOGLE_SERVICE_ACCOUNT_KEY=" .env.local | cut -d "=" -f2- | sed "s/^'//;s/'$//")

# Set Google Service Account Key
echo "$GOOGLE_KEY" | vercel env add GOOGLE_SERVICE_ACCOUNT_KEY production --force

# Read and set OpenAI API key
OPENAI_KEY=$(grep "^OPENAI_API_KEY=" .env.local | cut -d "=" -f2-)
if [ ! -z "$OPENAI_KEY" ]; then
  echo "$OPENAI_KEY" | vercel env add OPENAI_API_KEY production --force
fi

# Read and set Giphy API key
GIPHY_KEY=$(grep "^GIPHY_API_KEY=" .env.local | cut -d "=" -f2-)
if [ ! -z "$GIPHY_KEY" ]; then
  echo "$GIPHY_KEY" | vercel env add GIPHY_API_KEY production --force
fi

echo "Environment variables have been set. You may need to redeploy for changes to take effect."
echo "Run: vercel --prod"