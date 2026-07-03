#!/bin/bash

# ZarcoFit Trainer Platform - Database Migration Runner
# This script runs the SQL migrations for the trainer platform

set -e

echo "🚀 ZarcoFit Trainer Platform - Database Migration"
echo "=================================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  No .env.local file found!"
    echo ""
    echo "Please create a .env.local file with your Supabase credentials:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co"
    echo "SUPABASE_DB_PASSWORD=your_database_password"
    echo ""
    echo "You can find these in your Supabase Dashboard:"
    echo "  • Project URL: Settings > API"
    echo "  • DB Password: Settings > Database"
    echo ""
    exit 1
fi

# Load environment variables
source .env.local

# Extract project ref from URL
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not set in .env.local"
    exit 1
fi

PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\/\(.*\)\.supabase\.co/\1/')

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ SUPABASE_DB_PASSWORD not set in .env.local"
    exit 1
fi

# Construct database URL
DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo "📋 Migration Plan:"
echo "  1. trainer-platform-schema.sql (creates new tables)"
echo "  2. update-rls-policies.sql (updates existing tables)"
echo ""
echo "🔌 Connecting to: ${PROJECT_REF}.supabase.co"
echo ""

# Check if psql is available
if command -v psql &> /dev/null; then
    echo "✅ Using psql"
    echo ""
    
    echo "📝 Running migration 1/2: trainer-platform-schema.sql"
    psql "$DB_URL" -f src/lib/supabase/trainer-platform-schema.sql
    echo "✅ Migration 1/2 complete!"
    echo ""
    
    echo "📝 Running migration 2/2: update-rls-policies.sql"
    psql "$DB_URL" -f src/lib/supabase/update-rls-policies.sql
    echo "✅ Migration 2/2 complete!"
    echo ""
else
    echo "❌ psql not found. Please install PostgreSQL client or use Supabase dashboard."
    exit 1
fi

echo "🎉 All migrations completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Test trainer signup: npm run dev, then visit /auth/signup"
echo "  2. Select 'Trainer/Coach' role"
echo "  3. You should be redirected to /trainer/dashboard"
echo ""
