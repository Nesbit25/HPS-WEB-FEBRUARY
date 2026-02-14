# GitHub Token Environment Variable Fix

## Problem
The server was using **hardcoded GitHub Personal Access Tokens** in 5 different endpoints, which caused **401 Bad Credentials** errors when the token expired or changed.

## Solution
Updated all endpoints to read the `GITHUB_TOKEN` from environment variables using `Deno.env.get('GITHUB_TOKEN')`.

## Files Changed
- `/src/supabase/functions/server/index.tsx` - Fixed 5 GitHub authentication endpoints

## Endpoints Updated
1. `/make-server-fc862019/gallery/upload-to-github` (line ~782)
2. `/make-server-fc862019/gallery/create-folder` (line ~874)
3. `/make-server-fc862019/gallery/sync-from-github` (line ~1008)
4. `/make-server-fc862019/gallery/github-files` (line ~1162)
5. `/make-server-fc862019/gallery/check-github` (line ~1215)

## Changes Made
**Before:**
```typescript
const GITHUB_TOKEN = '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'; // ❌ Hardcoded!
```

**After:**
```typescript
const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN'); // ✅ Environment variable
if (!GITHUB_TOKEN) {
  console.error('[...] No GITHUB_TOKEN found in environment');
  return c.json({ error: 'GitHub token not configured' }, 500);
}
```

## How to Deploy

### Option 1: Using the provided script
```bash
chmod +x push-server-fix.sh
./push-server-fix.sh
```

### Option 2: Manual Git commands
```bash
git add src/supabase/functions/server/index.tsx
git commit -m "Fix: Use GITHUB_TOKEN environment variable"
git push origin main
```

### Option 3: Use GitHub Desktop or your preferred Git UI
1. Stage the file: `src/supabase/functions/server/index.tsx`
2. Commit with message: "Fix: Use GITHUB_TOKEN environment variable"
3. Push to `main` branch

## After Pushing to GitHub

### 1. Verify Supabase Deployment
- If you have GitHub integration: Edge Function will auto-deploy
- Manual deployment: https://supabase.com/dashboard/project/jrzzakhpyoujpfrjllrh/functions
  - Find the `server` function
  - Click "Deploy" or "Redeploy"

### 2. Confirm GITHUB_TOKEN Secret
Make sure your new GitHub token is configured in Supabase:
- Go to: **Edge Functions** → **server** → **Secrets** or **Environment Variables**
- Verify `GITHUB_TOKEN` is listed with your new token value
- The token you regenerated should start with `ghp_`

### 3. Test the Gallery
1. Log into your admin panel
2. Go to Gallery Management
3. Click "Sync from GitHub"
4. It should now work without the 401 error! 🎉

## What This Fixes
- ✅ Gallery images will load from GitHub
- ✅ "Sync from GitHub" button will work
- ✅ Bulk uploaded images will appear in the gallery
- ✅ No more "Bad credentials - 401" errors
- ✅ Easy to update token in the future (just update the Supabase secret)

## Security Improvement
By using environment variables instead of hardcoded tokens:
- ✅ Tokens are not exposed in source code
- ✅ Easy to rotate tokens without code changes
- ✅ Different tokens can be used in different environments
- ✅ Tokens are stored securely in Supabase secrets

---

**Last Updated:** February 5, 2026  
**Issue:** 401 Bad Credentials on GitHub gallery sync  
**Status:** ✅ FIXED - Ready to deploy
