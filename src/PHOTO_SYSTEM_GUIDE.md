# Photo Assignment System - User Guide

## Overview
The photo assignment system allows you to upload photos once and assign them to multiple places across your website (hero images, about page, services, etc.).

## How It Works

### 1. Upload Photos (Admin Dashboard)
- Go to **Admin Dashboard** → **Photos** tab
- Click **"Upload New Photo"**
- Fill in the form:
  - **Title**: Descriptive name (e.g., "Modern Reception Area")
  - **Category**: Facility, Team, or Other
  - **Caption**: Optional description
  - **Status**: Published (so it appears in the selector)
- Upload your image
- Click **Save**

### 2. Assign Photos to Pages
Once photos are uploaded, you can assign them anywhere on the website:

1. **Enable Edit Mode**
   - Click the admin toolbar toggle in bottom-right
   - Click **"Edit Mode"** button

2. **Find an Editable Image**
   - Hover over any image on the site
   - You'll see an **"Edit Image"** button overlay

3. **Select a Photo**
   - Click **"Edit Image"**
   - Choose from two tabs:
     - **Photo Gallery**: Pick from existing uploads
     - **Upload New**: Upload a new photo directly
   
4. **Filter Your Photos** (in Photo Gallery tab)
   - Use **Search** to find by title/caption
   - Use **Category** dropdown to filter by type
   
5. **Adjust Focal Point**
   - After selecting a photo, click on the preview image
   - The crosshair shows where the image will be centered
   - This ensures the important part of your image is visible
   
6. **Save**
   - Click **"Save Selection"**
   - The image updates immediately on the page

### 3. Where Can You Assign Photos?

The system works on these pages:

#### Home Page
- 5 Hero carousel images (`home_hero_image_1` through `home_hero_image_5`)
- Services section images
- Testimonials section backgrounds

#### About Page
- Team photos
- Facility images
- Dr. Hanemann's portrait

#### Services Pages
- Procedure-specific images
- Before/after context images

#### Contact Page
- Office photos
- Location images

### 4. Managing Your Photo Library

#### View All Photos
- Admin Dashboard → Photos tab
- See all uploaded photos with metadata

#### Edit Photo Details
- Hover over a photo card
- Click the **edit icon** (pencil)
- Update title, category, caption, or status

#### Delete Photos
- Hover over a photo card
- Click the **trash icon**
- Confirm deletion

#### Bulk Delete
- Click **"Delete All"** button at the top
- Confirms before deleting all photos

### 5. Best Practices

**Image Sizes**
- Recommended: 1920x1080px or larger
- Images are automatically compressed to 70% quality
- Keep originals under 10MB

**Naming Convention**
- Use descriptive titles: "Reception Desk - Modern Interior"
- Add location in caption: "Main waiting area, second floor"
- This makes searching easier later

**Categories**
- **Facility**: Buildings, rooms, equipment, interiors
- **Team**: Staff photos, group photos, candids
- **Other**: Anything else

**Status**
- **Published**: Visible in photo selector (default)
- **Draft**: Hidden from selector, only visible in dashboard

**Featured Flag**
- Use to mark your best photos
- Makes them easier to find later
- Can be used for homepage highlights

### 6. Troubleshooting

**Photos not showing in selector?**
- Check status is "Published" not "Draft"
- Refresh the page
- Check browser console for errors

**Image looks cropped weird?**
- Use the focal point adjuster
- Click exactly where you want the center to be
- Save and check again

**Delete not working?**
- Make sure you're logged in as admin
- Check the browser console for error messages
- Try the "Delete All" button for bulk removal

**Want to replace an image?**
- Just select a different photo from the gallery
- The old assignment is replaced automatically
- Original photo stays in your library

## Technical Notes

**Storage**
- Photos stored in Supabase Storage bucket
- Metadata stored in key-value database
- Public URLs are cached for performance

**Photo IDs**
- Format: `photo_[timestamp]`
- Example: `photo_1700000000000`
- Used internally, you don't need to remember these

**Content Keys**
- Each editable image has a unique key
- Example: `home_hero_image_1`
- Focal points stored separately: `home_hero_image_1_focal`

**Compression**
- Max width: 1200px
- Max height: 800px
- Quality: 70%
- Format: JPEG only (converts PNG/WEBP automatically)
