import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface UploadedImage {
  id: string;
  url: string;
  file: File;
  type: 'before' | 'after' | null;
  position: number; // Changed from orientation string to position number
}

interface GalleryOrientationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number;
  caseTitle: string;
  accessToken: string;
  onSaved: () => void;
}

export function GalleryOrientationManager({
  isOpen,
  onClose,
  caseId,
  caseTitle,
  accessToken,
  onSaved
}: GalleryOrientationManagerProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    try {
      // Create preview URLs for all files
      const newImages: UploadedImage[] = files.map((file, index) => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        file,
        type: null,
        position: index + 2 // Start from position 2 (position 1 is the default before/after)
      }));

      setUploadedImages(prev => [...prev, ...newImages]);
    } catch (error) {
      alert(`Error loading images: ${error.message}`);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.url);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const handleSetType = (id: string, type: 'before' | 'after') => {
    setUploadedImages(prev => prev.map(img => 
      img.id === id ? { ...img, type } : img
    ));
  };

  const handleSetPosition = (id: string, position: number) => {
    setUploadedImages(prev => prev.map(img => 
      img.id === id ? { ...img, position } : img
    ));
  };

  const handleSave = async () => {
    // Validate that all images have type and position
    const untaggedImages = uploadedImages.filter(img => !img.type);
    if (untaggedImages.length > 0) {
      alert('Please tag all images as "Before" or "After" before saving.');
      return;
    }

    if (uploadedImages.length === 0) {
      alert('Please upload at least one image.');
      return;
    }

    setSaving(true);

    try {
      // Group images by orientation
      const orientationGroups: { [key: string]: { before?: File, after?: File } } = {};
      
      uploadedImages.forEach(img => {
        if (!orientationGroups[img.position]) {
          orientationGroups[img.position] = {};
        }
        if (img.type === 'before') {
          orientationGroups[img.position].before = img.file;
        } else if (img.type === 'after') {
          orientationGroups[img.position].after = img.file;
        }
      });

      // Upload each orientation
      for (const [orientationName, images] of Object.entries(orientationGroups)) {
        console.log(`[Orientation Manager] Uploading orientation: ${orientationName}`);

        // 1. Register the orientation with the case
        const registerResponse = await fetch(`${serverUrl}/gallery/case/${caseId}/orientation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ orientationName })
        });

        if (!registerResponse.ok) {
          throw new Error(`Failed to register orientation: ${orientationName}`);
        }

        // 2. Upload before image if exists
        if (images.before) {
          const beforeBase64 = await fileToBase64(images.before);
          const beforeResponse = await fetch(`${serverUrl}/content/gallery_${caseId}_${orientationName}_before`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value: beforeBase64 })
          });

          if (!beforeResponse.ok) {
            throw new Error(`Failed to upload before image for ${orientationName}`);
          }
          console.log(`[Orientation Manager] Uploaded before image for ${orientationName}`);
        }

        // 3. Upload after image if exists
        if (images.after) {
          const afterBase64 = await fileToBase64(images.after);
          const afterResponse = await fetch(`${serverUrl}/content/gallery_${caseId}_${orientationName}_after`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value: afterBase64 })
          });

          if (!afterResponse.ok) {
            throw new Error(`Failed to upload after image for ${orientationName}`);
          }
          console.log(`[Orientation Manager] Uploaded after image for ${orientationName}`);
        }
      }

      // Clear cache
      localStorage.removeItem('gallery_items_cache');
      localStorage.removeItem('gallery_items_cache_timestamp');

      alert(`Successfully added ${Object.keys(orientationGroups).length} orientation(s) to the case!`);
      
      // Clean up URLs
      uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
      setUploadedImages([]);
      
      onSaved();
      onClose();
    } catch (error) {
      console.error('[Orientation Manager] Error:', error);
      alert(`Error saving images: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  if (!isOpen) return null;

  const orientationOptions = ['front', 'side', 'angle', '3/4', 'profile', 'oblique'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1a1f2e]/95 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-[#242938] border-2 border-[#2d3548] rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2d3548]">
              <div>
                <h2 className="text-2xl font-serif text-[#faf9f7]">Add Orientations</h2>
                <p className="text-sm text-gray-400 mt-1">Case #{caseId}: {caseTitle}</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-[#1a1f2e] hover:bg-[#2d3548] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#faf9f7]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Upload Area */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-32 border-2 border-dashed border-[#c9b896]/40 bg-[#1a1f2e] hover:bg-[#1a1f2e]/80 hover:border-[#c9b896] rounded-xl transition-all"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-[#c9b896]" />
                    <span className="text-[#faf9f7]">
                      {uploading ? 'Loading images...' : 'Click to upload multiple images'}
                    </span>
                    <span className="text-xs text-gray-400">
                      Upload all angles, then tag them below
                    </span>
                  </div>
                </Button>
              </div>

              {/* Instructions */}
              {uploadedImages.length > 0 && (
                <div className="mb-4 p-4 bg-[#c9b896]/10 border border-[#c9b896]/20 rounded-lg">
                  <p className="text-sm text-[#faf9f7]">
                    <strong>Instructions:</strong> For each image, select whether it's a "Before" or "After" photo, 
                    and choose which orientation/angle it represents. You can upload multiple angles at once.
                  </p>
                </div>
              )}

              {/* Uploaded Images Grid */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedImages.map((img) => (
                    <Card key={img.id} className="bg-[#1a1f2e] border border-[#2d3548] p-4">
                      {/* Image Preview */}
                      <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-[#242938]">
                        <img 
                          src={img.url} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        {/* Delete button */}
                        <button
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                        {/* Type badge */}
                        {img.type && (
                          <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-semibold ${
                            img.type === 'before' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-[#c9b896] text-[#1a1f2e]'
                          }`}>
                            {img.type === 'before' ? 'BEFORE' : 'AFTER'}
                          </div>
                        )}
                      </div>

                      {/* Type Selection */}
                      <div className="mb-3">
                        <label className="text-xs text-gray-400 mb-2 block">Type:</label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={img.type === 'before' ? 'default' : 'outline'}
                            onClick={() => handleSetType(img.id, 'before')}
                            className={`flex-1 ${img.type === 'before' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}`}
                          >
                            {img.type === 'before' && <Check className="w-4 h-4 mr-1" />}
                            Before
                          </Button>
                          <Button
                            size="sm"
                            variant={img.type === 'after' ? 'default' : 'outline'}
                            onClick={() => handleSetType(img.id, 'after')}
                            className={`flex-1 ${img.type === 'after' ? 'bg-[#c9b896] hover:bg-[#b8976a] text-[#1a1f2e]' : ''}`}
                          >
                            {img.type === 'after' && <Check className="w-4 h-4 mr-1" />}
                            After
                          </Button>
                        </div>
                      </div>

                      {/* Orientation Selection */}
                      <div>
                        <label className="text-xs text-gray-400 mb-2 block">Position:</label>
                        <select
                          value={img.position}
                          onChange={(e) => handleSetPosition(img.id, parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-[#242938] border border-[#2d3548] rounded-lg text-[#faf9f7] text-sm"
                        >
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((posNum) => (
                            <option key={posNum} value={posNum}>Position {posNum}</option>
                          ))}
                        </select>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {uploadedImages.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Upload className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No images uploaded yet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4 p-6 border-t border-[#2d3548]">
              <div className="text-sm text-gray-400">
                {uploadedImages.length} image(s) uploaded
                {uploadedImages.filter(i => !i.type).length > 0 && (
                  <span className="text-yellow-500 ml-2">
                    • {uploadedImages.filter(i => !i.type).length} untagged
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                  className="border-[#2d3548] text-[#faf9f7] hover:bg-[#2d3548]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || uploadedImages.length === 0}
                  className="bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a]"
                >
                  {saving ? 'Saving...' : 'Save Orientations'}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}