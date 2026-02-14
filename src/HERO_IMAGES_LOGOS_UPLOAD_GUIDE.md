# 📸 HERO IMAGES & LOGOS - UPLOAD GUIDE

This guide shows you **EXACTLY** where to upload hero images and logo files for the Hanemann Plastic Surgery website.

---

## 🎯 QUICK REFERENCE TABLE

| Asset | Exact File Path | Format | Size |
|-------|----------------|--------|------|
| **Desktop Hero Slide 1** | `/public/images/hero/desktop/hero-slide-1.jpg` | JPG/PNG | 1920x1080px |
| **Desktop Hero Slide 2** | `/public/images/hero/desktop/hero-slide-2.jpg` | JPG/PNG | 1920x1080px |
| **Desktop Hero Slide 3** | `/public/images/hero/desktop/hero-slide-3.jpg` | JPG/PNG | 1920x1080px |
| **Mobile Hero Slide 1** | `/public/images/hero/mobile/hero-slide-1.jpg` | JPG/PNG | 800x1200px |
| **Mobile Hero Slide 2** | `/public/images/hero/mobile/hero-slide-2.jpg` | JPG/PNG | 800x1200px |
| **Mobile Hero Slide 3** | `/public/images/hero/mobile/hero-slide-3.jpg` | JPG/PNG | 800x1200px |
| **Main Logo (SVG)** | `/public/images/logos/logo-main.svg` | SVG | Vector |
| **Main Logo (PNG)** | `/public/images/logos/logo-main.png` | PNG | 400px width |
| **Favicon** | `/public/images/logos/favicon.ico` | ICO | 32x32px |

---

## 🖼️ HERO IMAGES

### Desktop Hero Images (Landscape - 16:9)

**Upload Location:**
```
/public/images/hero/desktop/
```

**File Names (EXACT - case sensitive):**
- `hero-slide-1.jpg` → First slide on home page
- `hero-slide-2.jpg` → Second slide on home page
- `hero-slide-3.jpg` → Third slide on home page

**Specifications:**
- **Aspect Ratio:** 16:9 (Landscape)
- **Recommended Size:** 1920x1080px or 2560x1440px
- **Format:** JPG or PNG
- **Max File Size:** 500KB (compress at https://tinypng.com if needed)
- **Content:** Leave space on LEFT SIDE for text overlay
- **Background:** Professional, not too busy

---

### Mobile Hero Images (Portrait - 2:3)

**Upload Location:**
```
/public/images/hero/mobile/
```

**File Names (EXACT - case sensitive):**
- `hero-slide-1.jpg` → First slide on mobile
- `hero-slide-2.jpg` → Second slide on mobile
- `hero-slide-3.jpg` → Third slide on mobile

**Specifications:**
- **Aspect Ratio:** 2:3 (Portrait)
- **Recommended Size:** 800x1200px or 1080x1620px
- **Format:** JPG or PNG
- **Max File Size:** 300KB (compress at https://tinypng.com if needed)
- **Content:** Important elements in CENTER (avoid top/bottom edges)
- **Background:** Works well on vertical mobile screens

**⚠️ IMPORTANT:** Mobile images are DIFFERENT from desktop (portrait vs landscape)

---

## 🏷️ LOGOS

### Main Logo (SVG - REQUIRED)

**Upload Location:**
```
/public/images/logos/logo-main.svg
```

**Specifications:**
- **Format:** SVG (Scalable Vector Graphics)
- **Color:** White or light colored (displays on dark navy background)
- **Background:** Transparent
- **Usage:** Header navigation (desktop & mobile)
- **File Size:** Under 50KB
- **Important:** This file is REQUIRED - site won't load without it

---

### Main Logo (PNG - FALLBACK)

**Upload Location:**
```
/public/images/logos/logo-main.png
```

**Specifications:**
- **Format:** PNG with transparent background
- **Size:** 400px width (height auto, maintain aspect ratio)
- **Resolution:** 2x for retina displays (800px actual width)
- **Color:** White or light colored
- **Usage:** Backup for browsers that don't support SVG
- **File Size:** Under 100KB

---

### Favicon

**Upload Location:**
```
/public/images/logos/favicon.ico
```

**Specifications:**
- **Format:** .ico file
- **Size:** 32x32px or 16x16px
- **Usage:** Browser tab icon and bookmarks
- **Tool:** Generate at https://favicon.io

---

## 📤 HOW TO UPLOAD TO GITHUB

### Method 1: GitHub Web Interface (Easiest - No Technical Skills)

1. **Navigate to the folder on GitHub:**
   - For desktop hero: https://github.com/Nesbit25/HPS-WEB-FEBRUARY/tree/main/public/images/hero/desktop
   - For mobile hero: https://github.com/Nesbit25/HPS-WEB-FEBRUARY/tree/main/public/images/hero/mobile
   - For logos: https://github.com/Nesbit25/HPS-WEB-FEBRUARY/tree/main/public/images/logos

2. **Click "Add file" button** (top right)

3. **Click "Upload files"**

4. **Drag and drop your images** (or click "choose your files")
   - Make sure file names match EXACTLY
   - File names are case-sensitive

5. **Scroll down and add a commit message** (e.g., "Update hero images")

6. **Click "Commit changes"**

7. **Wait 2-3 minutes** for Vercel to rebuild the site automatically

8. **Clear your browser cache** and refresh the site:
   - Windows: Ctrl + Shift + R
   - Mac: Cmd + Shift + R

---

### Method 2: Git Command Line (For Developers)

```bash
# Clone the repo (first time only)
git clone https://github.com/Nesbit25/HPS-WEB-FEBRUARY.git
cd HPS-WEB-FEBRUARY

# Add your files
git add public/images/hero/desktop/hero-slide-1.jpg
git add public/images/hero/desktop/hero-slide-2.jpg
git add public/images/hero/desktop/hero-slide-3.jpg
git add public/images/hero/mobile/hero-slide-1.jpg
git add public/images/hero/mobile/hero-slide-2.jpg
git add public/images/hero/mobile/hero-slide-3.jpg
git add public/images/logos/logo-main.svg
git add public/images/logos/logo-main.png
git add public/images/logos/favicon.ico

# Commit the changes
git commit -m "Update hero images and logos"

# Push to GitHub
git push origin main
```

---

### Method 3: GitHub Desktop (Visual Git Client)

1. **Download GitHub Desktop:** https://desktop.github.com
2. **Clone the repository** to your computer
3. **Copy/paste files** into the correct folders on your computer
4. **Open GitHub Desktop** - it will show the new files
5. **Write a commit message** (e.g., "Update hero images")
6. **Click "Commit to main"**
7. **Click "Push origin"**

---

## ✅ CHECKLIST BEFORE UPLOADING

### Hero Images:
- [ ] 3 desktop images (landscape 16:9)
- [ ] 3 mobile images (portrait 2:3)
- [ ] File names match exactly: `hero-slide-1.jpg`, `hero-slide-2.jpg`, `hero-slide-3.jpg`
- [ ] Images are compressed (under 500KB for desktop, 300KB for mobile)
- [ ] Desktop images have space on left for text
- [ ] Mobile images are in portrait orientation

### Logos:
- [ ] `logo-main.svg` exists (REQUIRED)
- [ ] `logo-main.png` exists (fallback)
- [ ] `favicon.ico` exists
- [ ] Logo is white/light colored (for dark background)
- [ ] Logo has transparent background
- [ ] SVG is under 50KB, PNG is under 100KB

---

## 🎨 IMAGE CONTENT TIPS

### Desktop Hero Images:
- Use high-resolution professional photos
- Leave **LEFT SIDE** mostly clear for text overlay
- Faces should be well-lit and in focus
- Avoid overly busy backgrounds
- Test with dark gradient overlay (left side will be darker)
- Should look good at 1920x1080px and larger

### Mobile Hero Images:
- **Portrait orientation** (tall, not wide)
- Keep important content in CENTER vertical area
- Avoid critical details at top/bottom edges
- Crop for mobile viewing - faces can be larger
- Test on actual mobile device if possible

### Logos:
- Simple, professional design
- High contrast against navy background (#1a1f2e)
- Legible at small sizes (mobile header)
- Consider adding tagline if space allows
- Vector format (SVG) preferred for scalability

---

## 🚫 COMMON MISTAKES TO AVOID

1. ❌ **Wrong file names** - Names must match EXACTLY (case-sensitive)
2. ❌ **Wrong orientation** - Desktop is landscape, mobile is portrait
3. ❌ **Files too large** - Compress images before upload
4. ❌ **Wrong folder** - Double-check you're in the correct directory
5. ❌ **Forgot to commit** - Don't forget to click "Commit changes" on GitHub
6. ❌ **Dark logo on dark background** - Logo must be light/white colored
7. ❌ **No transparent background** - PNG and SVG logos need transparency
8. ❌ **Uploading patient photos here** - Patient before/after goes in Supabase Storage (HIPAA)

---

## 🔧 TROUBLESHOOTING

### Images not showing after upload?

1. **Check file names** - Must match exactly (case-sensitive)
2. **Verify folder location** - Ensure files are in correct directory
3. **Wait for deployment** - Vercel takes 2-3 minutes to rebuild
4. **Clear browser cache:**
   - Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
5. **Check browser console** - Press F12 and look for errors
6. **Verify file format** - Should be .jpg, .png, or .svg (lowercase)

### Logo not appearing?

1. **Check `logo-main.svg` exists** - This file is REQUIRED
2. **Verify SVG file is valid** - Open in browser to test
3. **Check file path** - Must be `/public/images/logos/logo-main.svg`
4. **Ensure transparent background** - Not white background
5. **Test PNG fallback** - Upload `logo-main.png` as backup

### Images look blurry?

1. **Increase resolution** - Use 2x size for retina displays
2. **Don't upscale** - Use original high-res photos, don't enlarge small images
3. **Check compression** - Don't over-compress (keep quality above 80%)
4. **Use correct format** - JPG for photos, PNG for graphics with transparency

---

## 📞 NEED HELP?

If you encounter issues:
1. Double-check file names match exactly
2. Verify files are in correct folders
3. Wait 3-5 minutes after upload for deployment
4. Clear browser cache completely
5. Check the browser console (F12) for specific errors

---

## 🔐 SECURITY REMINDER

**IMPORTANT:** All files in `/public/images/` are **publicly accessible** on the internet.

### ✅ What to upload here:
- Marketing images (hero banners)
- Logo files
- Public-facing graphics

### ❌ What NOT to upload here:
- **Patient before/after photos** → Use Supabase Storage (HIPAA-compliant)
- Personal information
- Unpublished materials
- Sensitive documents

**Patient privacy is critical.** Before/after patient photos belong in Supabase Storage (private, HIPAA-friendly), not in the public folder.

---

## 📊 FILE SIZE OPTIMIZATION TOOLS

- **TinyPNG:** https://tinypng.com (compress JPG/PNG)
- **SVGOMG:** https://jakearchibald.github.io/svgomg/ (optimize SVG)
- **Favicon Generator:** https://favicon.io (create .ico files)
- **Image Resizer:** https://www.iloveimg.com/resize-image

---

## 🎯 DEPLOYMENT STATUS

After uploading files to GitHub:
- Vercel automatically detects changes
- Rebuild typically takes **2-3 minutes**
- Check build status at: https://vercel.com/dashboard
- Green checkmark = successful deployment
- Red X = build error (check logs)

---

**Last Updated:** February 2026
**Repo:** https://github.com/Nesbit25/HPS-WEB-FEBRUARY
