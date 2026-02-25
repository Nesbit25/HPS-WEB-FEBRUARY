# Certification Logos

Upload your board certification and professional organization logo images to this folder. These logos will be displayed on the homepage below the credentials section.

## 📍 EXACT UPLOAD LOCATION
Upload your certification logo files to: `/public/images/certifications/`

## 📝 FILE NAMING (EXACT NAMES REQUIRED)

### Required Files:
- `cert-logo-1.png` (or .jpg or .webp) - **American Society of Plastic Surgeons (ASPS)**
- `cert-logo-2.png` (or .jpg or .webp) - **American Board of Plastic Surgery (ABPS)**
- `cert-logo-3.png` (or .jpg or .webp) - **American Board of Otolaryngology (ABOto)**

## 📏 IMAGE SPECIFICATIONS

### Recommended Specs:
- **Format:** PNG with transparent background (preferred) or JPG
- **Height:** 200-300px (will be displayed at 48-64px tall, responsive)
- **Width:** Variable (maintain original aspect ratio of logo)
- **File size:** Under 200KB each recommended
- **Background:** Transparent (PNG) or white (JPG)

### Display Specifications:
- Logos are displayed at 48px height on mobile, 64px height on desktop
- Width scales proportionally to maintain aspect ratio
- Appears in a bordered container with hover effects
- Gold tint overlay on hover (opacity change)

## 📤 HOW TO UPLOAD

### Via GitHub Web Interface:
1. Go to: `https://github.com/YOUR-USERNAME/hps-web-february/tree/main/public/images/certifications`
2. Click "Add file" → "Upload files"
3. Drag your logo files (named exactly as above)
4. Click "Commit changes"

### Via Git Command Line:
```bash
git add public/images/certifications/cert-logo-1.png
git add public/images/certifications/cert-logo-2.png
git add public/images/certifications/cert-logo-3.png
git commit -m "Add certification logos"
git push
```

### Via GitHub Desktop:
1. Copy logo files to `/public/images/certifications/` on your computer
2. Open GitHub Desktop
3. You'll see the new files listed
4. Write commit message: "Add certification logos"
5. Click "Commit to main"
6. Click "Push origin"

## ⏱️ DEPLOYMENT TIME
After uploading to GitHub, Vercel will automatically rebuild the site.
- Typical deployment time: **2-3 minutes**
- Check status at: https://vercel.com/dashboard

## 🎨 LOGO PREPARATION TIPS

### For PNG files:
- Remove any background (make transparent)
- Ensure the logo has good contrast
- Export at 2x resolution for retina displays (400-600px height)

### For JPG files:
- Use a pure white background
- Ensure high contrast with the logo elements
- Save at high quality (90-95%)

### Color Considerations:
- Logos will have 80% opacity by default
- Hover state increases to 100% opacity
- Gold border and background provide subtle brand color integration
- Ensure your logo has enough contrast to be visible at 80% opacity

## 🚫 IMPORTANT NOTES

### No Fallback Display:
- If certification logo files are missing or fail to load, **nothing will display**
- This is by design to keep the interface clean
- Ensure all three logos are uploaded for the section to display properly

### File Naming is Critical:
- File names are **case-sensitive**
- Must be exactly `cert-logo-1.png`, `cert-logo-2.png`, `cert-logo-3.png`
- Supported extensions: `.png`, `.jpg`, `.jpeg`, `.webp`
- If using different extension, update filename accordingly

## ✅ VERIFICATION CHECKLIST

After uploading, verify your logos are displaying correctly:

1. ✅ Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. ✅ Check homepage - scroll to credentials section
3. ✅ Verify all three logos are visible
4. ✅ Test hover effects (logos should brighten slightly)
5. ✅ Check mobile responsive display
6. ✅ Verify images load quickly (under 200KB each)

## 📞 TROUBLESHOOTING

**Logos not showing after upload?**
1. Check file names match exactly (case-sensitive)
2. Verify files are in `/public/images/certifications/` folder
3. Wait 3-5 minutes for Vercel deployment to complete
4. Clear browser cache completely
5. Check browser console (F12) for any error messages
6. Verify file extensions (.png, .jpg, .webp) are correct

**Logos appear pixelated?**
- Upload higher resolution versions (400-600px height recommended)
- Use PNG format for better quality
- Ensure original logo files are high quality

**Logos have wrong aspect ratio?**
- Use original logo aspect ratios (don't crop squares)
- System automatically scales to fit height
- Width adjusts proportionally

## 🔐 SECURITY NOTE
All files in `/public/` are **publicly accessible** on the internet.
- Only upload official certification/organization logos
- Ensure you have rights to display these logos
- Do not upload patient information or sensitive data
