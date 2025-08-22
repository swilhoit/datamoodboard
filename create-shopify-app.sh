#!/bin/bash

echo "Creating Shopify App via CLI..."
echo "================================"
echo ""
echo "Run these commands in your terminal:"
echo ""
echo "1. First, make sure you're logged in:"
echo "   shopify auth logout && shopify auth login"
echo ""
echo "2. Create the app:"
echo "   shopify app init"
echo ""
echo "   When prompted:"
echo "   - App name: data-moodboard-integration"
echo "   - Choose: Start by adding your first extension"
echo "   - Then press Ctrl+C to exit after app is created"
echo ""
echo "3. Get your credentials:"
echo "   cat shopify.app.toml | grep client_id"
echo ""
echo "4. Or create app via Partners Dashboard:"
echo "   shopify app open"
echo "   (This opens your app in the Partners Dashboard)"
echo ""
echo "5. Update .env.local with the credentials"
echo ""
echo "================================"

# Alternative: Use Shopify Partners API directly
echo ""
echo "Alternative: Create via Partners API"
echo "====================================="
echo ""
echo "curl -X POST https://partners.shopify.com/api/cli/graphql \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'X-Shopify-Cli-Access-Token: YOUR_TOKEN' \\"
echo "  -d '{"
echo '    "query": "mutation CreateApp($name: String!) {'
echo '      appCreate(name: $name) {'
echo '        app {'
echo '          id'
echo '          clientId'
echo '          clientSecret'
echo '        }'
echo '      }'
echo '    }",'
echo '    "variables": {'
echo '      "name": "Data Moodboard Integration"'
echo '    }'
echo '  }'"