import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { Loader2, Upload, X, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { projectId } from '../../utils/supabase/info';

interface BulkGalleryUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  accessToken: string;
}

interface UploadedPhoto {
  id: string;
  file: File;
  preview: string;
  positionNumber: number;
  type: 'before' | 'after' | null;
  caseIndex: number | null;
}

interface CaseGroup {
  id: string;
  caseNumber: number;
  category: string;
  title: string;
  procedure: string;
  journeyNote: string;
}

export function BulkGalleryUploader({
  isOpen,
  onClose,
  onSaved,
  accessToken
}: BulkGalleryUploaderProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [cases, setCases] = useState<CaseGroup[]>([{ id: 'case_1', caseNumber: 1, category: 'Nose', title: '', procedure: '', journeyNote: '' }]);
  const [uploading, setUploading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [applyAllCategory, setApplyAllCategory] = useState<string>('Nose');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;
  const categories = ['Nose', 'Face', 'Breast', 'Body'];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos: UploadedPhoto[] = [];
    let loadedCount = 0;
    
    // Track new cases that need to be created
    const casesToCreate: { [caseName: string]: CaseGroup } = {};
    let updatedCases = [...cases];

    files.forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 15 * 1024 * 1024) {
        alert(`${file.name} is larger than 15MB and will be skipped.`);
        return;
      }

      // SMART FILENAME PARSING
      // Pattern: {CaseName}.pdf_p{PageNumber}_img{Index}.png
      // Example: "Pt #1 Rhino.pdf_p1_img3.png"
      const filenameRegex = /^(.*?)\.pdf_.*_img(\d+)/;
      const match = file.name.match(filenameRegex);
      
      let caseIndex = 0;
      let positionNumber = 1;
      let type: 'before' | 'after' | null = null;
      
      if (match) {
        const caseName = match[1]; // e.g., "Pt #1 Rhino"
        const imgIndex = parseInt(match[2]); // e.g., 3
        
        console.log(`[Smart Parse] File: ${file.name} → Case: "${caseName}", ImgIndex: ${imgIndex}`);
        
        // RULE 1: Find or create case with this name
        let foundCaseIndex = updatedCases.findIndex(c => c.title === caseName);
        
        if (foundCaseIndex === -1) {
          // Case doesn't exist - create it
          if (!casesToCreate[caseName]) {
            const newCaseNumber = Math.max(...updatedCases.map(c => c.caseNumber), 0) + Object.keys(casesToCreate).length + 1;
            casesToCreate[caseName] = {
              id: `case_${Date.now()}_${Object.keys(casesToCreate).length}`,
              caseNumber: newCaseNumber,
              category: 'Nose', // Default category (user can change later)
              title: caseName,
              procedure: '',
              journeyNote: ''
            };
            console.log(`[Smart Parse] Created new case: "${caseName}" (Case #${newCaseNumber})`);
          }
          // Add to updatedCases array so subsequent photos can find it
          updatedCases.push(casesToCreate[caseName]);
          foundCaseIndex = updatedCases.length - 1;
        }
        
        caseIndex = foundCaseIndex;
        
        // RULE 2: Calculate Position (Angle)
        // Formula: Math.ceil(imgIndex / 2)
        // Index 1,2 → Position 1 | Index 3,4 → Position 2 | Index 5,6 → Position 3
        positionNumber = Math.ceil(imgIndex / 2);
        
        // RULE 3: Determine Type (Before/After)
        // Formula: Odd = Before, Even = After
        type = (imgIndex % 2 !== 0) ? 'before' : 'after';
        
        console.log(`[Smart Parse] → Assigned to Case ${caseIndex + 1}, Position ${positionNumber}, Type: ${type}`);
      } else {
        console.log(`[Smart Parse] File "${file.name}" does not match pattern - using defaults`);
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push({
          id: `photo_${Date.now()}_${index}`,
          file,
          preview: reader.result as string,
          positionNumber,
          type,
          caseIndex
        });

        loadedCount++;
        if (loadedCount === files.length) {
          // Update cases first if new ones were created
          const newCasesArray = Object.values(casesToCreate);
          if (newCasesArray.length > 0) {
            setCases([...cases, ...newCasesArray]);
          }
          
          setPhotos([...photos, ...newPhotos]);
          
          // Show summary of auto-tagging
          const autoTaggedCount = newPhotos.filter(p => p.type !== null).length;
          if (autoTaggedCount > 0) {
            console.log(`[Smart Parse] ✅ Auto-tagged ${autoTaggedCount} of ${newPhotos.length} photos`);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updatePhoto = (photoId: string, updates: Partial<UploadedPhoto>) => {
    setPhotos(photos.map(p => p.id === photoId ? { ...p, ...updates } : p));
  };

  const removePhoto = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId));
  };

  const addCase = () => {
    const newCaseNumber = Math.max(...cases.map(c => c.caseNumber), 0) + 1;
    setCases([...cases, {
      id: `case_${Date.now()}`,
      caseNumber: newCaseNumber,
      category: 'Nose',
      title: '',
      procedure: '',
      journeyNote: ''
    }]);
  };

  const removeCase = (caseId: string) => {
    if (cases.length === 1) {
      alert('You must have at least one case.');
      return;
    }
    setPhotos(photos.map(p => {
      const caseToDelete = cases.find(c => c.id === caseId);
      if (caseToDelete && p.caseIndex === cases.indexOf(caseToDelete)) {
        return { ...p, caseIndex: 0 };
      }
      return p;
    }));
    setCases(cases.filter(c => c.id !== caseId));
  };

  const updateCase = (caseId: string, updates: Partial<CaseGroup>) => {
    setCases(cases.map(c => c.id === caseId ? { ...c, ...updates } : c));
  };

  const applyAllCategories = () => {
    if (confirm(`Set all ${cases.length} cases to "${applyAllCategory}"?`)) {
      setCases(cases.map(c => ({ ...c, category: applyAllCategory })));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleBulkUpload = async () => {
    // Validation - only check that we have photos
    if (photos.length === 0) {
      alert('Please upload at least one photo.');
      return;
    }

    // Filter to only tagged photos
    const taggedPhotos = photos.filter(p => p.type);
    const untaggedPhotos = photos.filter(p => !p.type);

    if (taggedPhotos.length === 0) {
      alert('Please tag at least one photo as Before or After before uploading.');
      return;
    }

    // Warn about untagged photos
    if (untaggedPhotos.length > 0) {
      if (!confirm(`${untaggedPhotos.length} photo(s) are untagged and will be skipped. Continue with ${taggedPhotos.length} tagged photo(s)?`)) {
        return;
      }
    }

    // Group ONLY tagged photos by case
    const photosByCase: { [caseIndex: number]: UploadedPhoto[] } = {};
    taggedPhotos.forEach(photo => {
      const caseIdx = photo.caseIndex ?? 0;
      if (!photosByCase[caseIdx]) {
        photosByCase[caseIdx] = [];
      }
      photosByCase[caseIdx].push(photo);
    });

    const casesToUpload = Object.keys(photosByCase).length;
    const totalPhotos = taggedPhotos.length;

    if (!confirm(`Upload ${casesToUpload} case(s) with ${totalPhotos} photo(s)?`)) {
      return;
    }

    setUploading(true);
    setCompletedCount(0);

    try {
      for (const [caseIndexStr, casePhotos] of Object.entries(photosByCase)) {
        const caseIndex = parseInt(caseIndexStr);
        const caseData = cases[caseIndex];
        
        // Safety check: ensure case exists
        if (!caseData) {
          console.error(`[BulkUpload] Case at index ${caseIndex} not found in cases array`);
          throw new Error(`Case configuration missing for index ${caseIndex}. Please refresh and try again.`);
        }
        
        console.log(`[BulkUpload] Uploading case ${caseIndex + 1}...`);

        const createResponse = await fetch(`${serverUrl}/gallery/create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            category: caseData.category,
            title: caseData.title || `${caseData.category} Case`,
            procedure: caseData.procedure || caseData.category,
            journeyNote: caseData.journeyNote || 'Real patient transformation.'
          })
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to create case ${caseIndex + 1}`);
        }

        const { id: caseId, slug: caseSlug } = await createResponse.json();

        const photosByPosition: { [position: number]: { before?: UploadedPhoto, after?: UploadedPhoto } } = {};
        casePhotos.forEach(photo => {
          if (!photosByPosition[photo.positionNumber]) {
            photosByPosition[photo.positionNumber] = {};
          }
          if (photo.type === 'before') {
            photosByPosition[photo.positionNumber].before = photo;
          } else if (photo.type === 'after') {
            photosByPosition[photo.positionNumber].after = photo;
          }
        });

        for (const [positionStr, positionPhotos] of Object.entries(photosByPosition)) {
          const position = parseInt(positionStr);
          const positionName = position.toString();

          console.log(`[BulkUpload] Processing position ${position} for case ${caseSlug}`);

          let beforeImageUrl = null;
          let afterImageUrl = null;

          if (positionPhotos.before) {
            const beforeBase64 = await fileToBase64(positionPhotos.before.file);
            const fileExtension = positionPhotos.before.file.name.split('.').pop() || 'png';
            
            // Calculate image index from position and type
            const imageIndex = (position * 2) - 1; // Position 1 before = img1, Position 2 before = img3, etc.
            const filename = `${caseSlug}_p${position}_img${imageIndex}.${fileExtension}`;
            
            console.log(`[BulkUpload] Uploading before image to Supabase Storage: ${filename}`);
            
            const beforeUploadResponse = await fetch(`${serverUrl}/gallery/upload`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fileName: filename,
                fileData: beforeBase64,
                galleryItemId: caseId,
                imageType: 'before'
              })
            });

            if (!beforeUploadResponse.ok) {
              const errorData = await beforeUploadResponse.json();
              throw new Error(`Failed to upload before image to Supabase: ${errorData.error}`);
            }

            const { publicUrl } = await beforeUploadResponse.json();
            beforeImageUrl = publicUrl;
            console.log(`[BulkUpload] ✓ Before image uploaded to Supabase: ${filename} at ${publicUrl}`);
          }

          if (positionPhotos.after) {
            const afterBase64 = await fileToBase64(positionPhotos.after.file);
            const fileExtension = positionPhotos.after.file.name.split('.').pop() || 'png';
            
            // Calculate image index from position and type
            const imageIndex = position * 2; // Position 1 after = img2, Position 2 after = img4, etc.
            const filename = `${caseSlug}_p${position}_img${imageIndex}.${fileExtension}`;
            
            console.log(`[BulkUpload] Uploading after image to Supabase Storage: ${filename}`);
            
            const afterUploadResponse = await fetch(`${serverUrl}/gallery/upload`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fileName: filename,
                fileData: afterBase64,
                galleryItemId: caseId,
                imageType: 'after'
              })
            });

            if (!afterUploadResponse.ok) {
              const errorData = await afterUploadResponse.json();
              throw new Error(`Failed to upload after image to Supabase: ${errorData.error}`);
            }

            const { publicUrl } = await afterUploadResponse.json();
            afterImageUrl = publicUrl;
            console.log(`[BulkUpload] ✓ After image uploaded to Supabase: ${filename} at ${publicUrl}`);
          }
          
          // ✅ CRITICAL: Register this orientation in the database WITH IMAGE URLS!
          console.log(`[BulkUpload] Registering orientation '${position}' for case ${caseId} with URLs...`);
          const orientationResponse = await fetch(`${serverUrl}/gallery/case/${caseId}/orientation`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orientationName: position.toString(),
              beforeImage: beforeImageUrl,
              afterImage: afterImageUrl
            })
          });
          
          if (!orientationResponse.ok) {
            const errorData = await orientationResponse.json();
            console.warn(`[BulkUpload] Failed to register orientation: ${errorData.error}`);
            // Don't throw - images are uploaded, this is just metadata
          } else {
            console.log(`[BulkUpload] ✓ Orientation '${position}' registered with images for case ${caseId}`);
          }
        }

        setCompletedCount(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      alert(`✅ Successfully uploaded ${casesToUpload} case(s) with ${totalPhotos} photo(s)!`);
      
      setPhotos([]);
      setCases([{ id: 'case_1', caseNumber: 1, category: 'Nose', title: '', procedure: '', journeyNote: '' }]);
      onSaved();
      onClose();
    } catch (error) {
      console.error('[BulkUpload] Error:', error);
      alert(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) {
      if (!confirm('Upload is in progress. Are you sure you want to cancel?')) {
        return;
      }
    }
    
    if (photos.length > 0 && !uploading) {
      if (!confirm('You have unsaved photos. Are you sure you want to close?')) {
        return;
      }
    }
    
    setPhotos([]);
    setCases([{ id: 'case_1', caseNumber: 1, category: 'Nose', title: '', procedure: '', journeyNote: '' }]);
    setCompletedCount(0);
    onClose();
  };

  const getPhotosForCase = (caseIndex: number) => {
    return photos.filter(p => p.caseIndex === caseIndex);
  };

  const untaggedCount = photos.filter(p => !p.type).length;
  const taggedCount = photos.filter(p => p.type).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-full w-full h-[96vh] max-h-[96vh] overflow-hidden flex flex-col p-0 gap-0">
        <div className="flex flex-col h-full bg-[#1a1f2e]">
          
          {/* Conditional Header - Only show when no photos */}
          {photos.length === 0 && (
            <div className="bg-gradient-to-r from-[#1a1f2e] to-[#242938] p-8 border-b border-[#2d3548]">
              <DialogTitle className="text-3xl text-[#c9b896] mb-2">Bulk Gallery Upload</DialogTitle>
              <DialogDescription className="text-lg text-gray-300">
                Upload multiple photos at once, then organize them in the table below
              </DialogDescription>
            </div>
          )}

          {/* Upload Section - Big when empty, small when photos loaded */}
          {photos.length === 0 ? (
            <div className="bg-gradient-to-r from-[#c9b896] to-[#b8976a] p-12 border-b-4 border-[#b8976a] flex items-center justify-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <div className="text-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-[#1a1f2e] text-[#faf9f7] hover:bg-[#242938] px-12 py-8 text-2xl rounded-xl shadow-2xl"
                >
                  <Upload className="w-7 h-7 mr-3" />
                  Select Photos to Upload
                </Button>
                <p className="text-[#1a1f2e] mt-4 text-base font-medium">
                  Max 15MB per photo
                </p>
              </div>
            </div>
          ) : null}

          {/* Photos Table */}
          {photos.length > 0 && (
            <div className="flex-1 overflow-y-auto p-8">
              {/* Organize Header with small upload button */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <h3 className="text-2xl font-bold text-[#c9b896]">
                    Organize Photos ({photos.length})
                  </h3>
                  <div className="flex items-center gap-4 text-base">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="font-bold text-green-400">{taggedCount}</span>
                      <span className="text-gray-400">tagged</span>
                    </div>
                    {untaggedCount > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <span className="font-bold text-yellow-400">{untaggedCount}</span>
                        <span className="text-gray-400">untagged</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    variant="outline"
                    className="bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] border-[#c9b896]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add More Photos
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Remove all ${photos.length} photos?`)) {
                        setPhotos([]);
                      }
                    }}
                    disabled={uploading}
                    className="text-red-400 hover:text-red-300 border-red-400/30 hover:bg-red-400/10"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Table Header */}
              <div className="bg-[#242938] border border-[#2d3548] rounded-t-xl">
                <div className="grid grid-cols-[120px_1fr_200px_200px_240px_80px] gap-6 p-4 text-sm font-bold text-[#c9b896] uppercase tracking-wider">
                  <div>Photo</div>
                  <div>Filename</div>
                  <div>Case</div>
                  <div>Position</div>
                  <div>Type</div>
                  <div></div>
                </div>
              </div>

              {/* Table Rows */}
              <div className="border-x border-b border-[#2d3548] rounded-b-xl divide-y divide-[#2d3548]">
                {photos
                  .sort((a, b) => {
                    // Sort by case first, then position, then type
                    if (a.caseIndex !== b.caseIndex) return (a.caseIndex ?? 0) - (b.caseIndex ?? 0);
                    if (a.positionNumber !== b.positionNumber) return a.positionNumber - b.positionNumber;
                    if (a.type === 'before' && b.type === 'after') return -1;
                    if (a.type === 'after' && b.type === 'before') return 1;
                    return 0;
                  })
                  .map((photo, index) => (
                  <div 
                    key={photo.id} 
                    className={`grid grid-cols-[120px_1fr_200px_200px_240px_80px] gap-6 p-4 items-center transition-colors ${
                      photo.type 
                        ? 'bg-[#242938] hover:bg-[#2d3548]' 
                        : 'bg-[#1a1f2e] hover:bg-[#242938] border-l-4 border-yellow-500/50'
                    }`}
                  >
                    {/* Photo Thumbnail */}
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#1a1f2e] shadow-lg relative">
                      <img 
                        src={photo.preview} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {photo.type && (
                        <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Filename */}
                    <div className="text-gray-300 text-sm truncate">
                      {photo.file.name}
                    </div>

                    {/* Case Selector */}
                    <Select
                      value={photo.caseIndex?.toString() ?? '0'}
                      onValueChange={(value) => updatePhoto(photo.id, { caseIndex: parseInt(value) })}
                      disabled={uploading}
                    >
                      <SelectTrigger className="h-11 text-base bg-[#1a1f2e] border-[#2d3548]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cases.map((c, idx) => (
                          <SelectItem key={c.id} value={idx.toString()}>
                            Case {c.caseNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Position Selector */}
                    <Select
                      value={photo.positionNumber.toString()}
                      onValueChange={(value) => updatePhoto(photo.id, { positionNumber: parseInt(value) })}
                      disabled={uploading}
                    >
                      <SelectTrigger className="h-11 text-base bg-[#1a1f2e] border-[#2d3548]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pos) => (
                          <SelectItem key={pos} value={pos.toString()}>
                            Position {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Before/After Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updatePhoto(photo.id, { type: 'before' })}
                        disabled={uploading}
                        className={`px-4 py-2.5 text-sm rounded-lg transition-all font-bold ${
                          photo.type === 'before'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#2d3548] border border-[#2d3548]'
                        }`}
                      >
                        Before
                      </button>
                      <button
                        onClick={() => updatePhoto(photo.id, { type: 'after' })}
                        disabled={uploading}
                        className={`px-4 py-2.5 text-sm rounded-lg transition-all font-bold ${
                          photo.type === 'after'
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#2d3548] border border-[#2d3548]'
                        }`}
                      >
                        After
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removePhoto(photo.id)}
                      disabled={uploading}
                      className="w-10 h-10 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cases Configuration */}
          {photos.length > 0 && (
            <div className="bg-[#242938] border-t-4 border-[#2d3548] p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#c9b896]">
                  Configure Cases ({cases.length})
                </h3>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={addCase}
                    disabled={uploading}
                    variant="outline"
                    className="bg-[#1a1f2e] text-[#c9b896] border-[#c9b896] hover:bg-[#c9b896] hover:text-[#1a1f2e]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Case
                  </Button>
                  <Button
                    onClick={handleBulkUpload}
                    disabled={uploading || photos.length === 0 || taggedCount === 0}
                    className="bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] text-base py-5 px-8 disabled:opacity-50 shadow-lg"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Upload {taggedCount > 0 ? `${taggedCount} Photo${taggedCount > 1 ? 's' : ''}` : 'All'}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Apply to All Categories Section */}
              <div className="mb-6 flex items-center gap-3 p-4 bg-[#1a1f2e] border border-[#2d3548] rounded-xl">
                <span className="text-base text-gray-300 font-medium">Apply to All Cases:</span>
                <Select
                  value={applyAllCategory}
                  onValueChange={setApplyAllCategory}
                  disabled={uploading}
                >
                  <SelectTrigger className="w-48 h-10 text-base bg-[#242938] border-[#2d3548]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={applyAllCategories}
                  disabled={uploading || cases.length === 0}
                  className="bg-blue-500 text-white hover:bg-blue-600 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Apply to All {cases.length} Case{cases.length > 1 ? 's' : ''}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cases.map((caseGroup, index) => {
                  const casePhotos = getPhotosForCase(index);
                  const taggedPhotos = casePhotos.filter(p => p.type);
                  
                  return (
                    <Card key={caseGroup.id} className="p-4 bg-[#1a1f2e] border-[#2d3548]">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-[#c9b896]">
                            Case {caseGroup.caseNumber}
                          </span>
                          {cases.length > 1 && (
                            <button
                              onClick={() => removeCase(caseGroup.id)}
                              disabled={uploading}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <Select
                          value={caseGroup.category}
                          onValueChange={(value) => updateCase(caseGroup.id, { category: value })}
                          disabled={uploading}
                        >
                          <SelectTrigger className="h-10 text-sm bg-[#242938] border-[#2d3548]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Title (optional)"
                          value={caseGroup.title}
                          onChange={(e) => updateCase(caseGroup.id, { title: e.target.value })}
                          disabled={uploading}
                          className="h-10 text-sm bg-[#242938] border-[#2d3548]"
                        />

                        <div className="text-sm text-gray-400 pt-2 border-t border-[#2d3548]">
                          {taggedPhotos.length} of {casePhotos.length} photos tagged
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-[#1a1f2e] border-t-4 border-[#c9b896] p-8">
            {uploading && (
              <div className="text-center text-lg text-[#c9b896] font-semibold mb-4">
                Uploading case {completedCount + 1}...
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
                className="flex-1 text-lg py-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}