# 🗺️ VISUAL UPLOAD MAP

## Where Each File Goes (Visual Guide)

```
YOUR COMPUTER                    →    GITHUB REPOSITORY
─────────────────────────────────────────────────────────────────────

📁 YOUR IMAGES FOLDER
├── Desktop Hero Images
│   ├── hero-slide-1.jpg   →  /public/images/hero/desktop/hero-slide-1.jpg
│   ├── hero-slide-2.jpg   →  /public/images/hero/desktop/hero-slide-2.jpg
│   └── hero-slide-3.jpg   →  /public/images/hero/desktop/hero-slide-3.jpg
│
├── Mobile Hero Images
│   ├── hero-slide-1.jpg   →  /public/images/hero/mobile/hero-slide-1.jpg
│   ├── hero-slide-2.jpg   →  /public/images/hero/mobile/hero-slide-2.jpg
│   └── hero-slide-3.jpg   →  /public/images/hero/mobile/hero-slide-3.jpg
│
└── Logo Files
    ├── logo-main.svg      →  /public/images/logos/logo-main.svg
    ├── logo-main.png      →  /public/images/logos/logo-main.png
    └── favicon.ico        →  /public/images/logos/favicon.ico
```

---

## 📸 Image Types Explained

### 🖥️ Desktop Hero Images (Landscape)

```
┌─────────────────────────────────────────┐
│                                         │  ← 16:9 ratio
│         WIDE LANDSCAPE IMAGE            │     (1920 x 1080)
│                                         │
│  [Text appears on LEFT side]            │
│                                         │
└─────────────────────────────────────────┘
```

**Upload to:** `/public/images/hero/desktop/`

---

### 📱 Mobile Hero Images (Portrait)

```
     ┌──────────────┐
     │              │  ← 2:3 ratio
     │   PORTRAIT   │     (800 x 1200)
     │     IMAGE    │
     │              │
     │ [Text in     │
     │  CENTER]     │
     │              │
     └──────────────┘
```

**Upload to:** `/public/images/hero/mobile/`

---

### 🏷️ Logo (SVG/PNG)

```
┌─────────────────────────────────┐
│  HANEMANN PLASTIC SURGERY  🏥   │  ← White/light colored
└─────────────────────────────────┘     Transparent background
```

**Upload to:** `/public/images/logos/`

---

## 🎯 Upload Process Flow

```
┌────────────────┐
│  1. PREPARE    │  Use IMAGE_PREPARATION_CHECKLIST.md
│     IMAGES     │  • Name files correctly
└────────┬───────┘  • Compress to size limits
         │          • Check dimensions
         ↓
┌────────────────┐
│  2. GO TO      │  Click appropriate GitHub link:
│    GITHUB      │  • /hero/desktop/
└────────┬───────┘  • /hero/mobile/
         │          • /logos/
         ↓
┌────────────────┐
│  3. UPLOAD     │  Click "Add file" → "Upload files"
│     FILES      │  Drag and drop your images
└────────┬───────┘  Write commit message
         │
         ↓
┌────────────────┐
│  4. COMMIT     │  Click "Commit changes"
│    CHANGES     │  GitHub saves your files
└────────┬───────┘
         │
         ↓
┌────────────────┐
│  5. WAIT       │  Vercel rebuilds site (2-3 min)
│   2-3 MIN      │  Automatic deployment
└────────┬───────┘
         │
         ↓
┌────────────────┐
│  6. REFRESH    │  Clear cache: Ctrl+Shift+R
│   BROWSER      │  Check your live site
└────────────────┘
```

---

## 📊 File Name Reference

### ✅ CORRECT File Names:

```
Desktop Hero:
  ✓ hero-slide-1.jpg
  ✓ hero-slide-2.jpg  
  ✓ hero-slide-3.jpg

Mobile Hero:
  ✓ hero-slide-1.jpg
  ✓ hero-slide-2.jpg
  ✓ hero-slide-3.jpg

Logos:
  ✓ logo-main.svg
  ✓ logo-main.png
  ✓ favicon.ico
```

### ❌ WRONG File Names:

```
❌ Hero-Slide-1.jpg      (wrong capitalization)
❌ hero_slide_1.jpg      (underscores not dashes)
❌ hero slide 1.jpg      (spaces not allowed)
❌ hero-slide-01.jpg     (zero-padded numbers)
❌ HeroSlide1.jpg        (camelCase)
❌ HERO-SLIDE-1.JPG      (all caps)
❌ Logo-Main.svg         (wrong capitalization)
```

---

## 🎨 Image Dimensions Map

```
DESKTOP HERO               MOBILE HERO              LOGO FILES
─────────────              ────────────             ──────────

1920 × 1080px              800 × 1200px             Vector SVG
┌──────────┐               ┌────┐                   ┌─────┐
│          │               │    │                   │ HPS │
│  16:9    │               │ 2:3│                   └─────┘
│          │               │    │                   400px wide PNG
└──────────┘               │    │                   
                           └────┘                   32×32px ICO
Landscape                  Portrait                 Square
```

---

## 🚦 Upload Status Indicator

After uploading to GitHub:

```
⏳ DEPLOYING...
   └─ Vercel is rebuilding your site
      └─ Wait 2-3 minutes
         └─ Check: https://vercel.com/dashboard

✅ DEPLOYED!
   └─ Site is updated
      └─ Clear browser cache
         └─ Refresh and verify
```

---

## 🗂️ Folder Tree View

```
/public/
  └── images/
      ├── README_START_HERE.md  ← YOU ARE HERE
      ├── README.md
      │
      ├── hero/
      │   ├── desktop/
      │   │   ├── README.md
      │   │   ├── .gitkeep
      │   │   ├── hero-slide-1.jpg  ← UPLOAD HERE (desktop)
      │   │   ├── hero-slide-2.jpg  ← UPLOAD HERE (desktop)
      │   │   └── hero-slide-3.jpg  ← UPLOAD HERE (desktop)
      │   │
      │   └── mobile/
      │       ├── README.md
      │       ├── .gitkeep
      │       ├── hero-slide-1.jpg  ← UPLOAD HERE (mobile)
      │       ├── hero-slide-2.jpg  ← UPLOAD HERE (mobile)
      │       └── hero-slide-3.jpg  ← UPLOAD HERE (mobile)
      │
      └── logos/
          ├── README.md
          ├── .gitkeep
          ├── logo-main.svg         ← UPLOAD HERE (REQUIRED)
          ├── logo-main.png         ← UPLOAD HERE (fallback)
          └── favicon.ico           ← UPLOAD HERE (optional)
```

---

## 🎯 3-Step Quick Start

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: PREPARE                                        │
├─────────────────────────────────────────────────────────┤
│  • Name files exactly: hero-slide-1.jpg etc.            │
│  • Desktop: 1920×1080 landscape                         │
│  • Mobile: 800×1200 portrait                            │
│  • Logo: SVG with transparent background                │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 2: UPLOAD                                         │
├─────────────────────────────────────────────────────────┤
│  Go to GitHub folder → "Add file" → Drag & drop        │
│  Write commit message → Click "Commit changes"          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 3: VERIFY                                         │
├─────────────────────────────────────────────────────────┤
│  Wait 2-3 min → Clear cache → Check live site          │
└─────────────────────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting Map

```
PROBLEM                      →  SOLUTION
────────────────────────────────────────────────────

Image not showing           →  Check file name matches exactly
                               (case-sensitive!)

Wrong orientation           →  Desktop = landscape (wide)
                               Mobile = portrait (tall)

Blurry image               →  Use larger source image
                               Don't upscale small images

Logo not appearing         →  Verify logo-main.svg exists
                               Check transparent background

Files won't upload         →  Check file size limits
                               Compress if needed

Still not working          →  Wait full 3-5 minutes
                               Clear browser cache
                               Check browser console (F12)
```

---

## 📞 Get Help

```
┌──────────────────────────────────────────┐
│  START HERE:                             │
│  DOCUMENTATION_INDEX.md                  │
├──────────────────────────────────────────┤
│  ↓ For quick uploads                     │
│  QUICK_UPLOAD_GUIDE.md                   │
├──────────────────────────────────────────┤
│  ↓ For preparation                       │
│  IMAGE_PREPARATION_CHECKLIST.md          │
├──────────────────────────────────────────┤
│  ↓ For complete guide                    │
│  HERO_IMAGES_LOGOS_UPLOAD_GUIDE.md       │
└──────────────────────────────────────────┘
```

---

**Now you're ready to upload! 🚀**
