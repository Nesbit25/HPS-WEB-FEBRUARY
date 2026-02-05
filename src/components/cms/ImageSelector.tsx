import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card } from '../ui/card';
import { Upload, Target, Check, Eye, EyeOff } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { ImageLocationSelector } from './ImageLocationSelector';
import { ImageCropper } from './ImageCropper';

interface ImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (photoId: string, publicUrl: string, focalPoint: { x: number; y: number }) => void;
  currentLocation: string; // e.g., "home_hero", "services_section", "about_team"
  locationLabel: string; // e.g., "Home Hero Section"
  cropOrientation?: 'landscape' | 'portrait' | 'square'; // Crop orientation for images
  cropAspectRatio?: number; // Exact aspect ratio (width/height) for cropping
}

export function ImageSelector({ isOpen, onClose, onSelect, currentLocation, locationLabel, cropOrientation = 'landscape', cropAspectRatio }: ImageSelectorProps) {
  const { accessToken } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  
  // Crop
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  
  // Focal point adjustment
  const [showFocalPointPicker, setShowFocalPointPicker] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 });

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  // Fetch photos
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      // Fetch ALL photos (not just published) so admins can select any photo
      const response = await fetch(`${serverUrl}/photos`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPhotos();
    }
  }, [isOpen]);

  // Filter photos
  useEffect(() => {
    let filtered = photos;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.caption?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPhotos(filtered);
  }, [photos, categoryFilter, searchTerm]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImageToCrop(imageUrl);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle crop complete
  const handleCropComplete = (blob: Blob, croppedUrl: string) => {
    setCroppedBlob(blob);
    setUploadPreview(croppedUrl);
    setShowCropper(false);
  };

  // Compress image - now accepts either File or Blob
  const compressImage = (file: File | Blob, maxWidth: number = 1200, maxHeight: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

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

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL('image/jpeg', quality);
          const base64Data = base64.split(',')[1];
          
          console.log('Compressed size:', Math.round(base64Data.length * 0.75 / 1024), 'KB');
          
          resolve(base64Data);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Handle upload and select
  const handleUploadAndSelect = async () => {
    if (!accessToken) return;
    
    // Use cropped blob if available, otherwise fall back to original file
    const fileToUpload = croppedBlob || uploadFile;
    if (!fileToUpload) return;

    try {
      setUploading(true);

      const base64Data = await compressImage(fileToUpload);

      const uploadResponse = await fetch(`${serverUrl}/photos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: uploadFile ? uploadFile.name : 'cropped_image.jpg',
          fileData: base64Data,
          category: 'facility',
          title: locationLabel,
          caption: `Image for ${locationLabel}`,
          displayLocation: currentLocation,
          status: 'published',
          featured: false
        })
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload image: ${errorText}`);
      }

      const uploadData = await uploadResponse.json();

      setSelectedPhoto({
        id: uploadData.photoId,
        publicUrl: uploadData.publicUrl,
        title: locationLabel,
        category: 'facility'
      });
      setShowFocalPointPicker(true);
      setFocalPoint({ x: 50, y: 50 });
      setUploadFile(null);
      setUploadPreview(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Handle photo selection from gallery
  const handlePhotoSelect = (photo: any) => {
    setSelectedPhoto(photo);
    setShowFocalPointPicker(true);
    setFocalPoint({ x: 50, y: 50 });
  };

  // Handle focal point click
  const handleFocalPointClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFocalPoint({ x, y });
  };

  // Save selection
  const handleSaveSelection = async () => {
    if (!selectedPhoto) return;

    try {
      // Update the photo's display location
      if (accessToken) {
        await fetch(`${serverUrl}/photos/${selectedPhoto.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            displayLocation: currentLocation
          })
        });
      }

      onSelect(selectedPhoto.id, selectedPhoto.publicUrl, focalPoint);
      
      console.log('[ImageSelector] onSelect called with:', {
        photoId: selectedPhoto.id,
        publicUrl: selectedPhoto.publicUrl,
        focalPoint: focalPoint,
        fullPhotoObject: selectedPhoto
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving selection:', error);
      alert('Failed to save selection');
    }
  };

  return (
    <>
      <ImageCropper
        open={showCropper}
        onOpenChange={setShowCropper}
        imageSrc={imageToCrop || ''}
        onCropComplete={handleCropComplete}
        orientation={cropOrientation}
        aspectRatio={cropAspectRatio}
      />
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="rounded-2xl max-w-5xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {showFocalPointPicker ? 'Adjust Image Position' : `Select Image for ${locationLabel}`}
            </DialogTitle>
          </DialogHeader>

          {!showFocalPointPicker ? (
            <div className="space-y-4">
              <Tabs defaultValue="gallery" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl">
                  <TabsTrigger value="gallery" className="rounded-lg">Photo Gallery</TabsTrigger>
                  <TabsTrigger value="upload" className="rounded-lg">Upload New</TabsTrigger>
                </TabsList>

                <TabsContent value="gallery" className="space-y-4 mt-4">
                  {/* Filters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Search</Label>
                      <Input
                        placeholder="Search by title or caption..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="nose">Nose</SelectItem>
                          <SelectItem value="face">Face</SelectItem>
                          <SelectItem value="breast">Breast</SelectItem>
                          <SelectItem value="body">Body</SelectItem>
                          <SelectItem value="facility">Facility</SelectItem>
                          <SelectItem value="team">Team</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Photo Grid */}
                  {loading ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Loading photos...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2">
                      {filteredPhotos.map((photo) => (
                        <Card
                          key={photo.id}
                          className="cursor-pointer transition-all rounded-xl overflow-hidden hover:ring-2 hover:ring-secondary/50 relative"
                          onClick={() => handlePhotoSelect(photo)}
                        >
                          <div className="aspect-video relative">
                            <img src={photo.publicUrl} alt={photo.title} className="w-full h-full object-cover" />
                            
                            {/* Publish Status Badge */}
                            <div className="absolute top-2 right-2">
                              {photo.status === 'published' ? (
                                <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg">
                                  <Eye className="w-3 h-3" />
                                  <span>Published</span>
                                </div>
                              ) : (
                                <div className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg">
                                  <EyeOff className="w-3 h-3" />
                                  <span>Unpublished</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="font-medium text-sm truncate">{photo.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{photo.category}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {filteredPhotos.length === 0 && !loading && (
                    <p className="text-center text-muted-foreground py-8">
                      No photos found. Try different filters or upload a new image.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="upload" className="space-y-4 mt-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8">
                    {!uploadPreview ? (
                      <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <div className="space-y-2">
                            <p className="font-medium">Click to upload image</p>
                            <p className="text-sm text-muted-foreground">
                              PNG, JPG or WEBP (recommended: 1920x1080px or larger)
                            </p>
                          </div>
                        </Label>
                        <Input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative aspect-video rounded-xl overflow-hidden">
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
                            onClick={handleUploadAndSelect}
                            disabled={uploading}
                            className="rounded-full bg-secondary hover:bg-secondary/90"
                          >
                            {uploading ? 'Uploading...' : 'Continue to Position'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="bg-muted p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <p className="font-medium">Click on the image to set the focal point</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The crosshair shows where the image will be centered.
                    </p>
                  </div>
                </div>
              </div>

              {/* Focal Point Picker */}
              <div 
                className="relative aspect-video rounded-xl overflow-hidden cursor-crosshair border-2 border-secondary"
                onClick={handleFocalPointClick}
              >
                <img 
                  src={selectedPhoto.publicUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
                />
                
                {/* Crosshair */}
                <div 
                  className="absolute w-8 h-8 border-2 border-secondary rounded-full pointer-events-none"
                  style={{ 
                    left: `${focalPoint.x}%`, 
                    top: `${focalPoint.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-1 bg-secondary rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFocalPointPicker(false);
                    setSelectedPhoto(null);
                  }}
                  className="rounded-full"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSaveSelection}
                  className="rounded-full bg-secondary hover:bg-secondary/90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Selection
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}