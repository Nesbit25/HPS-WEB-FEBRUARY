#!/bin/bash

# This script pushes the updated server index.tsx file to GitHub
# Run this with: bash push-server-fix.sh

echo "🔧 Pushing GitHub token environment variable fix to GitHub..."

# Check if git is configured
if ! git config user.name > /dev/null 2>&1; then
  echo "⚠️  Setting up git user..."
  git config user.name "Hanemann Web"
  git config user.email "web@hanemannplasticsurgery.com"
fi

# Add the changed file
git add src/supabase/functions/server/index.tsx

# Commit with descriptive message
git commit -m "Fix: Use GITHUB_TOKEN environment variable instead of hardcoded token

- Replaced all 5 hardcoded GitHub personal access tokens with Deno.env.get('GITHUB_TOKEN')
- Added error handling when GITHUB_TOKEN is not configured
- Affects endpoints: /gallery/upload-to-github, /gallery/create-folder, /gallery/sync-from-github, /gallery/github-files, /gallery/check-github
- This fixes the 401 Bad Credentials error when syncing gallery from GitHub"

# Push to main branch
git push origin main

echo "✅ Successfully pushed to GitHub!"
echo ""
echo "📝 Next steps:"
echo "  1. Supabase Edge Function should auto-deploy (if GitHub integration is set up)"
echo "  2. Or manually redeploy at: https://supabase.com/dashboard/project/jrzzakhpyoujpfrjllrh/functions"
echo "  3. Make sure GITHUB_TOKEN is set in Supabase secrets"
echo "  4. Test the gallery sync again!"
