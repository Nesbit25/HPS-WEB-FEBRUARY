# Deployment Notes for Vercel

## Issue Resolved
The `figma:asset` imports have been replaced with placeholder images for Vercel compatibility.

## Files Updated
1. `/components/Header.tsx` - Logo images replaced with placeholders
2. `/components/Footer.tsx` - Logo image replaced with placeholder
3. `/components/pages/About.tsx` - Doctor portrait replaced with placeholder
4. `/components/pages/Home.tsx` - All 5 hero carousel images replaced with placeholders

## Important: Replace Placeholder Images

The following images are currently using Unsplash placeholders and should be replaced with your actual brand assets:

### Logos (3 versions needed):
- **Logo Monogram** - Small centered logo for header top bar
- **Logo Full** - Full logo for footer and mobile menu  
- **Logo Compact** - Horizontal logo for main header navigation

Current placeholders in:
- `/components/Header.tsx` (lines 6-8)
- `/components/Footer.tsx` (line 6)

### Doctor Portrait:
- Professional portrait of Dr. Hanemann for About page
- Current placeholder in: `/components/pages/About.tsx` (line 10)

### Hero Carousel Images (5 images):
- High-quality images for home page hero carousel
- Recommended: Professional photos of office, procedures, results, or team
- Current placeholders in: `/components/pages/Home.tsx` (lines 17-21)

## How to Replace Images

### Option 1: Update the const values directly
Replace the URL strings in the files mentioned above with your actual image URLs.

### Option 2: Use the Admin CMS
Once deployed, log in as admin and use the built-in image editing functionality to replace images directly from the website.

## Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Fix: Replace figma:asset imports with placeholder images for Vercel deployment"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect it's a Vite project
   - Deploy!

3. **Post-Deployment:**
   - Replace placeholder images with actual brand assets
   - Test all pages to ensure images load correctly
   - Configure Supabase environment variables if using backend features

## Environment Variables Required

If using backend features (gallery management, admin login), ensure these are set in Vercel:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Notes
- All images are currently using Unsplash URLs as placeholders
- The site is fully functional with placeholders
- Replace images as soon as possible to match your brand identity
- Image dimensions should match aspect ratios used in the design for best results
