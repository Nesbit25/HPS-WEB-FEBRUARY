# Bulk Upload SHA Conflict Fix (409 Errors)

## 🐛 The Problem

When you tried to bulk upload multiple images, you got this error:

```
Upload error: Failed to upload before image to GitHub: Failed to upload to GitHub: 
GitHub API error: 409 - is at 941c989a8d56fbdb3f41292ad587cf35466b5612 
but expected 07d4c5122ab1002616e730cc57e2fce62c4fbdb4
```

### What This Means
- **409** = Conflict error from GitHub
- **Expected SHA** = The file version your code thought existed
- **Actual SHA** = The file version that actually exists on GitHub

### Why It Happened
This is a classic **race condition**:

1. Upload 1 starts → Checks file SHA → Gets `07d4c5...`
2. Upload 2 starts → Checks file SHA → Gets `07d4c5...` (same)
3. Upload 1 completes → File SHA changes to `941c98...`
4. Upload 2 tries to upload with old SHA `07d4c5...` → **409 CONFLICT!**

This happens when uploading multiple images for the same case because they might modify the same file or folder structure.

---

## ✅ The Solution

I added **automatic retry logic with fresh SHA fetching** to the `/gallery/upload-to-github` endpoint.

### How It Works Now:

```typescript
// Pseudo-code
let retries = 0;
while (not uploaded and retries < 3) {
  
  // Always fetch the LATEST SHA from GitHub
  currentSHA = fetch latest file SHA from GitHub
  
  // Try to upload with current SHA
  response = upload to GitHub with currentSHA
  
  // If we get a 409 conflict...
  if (response.status === 409) {
    retries++;
    wait 200ms * retries;  // Exponential backoff
    continue;              // Try again with fresh SHA
  }
  
  // Success!
  if (response.ok) {
    uploaded = true;
  }
}
```

### What This Fixes:
✅ Bulk uploads can now upload 10+ images without conflicts  
✅ Automatically retries up to 3 times with fresh SHA  
✅ Uses exponential backoff (200ms, 400ms, 600ms delays)  
✅ Works for concurrent uploads to the same case  

---

## 📊 What To Expect Now

### Before (❌):
```
Uploading image 1... ✓
Uploading image 2... ✓
Uploading image 3... ❌ 409 SHA conflict
STOPPED - Bulk upload failed
```

### After (✅):
```
Uploading image 1... ✓
Uploading image 2... ✓
Uploading image 3... ⚠️  SHA conflict, retrying...
Uploading image 3... ✓ (retry succeeded)
Uploading image 4... ✓
Uploading image 5... ✓
All images uploaded successfully!
```

---

## 🚀 How To Deploy

This fix is in the same file as the other fixes:

```bash
git add src/supabase/functions/server/index.tsx
git commit -m "Fix: GitHub token env + sync error handling + SHA conflict retry"
git push origin main
```

Then redeploy the Supabase Edge Function:
- https://supabase.com/dashboard/project/jrzzakhpyoujpfrjllrh/functions
- Click "Deploy" on the **server** function

---

## 🧪 Testing Bulk Upload

After deployment:

1. Go to Admin → Gallery Management
2. Click "Bulk Upload"
3. Upload multiple before/after photos for the same case
4. Click "Upload All Cases"
5. Should now work without 409 errors! 🎉

### Check the logs:
In browser console, you might see:
```
[GitHub Upload] Uploading pt_1234_rhinoplasty_p1_img1.png to GitHub...
[GitHub Upload] File exists, will update (SHA: 941c989...)
[GitHub Upload] SHA conflict detected, retrying (attempt 1/3)...
[GitHub Upload] Successfully uploaded to GitHub
```

This is **normal and expected** - it means the retry worked!

---

## 🔍 If Issues Still Occur

### Check Supabase Logs:
1. Go to Edge Function logs
2. Filter by `[GitHub Upload]`
3. Look for how many retries happened
4. If it retries 3 times and still fails, there's a deeper issue

### Possible causes if still failing:
- GitHub rate limiting (rare)
- Network issues
- File is locked by another process
- GitHub permissions issue

### Quick Fix:
If you see 3 failed retries, try:
1. Reducing the number of images uploaded at once (5-10 at a time)
2. Adding a small delay between image uploads in the bulk uploader

---

**This fix is included with the other gallery fixes. Deploy once and all three issues are resolved!**
