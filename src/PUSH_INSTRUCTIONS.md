# 🚨 URGENT: Push These Changes to Fix Gallery

## What's Wrong
1. **Photos not loading**: Server has hardcoded GitHub tokens (401 errors)
2. **Vercel showing only 2 cases**: Database write issue (needs investigation)

## Quick Fix - Run These Commands:

```bash
# Add and commit the server fix
git add src/supabase/functions/server/index.tsx

# Commit
git commit -m "Fix: Use GITHUB_TOKEN environment variable for GitHub API auth"

# Push to GitHub
git push origin main
```

## Then:
1. Wait 1-2 minutes for Supabase Edge Function to redeploy
2. OR manually redeploy at: https://supabase.com/dashboard/project/jrzzakhpyoujpfrjllrh/functions
3. Test the gallery sync again

---

## If you prefer a one-liner:
```bash
git add src/supabase/functions/server/index.tsx && git commit -m "Fix: Use GITHUB_TOKEN environment variable" && git push origin main
```

---

**After this works, we'll investigate the "only 2 cases on Vercel" issue with better debugging.**
