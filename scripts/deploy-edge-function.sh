#!/bin/bash

# Deploy Edge Function Script
echo "🚀 Deploying Supabase Edge Function..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null && ! pnpm exec supabase --version &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   pnpm add -D supabase -w"
    exit 1
fi

# Check if user is logged in
if ! pnpm exec supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please login first:"
    echo "   pnpm exec supabase login"
    exit 1
fi

# Deploy the function
echo "📦 Deploying auth Edge Function..."
pnpm exec supabase functions deploy auth

if [ $? -eq 0 ]; then
    echo "✅ Edge Function deployed successfully!"
    echo ""
    echo "🔧 Required Environment Variables (set in Supabase Dashboard → Edge Functions):"
    echo "   - SUPABASE_URL: Your Supabase project URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY: Your service role key (from Project Settings → API)"
    echo "   - SUPABASE_JWT_SECRET: Your JWT secret (from Project Settings → API)"
    echo "   - APP_ORIGIN: Your frontend origin (e.g., http://localhost:3000 or https://yourdomain.com)"
    echo ""
    echo "🔧 Frontend Environment Variables (.env.local):"
    echo "   - NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "   - APP_ORIGIN=http://localhost:3000"
    echo ""
    echo "🧪 Test the authentication flow:"
    echo "   pnpm run dev --filter=web"
    echo ""
    echo "📝 Features implemented:"
    echo "   - SIWE authentication with strict validation"
    echo "   - JWT access tokens (15m expiry)"
    echo "   - HttpOnly refresh cookies (30d with sliding expiration)"
    echo "   - Automatic token refresh"
    echo "   - Taiko Hekla chain enforcement"
    echo "   - RLS-protected database access"
else
    echo "❌ Failed to deploy Edge Function"
    exit 1
fi
