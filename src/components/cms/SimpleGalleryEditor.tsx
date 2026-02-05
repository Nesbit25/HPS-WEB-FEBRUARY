import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Upload, Loader2, X, Crop } from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import ReactCrop, { Crop as CropType, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface SimpleGalleryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageType: 'before' | 'after';
  galleryItemId: number;
  currentImageUrl?: string;
  onSaved: () => void;
  accessToken: string;
  orientation?: 'front' | 'side' | 'threequarter';
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function SimpleGalleryEditor({
  isOpen,
  onClose,
  imageType,
  galleryItemId,
  currentImageUrl,
  onSaved,
  accessToken,
  orientation
}: SimpleGalleryEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: PixelCrop) => {
    setCompletedCrop(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (imageSrc: string, pixelCrop: CropArea): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Get the scale between displayed image and actual image
    const scaleX = image.naturalWidth / (imgRef?.width || image.naturalWidth);
    const scaleY = image.naturalHeight / (imgRef?.height || image.naturalHeight);

    // Set canvas size to the crop size (scaled to actual image size)
    canvas.width = pixelCrop.width * scaleX;
    canvas.height = pixelCrop.height * scaleY;

    // Draw the cropped image (scaled to actual image coordinates)
    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY
    );

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      }, 'image/jpeg', 0.95);
    });
  };

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous'; // Fix CORS tainted canvas error
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Image must be less than 15MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setOriginalImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleStartCrop = () => {
    // If cropping existing image without a file selected, set it as originalImageUrl
    if (previewUrl && !originalImageUrl) {
      setOriginalImageUrl(previewUrl);
    }
    setCropMode(true);
  };

  const handleCancelCrop = () => {
    setCropMode(false);
    setCrop(undefined);
  };

  const handleApplyCrop = async () => {
    if (!originalImageUrl || !completedCrop) return;

    try {
      const croppedBlob = await createCroppedImage(originalImageUrl, completedCrop);
      
      // Convert blob to data URL for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        // Clear the original image URL so we don't keep showing uncropped version
        setOriginalImageUrl(null);
      };
      reader.readAsDataURL(croppedBlob);

      // Convert blob to file
      const croppedFile = new File([croppedBlob], selectedFile?.name || 'cropped.jpg', {
        type: 'image/jpeg'
      });
      
      setSelectedFile(croppedFile);
      setCropMode(false);
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !accessToken) return;

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const base64Data = await base64Promise;

      // Upload through server endpoint (which uses service role key)
      const fileName = `${imageType}_${galleryItemId}_${Date.now()}.${selectedFile.name.split('.').pop()}`;
      
      const uploadResponse = await fetch(`${serverUrl}/gallery/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName,
          fileData: base64Data,
          galleryItemId,
          imageType
        })
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { publicUrl } = await uploadResponse.json();

      // Save URL to KV store
      const contentKey = `gallery_${galleryItemId}_${imageType}`;
      console.log('[SimpleGalleryEditor] Saving to KV:', { contentKey, publicUrl });
      
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
        const errorText = await saveResponse.text();
        console.error('[SimpleGalleryEditor] Save failed:', errorText);
        throw new Error('Failed to save image URL');
      }

      const saveData = await saveResponse.json();
      console.log('[SimpleGalleryEditor] Save response:', saveData);
      console.log('[SimpleGalleryEditor] Image saved successfully:', publicUrl);

      // Show success message
      alert(`✅ Image uploaded successfully!\n\nKey: ${contentKey}\nURL: ${publicUrl}\n\nRefreshing gallery...`);
      
      onSaved();
      onClose();
    } catch (error) {
      console.error('[SimpleGalleryEditor] Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(currentImageUrl || null);
    setOriginalImageUrl(null);
    setCropMode(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Upload {imageType === 'before' ? 'Before' : 'After'} Image
          </DialogTitle>
          <DialogDescription>
            Upload and crop your {imageType} image for the gallery case.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview / Crop Area - Matches gallery card aspect ratio */}
          <div className="flex justify-center">
            <div className="relative w-80 aspect-[3/4] bg-muted rounded-lg overflow-hidden shadow-xl">
              {cropMode && (originalImageUrl || previewUrl) ? (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  className="max-h-full"
                >
                  <img 
                    src={originalImageUrl || previewUrl || ''}
                    alt="Crop preview"
                    onLoad={(e) => setImgRef(e.currentTarget)}
                    crossOrigin="anonymous"
                    className="max-h-full max-w-full object-contain"
                  />
                </ReactCrop>
              ) : previewUrl ? (
                <>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  {selectedFile && (
                    <button
                      onClick={handleClear}
                      className="absolute top-2 right-2 w-8 h-8 bg-destructive hover:bg-destructive/90 text-white rounded-full flex items-center justify-center transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No image selected</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info text about card preview */}
          {!cropMode && (
            <p className="text-xs text-center text-muted-foreground">
              Preview shows how this image will appear on the gallery card and in the lightbox
            </p>
          )}

          {cropMode && (
            <p className="text-sm text-center text-muted-foreground">
              Drag the corners and edges to adjust the crop area freely
            </p>
          )}

          {/* File Input */}
          {!cropMode && (
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id={`gallery-upload-${galleryItemId}-${imageType}`}
                disabled={uploading}
              />
              <label htmlFor={`gallery-upload-${galleryItemId}-${imageType}`}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {previewUrl ? 'Change Image' : 'Upload from Computer'}
                  </span>
                </Button>
              </label>
            </div>
          )}

          {/* Crop Button (shown when image exists and not in crop mode) */}
          {!cropMode && previewUrl && (
            <Button
              variant="outline"
              onClick={handleStartCrop}
              className="w-full"
              disabled={uploading}
            >
              <Crop className="w-4 h-4 mr-2" />
              {selectedFile ? 'Crop Image' : 'Crop Existing Image'}
            </Button>
          )}

          {/* Actions */}
          {cropMode ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancelCrop}
                className="flex-1"
              >
                Cancel Crop
              </Button>
              <Button
                onClick={handleApplyCrop}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Apply Crop
              </Button>
            </div>
          ) : (
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
                  'Save Image'
                )}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            {cropMode 
              ? 'Adjust the crop area and zoom level, then click "Apply Crop"'
              : 'Recommended: High-quality images in 3:4 aspect ratio. Max 15MB. Use crop tool to remove sensitive areas.'
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}