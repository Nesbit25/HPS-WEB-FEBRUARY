# Hero Image Specifications

## Image Dimensions

### Desktop Hero (Landscape)
- **Ideal Size:** 1920 x 1080 pixels
- **Aspect Ratio:** 16:9 (widescreen)
- **Orientation:** Landscape/Horizontal
- **Max File Size:** Automatically compressed to ~200-400KB
- **Format:** JPG recommended (PNG supported)

### Mobile Hero (Portrait)
- **Ideal Size:** 1080 x 1920 pixels
- **Aspect Ratio:** 9:16 (phone screen)
- **Orientation:** Portrait/Vertical
- **Max File Size:** Automatically compressed to ~200-400KB
- **Format:** JPG recommended (PNG supported)

## File Locations

Images are stored in:
- Desktop: `/public/images/hero/desktop/hero-slide-1.jpg`
- Mobile: `/public/images/hero/mobile/hero-slide-1.jpg`

## How to Upload Hero Images

### Method 1: Direct GitHub Upload (FASTEST - 30 seconds)
1. Go to: `https://github.com/Nesbit25/HPS-WEB-FEBRUARY/upload/main/public/images/hero/desktop`
2. Upload your desktop image named `hero-slide-1.jpg`
3. Go to: `https://github.com/Nesbit25/HPS-WEB-FEBRUARY/upload/main/public/images/hero/mobile`
4. Upload your mobile image named `hero-slide-1.jpg`
5. Wait 2 minutes for Vercel to auto-deploy

### Method 2: Admin Panel (In-Browser)
1. Login to admin dashboard
2. Enable Edit Mode
3. Scroll to hero section
4. Click "Upload Desktop Hero Image" or "Upload Mobile Hero Image"
5. Select your image file
6. Click "Upload & Replace"

## Image Optimization

All hero images are automatically:
- Compressed to 80% JPEG quality
- Resized to optimal dimensions (1920x1080 or 1080x1920)
- Converted to base64 and stored in Supabase
- Served with proper aspect ratios
- Cached for performance

## Recommended Image Content

- **Desktop:** Wide landscape shots, horizontal composition
- **Mobile:** Tall portrait shots, vertical composition
- **Both:** High resolution, professional quality, properly exposed
- **Avoid:** Text overlays (text is added by the site), busy backgrounds that compete with headline text

## Current Hero Image Paths

The system looks for images at:
```
/images/hero/desktop/hero-slide-1.jpg  (fallback: .png)
/images/hero/mobile/hero-slide-1.jpg   (fallback: .png)
```

## Position Adjustment

After uploading, you can adjust the focal point:
- Click "Adjust Desktop Hero" button in edit mode
- Click "Adjust Mobile Hero" button in edit mode
- Drag the image to position the focal point
- Changes save automatically
