# 🚀 Deploy Server to Fix Gallery

## The Problem
Your gallery images ARE in GitHub, but the Supabase Edge Function can't read them because `GITHUB_TOKEN` isn't set in the deployed environment.

## The Solution
Deploy the updated server code with your GitHub token as an environment variable.

---

## Step 1: Deploy the Server

```bash
cd /path/to/your/project

# Deploy the Edge Function
npx supabase functions deploy make-server-fc862019
```

---

## Step 2: Set the GitHub Token Secret

```bash
# Set the GITHUB_TOKEN environment variable
npx supabase secrets set GITHUB_TOKEN=your_github_token_here
```

Replace `your_github_token_here` with your actual GitHub Personal Access Token.

---

## Step 3: Restart the Function

After setting secrets, restart the function:

```bash
npx supabase functions delete make-server-fc862019
npx supabase functions deploy make-server-fc862019
```

---

## Step 4: Test

1. Go to your gallery page
2. Click "Sync from GitHub"
3. You should see your 32+ cases with images!

---

## Alternative: Set via Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions** → **make-server-fc862019** → **Settings**
4. Add secret: `GITHUB_TOKEN` = `your_github_token_here`
5. Restart the function

---

## Verify It's Working

After deployment, check the Edge Function logs:
- Should see: `[GitHub Files] Found XX files`
- Should NOT see: `No GITHUB_TOKEN found` or `401` errors

The gallery will load instantly with all your before/after photos!
