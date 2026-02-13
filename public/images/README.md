# Static Image Assets

This folder contains all static images that are deployed with the website.

## 📁 FOLDER STRUCTURE

```
/public/images/
├── hero/           - Hero carousel images (home page)
│   ├── desktop/    - Desktop hero images (16:9 landscape)
│   └── mobile/     - Mobile hero images (2:3 portrait)
└── logos/          - Logo files (header, footer, favicon)
```

## 🎯 QUICK REFERENCE

| Asset Type | Upload Location | File Name | Dimensions |
|------------|-----------------|-----------|------------|
| Desktop Hero 1 | `/public/images/hero/desktop/` | `hero-slide-1.jpg` | 1920x1080px |
| Desktop Hero 2 | `/public/images/hero/desktop/` | `hero-slide-2.jpg` | 1920x1080px |
| Desktop Hero 3 | `/public/images/hero/desktop/` | `hero-slide-3.jpg` | 1920x1080px |
| Mobile Hero 1 | `/public/images/hero/mobile/` | `hero-slide-1.jpg` | 800x1200px |
| Mobile Hero 2 | `/public/images/hero/mobile/` | `hero-slide-2.jpg` | 800x1200px |
| Mobile Hero 3 | `/public/images/hero/mobile/` | `hero-slide-3.jpg` | 800x1200px |
| Main Logo | `/public/images/logos/` | `logo-main.svg` | SVG vector |
| PNG Logo | `/public/images/logos/` | `logo-main.png` | 400px width |
| Favicon | `/public/images/logos/` | `favicon.ico` | 32x32px |

## 📤 UPLOAD METHODS

### Method 1: GitHub Web Interface (Easiest)
1. Navigate to the specific folder on GitHub
2. Click "Add file" → "Upload files"
3. Drag and drop your files
4. Click "Commit changes"

### Method 2: Git Command Line
```bash
# Add specific files
git add public/images/hero/desktop/hero-slide-1.jpg
git commit -m "Update hero image 1"
git push

# Or add all images at once
git add public/images/
git commit -m "Update all images"
git push
```

### Method 3: GitHub Desktop App
1. Copy files to the correct folder on your computer
2. Open GitHub Desktop
3. You'll see the new files listed
4. Write commit message
5. Click "Commit to main"
6. Click "Push origin"

## ⏱️ DEPLOYMENT TIME
After uploading to GitHub, Vercel will automatically rebuild the site.
- Typical deployment time: **2-3 minutes**
- Check status at: https://vercel.com/dashboard

## 🚫 WHAT NOT TO PUT HERE
- **Patient photos** (before/after) - These belong in Supabase Storage (HIPAA-compliant)
- **User-uploaded content** - Should use Supabase Storage
- **Large files** (>500KB) - Compress images first
- **Sensitive information** - Public folder is visible to everyone

## ✅ WHAT GOES HERE
- **Marketing images** (hero banners, backgrounds)
- **Logo files** (SVG, PNG, ICO)
- **Static assets** (robots.txt, sitemap.xml)
- **Icons and graphics** that don't change often

## 🔐 SECURITY NOTE
All files in `/public/` are **publicly accessible** on the internet.
Do NOT upload:
- Patient photos
- Personal information
- Passwords or API keys
- Unpublished marketing materials

## 📞 NEED HELP?
If images aren't showing after upload:
1. Check file names match exactly (case-sensitive)
2. Verify files are in correct folder
3. Wait 3-5 minutes for deployment
4. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
5. Check browser console for errors (F12)
