import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Upload, Loader } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface HeroImageUploaderProps {
  isOpen: boolean;
  type: 'desktop' | 'mobile';
  onClose: () => void;
  onUploadComplete: (newImageUrl: string) => void;
  accessToken?: string;
}

export function HeroImageUploader({ isOpen, type, onClose, onUploadComplete, accessToken }: HeroImageUploaderProps) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // For desktop, target landscape 1920x1080
          // For mobile, target portrait 1080x1920
          if (type === 'desktop') {
            // Landscape optimization
            if (width > maxWidth || height > maxHeight) {
              const aspectRatio = width / height;
              if (width > height) {
                width = maxWidth;
                height = width / aspectRatio;
              } else {
                height = maxHeight;
                width = height * aspectRatio;
              }
            }
          } else {
            // Mobile portrait - swap dimensions
            const mobileWidth = 1080;
            const mobileHeight = 1920;
            if (width > mobileWidth || height > mobileHeight) {
              const aspectRatio = width / height;
              if (height > width) {
                height = mobileHeight;
                width = height * aspectRatio;
              } else {
                width = mobileWidth;
                height = width / aspectRatio;
              }
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with quality compression
          const base64 = canvas.toDataURL('image/jpeg', quality);
          const base64Data = base64.split(',')[1];
          
          console.log(`[HeroImageUploader] Compressed ${type} image to:`, Math.round(base64Data.length * 0.75 / 1024), 'KB');
          
          resolve(base64Data);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!uploadFile || !accessToken) return;

    try {
      setUploading(true);
      console.log(`[HeroImageUploader] Starting ${type} hero upload...`);

      // Compress the image
      const base64Data = await compressImage(uploadFile);
      console.log(`[HeroImageUploader] Uploading to server...`);

      const uploadResponse = await fetch(`${serverUrl}/photos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: `hero-${type}-${Date.now()}.jpg`,
          fileData: base64Data,
          category: 'facility',
          title: `Hero ${type.charAt(0).toUpperCase() + type.slice(1)} Image`,
          caption: `Main hero image for ${type} view`,
          displayLocation: 'hero',
          status: 'published',
          featured: true
        })
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[HeroImageUploader] Upload failed:', uploadResponse.status, errorText);
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('[HeroImageUploader] Upload successful:', uploadData);

      if (!uploadData.success || !uploadData.publicUrl) {
        throw new Error('Upload response missing required data');
      }

      // Save the URL to the content database
      const contentKey = type === 'desktop' ? 'home_hero_desktop_image' : 'home_hero_mobile_image';
      const saveResponse = await fetch(`${serverUrl}/content/${contentKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: uploadData.publicUrl })
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save hero image URL');
      }

      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} hero image uploaded! Refresh the page to see the new image.`);
      onUploadComplete(uploadData.publicUrl);
      onClose();
    } catch (error) {
      console.error('[HeroImageUploader] Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload {type.charAt(0).toUpperCase() + type.slice(1)} Hero Image</DialogTitle>
          <DialogDescription>
            {type === 'desktop' 
              ? 'Upload a landscape image (recommended: 1920x1080px or larger)'
              : 'Upload a portrait image (recommended: 1080x1920px or larger)'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!uploadPreview ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <Label htmlFor="hero-file-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <p className="font-medium">Click to upload hero image</p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG or WEBP
                    </p>
                  </div>
                </Label>
                <Input
                  id="hero-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`relative rounded-xl overflow-hidden ${type === 'desktop' ? 'aspect-video' : 'aspect-[9/16]'}`}>
                <img 
                  src={uploadPreview} 
                  alt="Upload preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadFile(null);
                    setUploadPreview(null);
                  }}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="rounded-full bg-secondary hover:bg-secondary/90"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload & Save'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
