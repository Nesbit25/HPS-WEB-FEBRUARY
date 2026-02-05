import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Upload, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { createClient } from '../../utils/supabase/client';

interface GalleryImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  imageType: 'before' | 'after';
  galleryItemId: number;
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
}

export function GalleryImageUploader({
  isOpen,
  onClose,
  imageType,
  galleryItemId,
  currentImageUrl,
  onImageUploaded
}: GalleryImageUploaderProps) {
  const { accessToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      alert('Image must be less than 15MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !accessToken) return;

    setUploading(true);

    try {
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );

      // Create bucket name for gallery images
      const bucketName = 'make-fc862019-gallery';

      // Upload to Supabase Storage
      const fileName = `${imageType}_${galleryItemId}_${Date.now()}.${selectedFile.name.split('.').pop()}`;
      const filePath = `gallery/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('[GalleryImageUploader] Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Save the URL to KV store
      const contentKey = `gallery_${galleryItemId}_${imageType}`;
      const saveResponse = await fetch(`${serverUrl}/content/${contentKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: publicUrl
        })
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save image URL');
      }

      console.log('[GalleryImageUploader] Image uploaded successfully:', publicUrl);
      
      onImageUploaded(publicUrl);
      onClose();
    } catch (error) {
      console.error('[GalleryImageUploader] Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(currentImageUrl || null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Upload {imageType === 'before' ? 'Before' : 'After'} Image
          </DialogTitle>
          <DialogDescription>
            Upload a high-quality image for the gallery case. Recommended aspect ratio is 3:4, maximum file size 5MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          {previewUrl ? (
            <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              {selectedFile && (
                <button
                  onClick={handleRemove}
                  className="absolute top-2 right-2 w-8 h-8 bg-destructive hover:bg-destructive/90 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="aspect-[3/4] border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No image selected</p>
              </div>
            </div>
          )}

          {/* File Input */}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
              disabled={uploading}
            />
            <label htmlFor="image-upload">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={uploading}
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </span>
              </Button>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Recommended: High-quality images in 3:4 aspect ratio. Max 15MB.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}