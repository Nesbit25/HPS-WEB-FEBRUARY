# 🎯 ALL GALLERY FIXES - DEPLOY GUIDE

## What's Been Fixed

I've fixed **THREE critical gallery issues** in one deployment:

### ✅ Fix #1: Photos Not Loading (401 Errors)
- **Problem:** Hardcoded GitHub tokens expired
- **Solution:** Read from GITHUB_TOKEN environment variable
- **Affected:** All 5 GitHub endpoints

### ✅ Fix #2: Database Only Showing 2 Cases (Vercel)
- **Problem:** Database writes failing silently
- **Solution:** Try-catch + verification for each case write
- **Affected:** Sync from GitHub function

### ✅ Fix #3: Bulk Upload SHA Conflicts (409 Errors)
- **Problem:** Race condition when uploading multiple images
- **Solution:** Automatic retry with fresh SHA fetch (3 attempts)
- **Affected:** Bulk upload to GitHub endpoint

---

## 🚀 ONE-TIME DEPLOYMENT

All three fixes are in the same file: `src/supabase/functions/server/index.tsx`

### Step 1: Push to GitHub
```bash
git add src/supabase/functions/server/index.tsx
git commit -m "Fix: Gallery photos loading + database persistence + bulk upload conflicts"
git push origin main
```

### Step 2: Redeploy Supabase Edge Function
**Option A - Auto Deploy (if GitHub integration enabled):**
- Wait 1-2 minutes after push
- Check deployment status in Supabase dashboard

**Option B - Manual Deploy:**
1. Go to: https://supabase.com/dashboard/project/jrzzakhpyoujpfrjllrh/functions
2. Find the **server** function
3. Click **"Deploy"** button
4. Wait for deployment to complete (~30 seconds)

---

## ✅ Testing Checklist

After deployment, test each fix:

### Test Fix #1 (Photos Loading):
1. Go to **public gallery** on your Vercel site
2. Photos should now appear! 🖼️
3. Check browser console - should see image URLs loading
4. ~~401 errors~~ → ✅ 200 OK responses

### Test Fix #2 (Database Persistence):
1. Go to **Admin → Gallery Management**
2. Click **"Sync from GitHub"**
3. Response should show:
   ```json
   {
     "casesCreated": 30,
     "casesSkipped": 2,
     "casesFailed": 0,  // ← Should be 0!
     "failedCases": []
   }
   ```
4. Click **"Debug Database"** → Should show all 32 cases

### Test Fix #3 (Bulk Upload):
1. Go to **Admin → Gallery Management**
2. Click **"Bulk Upload"**
3. Upload 5-10 before/after photos
4. Click **"Upload All Cases"**
5. ~~409 SHA conflict errors~~ → ✅ All upload successfully
6. May see retry messages in console (this is normal and expected!)

---

## 📊 Expected Results

### Before Fixes:
```
Gallery:        ❌ No photos loading (401 errors)
Database:       ❌ Only 2 cases (30 failed silently)
Bulk Upload:    ❌ 409 SHA conflicts
```

### After Fixes:
```
Gallery:        ✅ All photos loading from GitHub
Database:       ✅ All 32 cases persisted correctly
Bulk Upload:    ✅ Multiple images upload successfully (with auto-retry)
```

---

## 🔍 Troubleshooting

### If photos STILL don't load:

**Check #1:** Is GITHUB_TOKEN set in Supabase?
- Go to Edge Functions → server → Secrets
- Verify `GITHUB_TOKEN` exists with your new token

**Check #2:** Is Edge Function deployed?
- Check Supabase Edge Function logs
- Should see recent deployment timestamp

**Check #3:** Token permissions correct?
- Your token needs: `repo` (full control of private repositories)
- Regenerate if needed at: https://github.com/settings/tokens

### If database still shows only 2 cases:

**Check Supabase Logs:**
1. Go to: https://supabase.com/dashboard/project/jrzzakhpyoujpfrjllrh/logs
2. Filter: Edge Functions
3. Look for: `[Sync GitHub]` messages
4. Look for: `❌ Failed to create case` or `⚠️  WARNING: Case not persisted`

**Response will show which cases failed:**
```json
{
  "failedCases": [
    { "slug": "pt_1234_rhinoplasty", "reason": "Database connection timeout" }
  ]
}
```

### If bulk upload still gets 409 errors:

**Check retry logs:**
- Browser console should show retry attempts
- Should see: `[GitHub Upload] SHA conflict detected, retrying...`
- If it retries 3 times and still fails, check GitHub rate limits

**Workaround:**
- Upload fewer images at once (5 instead of 10)
- Upload in batches with 30-second breaks between

---

## 📝 Deployment Command Reference

### Full deployment (one command):
```bash
git add src/supabase/functions/server/index.tsx && \
git commit -m "Fix: Gallery photos + database + bulk upload" && \
git push origin main
```

### Then manually redeploy Edge Function, or wait for auto-deploy.

---

## 🎉 Success Criteria

You'll know everything works when:

- ✅ Gallery page shows all before/after photos
- ✅ Debug Database button shows 32 cases
- ✅ Sync from GitHub shows 0 failed cases
- ✅ Bulk upload completes without errors
- ✅ No 401, 409, or database write errors in logs

---

**Need help? Check the detailed guides:**
- `COMPLETE_FIX_GUIDE.md` - Technical details of all fixes
- `BULK_UPLOAD_FIX.md` - Detailed SHA conflict explanation
- `GITHUB_TOKEN_FIX.md` - Token authentication details

**Deploy now and test! All three fixes will work together. 🚀**
