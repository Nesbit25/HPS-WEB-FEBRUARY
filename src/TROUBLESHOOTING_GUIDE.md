# Troubleshooting Guide - Current Issues

## Issue #1: Face Page Feature Toggle Breaking Something

### What Happened:
- Home page feature toggle worked ✅
- Tried to also feature the same case on Face page  
- Something broke ❌

### How to Debug:

**Step 1: Open Browser Console**
Press F12 or right-click > Inspect > Console tab

**Step 2: Try to Feature on Face Again**
1. Go to Gallery page (logged in as admin)
2. Click the "Face" button on a gallery case
3. Watch the console for error messages

**What to Look For:**
```
[Gallery Toggle] Toggling flag featuredOnFace for case X
[Gallery Toggle] Request body: { flag: "featuredOnFace", value: true }
[Gallery Toggle] Response status: 200 OK  (good!)
[Gallery Toggle] Response status: 500 Error  (bad - server error)
```

**Step 3: Check Server Response**
1. Open Network tab in DevTools
2. Click "Face" toggle again
3. Find the PATCH request to `/gallery/case/X/toggle`
4. Click on it and check:
   - Request payload
   - Response payload
   - Status code

**Possible Problems:**
- ✅ Server might not support multiple feature flags
- ✅ Flag names might conflict
- ✅ Case data might get corrupted with multiple flags

---

## Issue #2: Consultation Form - Nothing Happens

### What Happened:
- Filled out consultation form
- Clicked submit
- Nothing happened ❌

### How to Debug:

**Step 1: Open Console BEFORE Filling Form**
Press F12 > Console tab

**Step 2: Fill Out Form Completely**
Make sure you fill EVERY required field:

**Page 1:**
- ☐ First Name
- ☐ Last Name  
- ☐ Email (valid email format)
- ☐ Phone  
- ☐ Preferred Contact Method (select from dropdown)

**Page 2:**
- ☐ Primary Procedure Interest (select from dropdown)
- ☐ How did you hear about us? (select from dropdown)

**Page 3:**
- ☐ Consultation Type (In-Person or Virtual)

**Step 3: Watch Console When You Click "Next" or "Submit"**

**What You Might See:**

✅ **Success:**
```
✅ Consultation request submitted successfully
```
Then you should see the "Thank You!" screen.

❌ **Validation Error:**
```
Alert: "Please fill in all required fields before continuing."
```
This means a required field is missing.

❌ **Network Error:**
```
Error submitting consultation form: [error details]
Alert: "There was an error submitting your request..."
```

**Step 4: Check Network Tab**
1. Open DevTools > Network tab
2. Click "Submit Request" 
3. Look for POST request to `/inquiries`
4. Check:
   - Status code (should be 200)
   - Response body
   - Request payload (should have name, email, phone, etc.)

**Step 5: Verify in Admin Dashboard**
1. Log in to Admin Dashboard
2. Go to Inquiries tab
3. Look for your test submission
4. If it's there = SUCCESS! ✅
5. If not there = check console/network for errors

---

## Issue #3: Analytics Shows No Data

### What Happened:
- Checked Admin Dashboard > Analytics
- All zeros, no data ❌

### Why This Happens:
Analytics will be EMPTY until:
1. You visit pages with tracking enabled
2. Someone submits an inquiry

### How to Fix:

**Step 1: Generate Some Analytics Data**

1. **Navigate to Home Page**
   - Go to the home page
   - Check console for: `📊 Page view tracked: home`
   - If you see this = tracking is working! ✅

2. **Submit a Test Inquiry**
   - Go to Contact page OR click "Schedule Consultation"
   - Fill out and submit the form
   - This creates inquiry data

**Step 2: Refresh Analytics**
1. Go to Admin Dashboard
2. Click on Analytics tab
3. Check browser console for:
   ```
   [AdminDashboard] Fetching analytics...
   [AdminDashboard] Analytics data received: { totalInquiries: 1, ... }
   ```

**What You Should See:**
- Total Inquiries: 1 (or more)
- New Inquiries: 1 (or more)
- Page Views: home = 1 (or more)

**If Still Showing Zeros:**

Check console for errors:
```
[AdminDashboard] Analytics fetch failed: 401
```
= You're not logged in properly

```
[AdminDashboard] Analytics fetch failed: 500  
```
= Server error - check server logs

**Step 3: Manually Verify Database**
The analytics endpoint pulls from:
- `inquiry_*` keys in KV store
- `page_views` key in KV store

You can verify data exists by checking server logs or using debug endpoints.

---

## Quick Diagnosis Table

| Symptom | Most Likely Cause | How to Fix |
|---------|-------------------|------------|
| Alert: "Please fill required fields" | Missing form field | Fill ALL required fields marked with * |
| No console message when form submits | JavaScript error | Check console for red error messages |
| POST request fails in Network tab | Server error | Check response body for error details |
| Form submits but not in Admin Dashboard | Inquiry saved but not displaying | Refresh page, check Inquiries tab |
| Analytics all zeros | No data tracked yet | Visit pages, submit forms to generate data |
| Console shows "📊 Page view tracked" but Analytics still zero | Data tracked but not fetched | Refresh Analytics tab, check console for fetch errors |
| Feature toggle fails | CORS issue or server error | Check Network tab for PATCH request status |

---

## Emergency Commands

### If You Need to Check the Database Directly:

**Check All Gallery Cases:**
In browser console (logged in as admin):
```javascript
fetch('https://[projectId].supabase.co/functions/v1/make-server-fc862019/gallery/cases', {
  headers: { 'Authorization': 'Bearer [accessToken]' }
}).then(r => r.json()).then(console.log)
```

**Check Analytics Data:**
```javascript
fetch('https://[projectId].supabase.co/functions/v1/make-server-fc862019/analytics', {
  headers: { 'Authorization': 'Bearer [accessToken]' }
}).then(r => r.json()).then(console.log)
```

**Check All Inquiries:**
```javascript
fetch('https://[projectId].supabase.co/functions/v1/make-server-fc862019/inquiries', {
  headers: { 'Authorization': 'Bearer [accessToken]' }
}).then(r => r.json()).then(console.log)
```

---

## When All Else Fails

1. **Hard refresh the page:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear browser cache:** Settings > Clear browsing data
3. **Try incognito mode:** To rule out browser extensions/cache
4. **Check different browser:** Rule out browser-specific issues
5. **Log out and back in:** Refresh your access token
6. **Check the SESSION_SUMMARY.md:** Review what was changed

---

## Contact Debug Checklist

Before reporting an issue, gather this info:

- [ ] Browser console screenshot (errors in red)
- [ ] Network tab screenshot (failed requests)
- [ ] What page you were on
- [ ] What you clicked/filled out
- [ ] Expected behavior vs actual behavior
- [ ] Any error alerts that appeared

This helps diagnose issues faster!

---

**Remember:** Most issues can be diagnosed by checking:
1. Browser Console (for JavaScript errors)
2. Network Tab (for API request/response)
3. Server logs (for backend errors)

Good luck debugging! 🐛🔍
