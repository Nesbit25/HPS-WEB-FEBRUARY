# Logo Files

## 📍 EXACT UPLOAD LOCATION
Upload your logo files to this folder: `/public/images/logos/`

## 📝 FILE NAMING (EXACT NAMES REQUIRED)

Upload these logo files with exact names:

### 1. **`logo-main.svg`** (REQUIRED)
- Main logo for header (dark backgrounds)
- **Format:** SVG (scalable vector)
- **Color:** White or light colored
- **Background:** Transparent
- **Usage:** Desktop & mobile header navigation

### 2. **`logo-main.png`** (FALLBACK)
- PNG fallback if SVG doesn't work
- **Format:** PNG with transparency
- **Size:** 400px width recommended
- **Color:** White or light colored
- **Usage:** Backup for older browsers

### 3. **`logo-white.svg`** (OPTIONAL)
- White version for dark backgrounds
- **Format:** SVG
- **Color:** Pure white (#FFFFFF)
- **Usage:** Footer or dark sections

### 4. **`logo-dark.svg`** (OPTIONAL)
- Dark version for light backgrounds
- **Format:** SVG
- **Color:** Navy (#1a1f2e)
- **Usage:** Light backgrounds or print materials

### 5. **`logo-icon.svg`** (OPTIONAL)
- Icon-only version (no text)
- **Format:** SVG
- **Size:** Square (1:1 aspect ratio)
- **Usage:** Favicon, mobile app icons

### 6. **`favicon.ico`** (RECOMMENDED)
- Browser tab icon
- **Format:** .ico file
- **Size:** 32x32px or 16x16px
- **Usage:** Browser tabs and bookmarks

## 📏 LOGO SPECIFICATIONS

### SVG Guidelines:
- Clean vector paths (no raster images embedded)
- Remove unnecessary layers/groups
- Optimize file size (use SVGOMG.com)
- Ensure viewBox is set correctly
- Width should be reasonable (300-500px)

### PNG Guidelines (if using):
- Transparent background (alpha channel)
- High resolution (2x for retina: 800px width)
- Compressed (use TinyPNG.com)
- File size under 100KB

## ⚠️ CRITICAL RULES
- **`logo-main.svg`** is REQUIRED (site won't load without it)
- File names are **case-sensitive**
- Do NOT add spaces or special characters
- Use lowercase extensions (`.svg`, `.png`, `.ico`)
- Test logo visibility on both light and dark backgrounds

## 📤 HOW TO UPLOAD

### Via GitHub:
1. Go to: `https://github.com/Nesbit25/HPS-WEB-FEBRUARY/tree/hosted/public/images/logos`
2. Click "Add file" → "Upload files"
3. Drag your logo files (named exactly as above)
4. Commit changes
5. Wait 2-3 minutes for Vercel to rebuild

### Via Git Command Line:
```bash
git checkout hosted
git add public/images/logos/logo-main.svg
git add public/images/logos/logo-main.png
git add public/images/logos/favicon.ico
git commit -m "Update logo files"
git push origin hosted
```

## 🎨 LOGO DESIGN TIPS
- Should be legible at small sizes (mobile header)
- High contrast against navy background (#1a1f2e)
- Simple, professional, clean design
- Consider adding tagline beneath logo if space allows
- Test logo on actual devices at different sizes

## 🔍 CURRENT LOGO LOCATIONS IN CODE
The logo appears in:
- Header navigation (desktop & mobile)
- Footer
- Favicon (browser tab)
- Social media share previews (og:image)
