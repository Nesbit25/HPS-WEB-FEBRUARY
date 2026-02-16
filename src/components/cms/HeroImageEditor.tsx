import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEditMode } from '../../contexts/EditModeContext';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Edit2, Check, ArrowLeft, Target, Upload } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function HeroImageEditor() {
  const { isAdmin, accessToken } = useAuth();
  const { isEditMode } = useEditMode();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<number>(1);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 });
  const [showFocalPointPicker, setShowFocalPointPicker] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${serverUrl}/photos`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setShowFocalPointPicker(false);
    setSelectedPhoto(null);
    setUploadFile(null);
    setUploadPreview(null);
    fetchPhotos();
  };

  const handlePhotoSelect = (photo: any) => {
    setSelectedPhoto(photo);
    setShowFocalPointPicker(true);
    setFocalPoint({ x: 50, y: 50 });
  };

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

  // Helper function to compress image before upload
  const compressImage = (file: File, maxWidth: number = 1200, maxHeight: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // More aggressive sizing - reduce to max 1200x800
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

          // Convert to base64 with more aggressive compression (70% quality)
          const base64 = canvas.toDataURL('image/jpeg', quality);
          const base64Data = base64.split(',')[1];
          
          // Log the size for debugging
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

  const handleUpload = async () => {
    if (!uploadFile || !accessToken) return;

    try {
      setUploading(true);

      // Compress the image before uploading
      console.log('[HeroImageEditor] Starting compression...');
      const base64Data = await compressImage(uploadFile);
      console.log('[HeroImageEditor] Compression complete, size:', Math.round(base64Data.length * 0.75 / 1024), 'KB');
      console.log('[HeroImageEditor] Uploading to server...');

      const uploadResponse = await fetch(`${serverUrl}/photos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: uploadFile.name,
          fileData: base64Data,
          category: 'facility',
          title: `Hero Slide ${selectedSlide}`,
          caption: `Uploaded for hero carousel slide ${selectedSlide}`,
          displayLocation: 'hero',
          status: 'published',
          featured: false
        })
      });

      console.log('[HeroImageEditor] Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[HeroImageEditor] Upload failed with status:', uploadResponse.status);
        console.error('[HeroImageEditor] Error response:', errorText);
        throw new Error(`Failed to upload image: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('[HeroImageEditor] Upload successful:', uploadData);

      // Check if upload was successful
      if (!uploadData.success || !uploadData.publicUrl) {
        console.error('[HeroImageEditor] Upload response missing data:', uploadData);
        throw new Error('Upload response missing required data');
      }

      // Set the uploaded photo as selected and move to focal point picker
      setSelectedPhoto({
        id: uploadData.photoId,
        publicUrl: uploadData.publicUrl,
        title: `Hero Slide ${selectedSlide}`,
        category: 'facility'
      });
      setShowFocalPointPicker(true);
      setFocalPoint({ x: 50, y: 50 });
      setUploadFile(null);
      setUploadPreview(null);
      
      console.log('[HeroImageEditor] Ready for focal point selection');
    } catch (error) {
      console.error('[HeroImageEditor] Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFocalPointClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFocalPoint({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleSelectImage = async () => {
    if (!selectedPhoto || !accessToken) return;

    try {
      const contentKey = `home_hero_image_${selectedSlide}`;
      const focalKey = `home_hero_focal_${selectedSlide}`;
      
      await Promise.all([
        fetch(`${serverUrl}/content/${contentKey}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: selectedPhoto.publicUrl })
        }),
        fetch(`${serverUrl}/content/${focalKey}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: `${focalPoint.x}% ${focalPoint.y}%` })
        })
      ]);

      alert('Hero image and focal point updated! Refresh the page to see changes.');
      setIsOpen(false);
      setSelectedPhoto(null);
      setShowFocalPointPicker(false);
    } catch (error) {
      console.error('Error saving image:', error);
      alert(`Failed to save image: ${error}`);
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = categoryFilter === 'all' || photo.category === categoryFilter;
    const matchesSearch = !searchTerm || 
      photo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.caption?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  if (!isAdmin || !isEditMode) {
    return null;
  }

  return (
    <>
      <div className="container mx-auto px-6 -mt-10 mb-10 relative z-10">
        <Button
          onClick={handleOpen}
          className="rounded-full bg-secondary hover:bg-secondary/90 text-white shadow-lg"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Hero Images
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="rounded-2xl max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showFocalPointPicker && (
                <Button
                  variant="ghost"
                  onClick={() => setShowFocalPointPicker(false)}
                  className="mr-2"
                >
                  ← Back
                </Button>
              )}
              {showFocalPointPicker ? 'Adjust Image Position' : `Edit Hero Images`}
            </DialogTitle>
            <DialogDescription>
              {showFocalPointPicker ? 'Click on the image to set the focal point for different screen sizes.' : 'Upload and manage hero images for different slides.'}
            </DialogDescription>
          </DialogHeader>
          
          {!showFocalPointPicker ? (
            <div className="space-y-4">
              {/* Select Slide */}
              <div>
                <Label>Select Hero Slide</Label>
                <Select value={selectedSlide.toString()} onValueChange={(val) => setSelectedSlide(parseInt(val))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Slide 1</SelectItem>
                    <SelectItem value="2">Slide 2</SelectItem>
                    <SelectItem value="3">Slide 3</SelectItem>
                    <SelectItem value="4">Slide 4</SelectItem>
                    <SelectItem value="5">Slide 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabs for Gallery vs Upload */}
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
                          className="cursor-pointer transition-all rounded-xl overflow-hidden hover:ring-2 hover:ring-secondary/50"
                          onClick={() => handlePhotoSelect(photo)}
                        >
                          <div className="aspect-square relative">
                            <img 
                              src={photo.publicUrl} 
                              alt={photo.title || photo.caption}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-xs truncate">{photo.title || photo.caption || 'Untitled'}</p>
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
                            <p className="font-medium">Click to upload hero image</p>
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
                            onClick={handleUpload}
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
                      The crosshair shows where the image will be centered. This helps ensure the most important part 
                      of the image is visible on all screen sizes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Desktop Preview */}
                <div>
                  <Label className="mb-2 block">Desktop Preview (16:9)</Label>
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
                      className="absolute w-8 h-8 pointer-events-none"
                      style={{ 
                        left: `${focalPoint.x}%`, 
                        top: `${focalPoint.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="absolute inset-0 border-2 border-white rounded-full shadow-lg" />
                      <div className="absolute left-1/2 top-0 w-px h-full bg-white shadow-lg" style={{ transform: 'translateX(-50%)' }} />
                      <div className="absolute top-1/2 left-0 h-px w-full bg-white shadow-lg" style={{ transform: 'translateY(-50%)' }} />
                    </div>
                  </div>
                </div>

                {/* Mobile Preview */}
                <div>
                  <Label className="mb-2 block">Mobile Preview (4:3)</Label>
                  <div 
                    className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-crosshair border-2 border-secondary mx-auto max-w-sm"
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
                      className="absolute w-8 h-8 pointer-events-none"
                      style={{ 
                        left: `${focalPoint.x}%`, 
                        top: `${focalPoint.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="absolute inset-0 border-2 border-white rounded-full shadow-lg" />
                      <div className="absolute left-1/2 top-0 w-px h-full bg-white shadow-lg" style={{ transform: 'translateX(-50%)' }} />
                      <div className="absolute top-1/2 left-0 h-px w-full bg-white shadow-lg" style={{ transform: 'translateY(-50%)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Focal Point Coordinates */}
              <div className="text-center text-sm text-muted-foreground">
                Focal Point: {focalPoint.x.toFixed(1)}%, {focalPoint.y.toFixed(1)}%
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end border-t pt-4">
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
                  onClick={handleSelectImage}
                  className="rounded-full bg-secondary hover:bg-secondary/90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Image & Position
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}