# How to Find Your Supabase Anon Key

## Step-by-Step Guide with Screenshots

### 1. Go to Your Supabase Dashboard
- Open: https://supabase.com/dashboard/project/cgqqttkxvudnncavvuky

### 2. Navigate to API Settings
- Click on **"Settings"** (gear icon) in the left sidebar
- Click on **"API"** in the settings menu

### 3. Find the Correct Key
You'll see a section called **"Project API keys"** with two keys:

#### ❌ DO NOT USE:
- **service_role** (secret) - This has a "Hide" button and warning
- Any key labeled "secret" or "service"

#### ✅ USE THIS ONE:
- **anon** (public) - This is safe for client-side use
- It should look like this:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncXF0dGt4dnVkbm5jYXZ2dWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3NTg4MDAsImV4cCI6MjA0OTMzNDgwMH0.[some-long-string]
```

### What the Key Looks Like:
- **Starts with:** `eyJ`
- **Length:** Usually 200-300 characters
- **Format:** Three parts separated by dots (.)
- **Structure:** `header.payload.signature`

### 4. Copy the Anon Key
- Click the copy button next to the **anon** key
- It will say "Copied!" when successful

### 5. Update Your .env.local
Replace the current key with the one you just copied:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ....[your full key here]
```

## Visual Guide:
The Supabase API page should show:

```
Project URL
https://cgqqttkxvudnncavvuky.supabase.co

Project API keys
┌─────────────────────────────────────────┐
│ anon (public)                           │
│ eyJhbGci... [COPY BUTTON]              │
│ Use this key in your client-side code  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ service_role (secret) [HIDE]           │
│ ********* [COPY BUTTON]                │
│ ⚠️ Never expose this key               │
└─────────────────────────────────────────┘
```

## Still Can't Find It?

If you're seeing different types of keys, you might be in:
- Vault/Secrets section (wrong place)
- Database settings (wrong place)  
- Auth settings (wrong place)

Make sure you're in: **Settings → API**

The keys you've provided so far:
- `sb_secret_...` - Service role key (don't use)
- `sb_publishable_...` - Unusual format
- `3IQMfhuj7/vm...` - Base64 secret (don't use)

None of these are the anon JWT token we need!