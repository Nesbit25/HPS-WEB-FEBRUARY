import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEditMode } from '../../contexts/EditModeContext';
import { Button } from '../ui/button';
import { Edit2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { ImageSelector } from './ImageSelector';
import { ImagePlaceholder } from './ImagePlaceholder';

interface EditableImageProps {
  contentKey: string;
  defaultSrc: string;
  alt: string;
  className?: string;
  locationLabel?: string;
  externalControls?: boolean; // Position edit button outside the image bounds
  cropOrientation?: 'landscape' | 'portrait' | 'square'; // Crop orientation for the image
  cropAspectRatio?: number; // Exact aspect ratio (width/height) for cropping
}

export function EditableImage({ 
  contentKey, 
  defaultSrc, 
  alt = '', 
  className = '', 
  locationLabel = 'this image',
  externalControls = false,
  cropOrientation = 'landscape',
  cropAspectRatio = 16/9
}: EditableImageProps) {
  const { isAdmin, accessToken } = useAuth();
  const { isEditMode } = useEditMode();
  const [isHovered, setIsHovered] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  
  // SIMPLIFIED: Just store the image URL directly - start with cached value for instant display
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    // Try to load from localStorage cache immediately
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`img_${contentKey}`);
      if (cached) {
        console.log(`[EditableImage] 🚀 Loaded from cache: ${contentKey}`);
        return cached;
      }
    }
    return null;
  });
  const [focalPoint, setFocalPoint] = useState(() => {
    // Also cache focal point
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`focal_${contentKey}`);
      if (cached) {
        const [x, y] = cached.split(',').map(parseFloat);
        return { x, y };
      }
    }
    return { x: 50, y: 50 };
  });
  const [loading, setLoading] = useState(true);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  // DEBUG: Log the auth state
  console.log('[EditableImage] Auth State:', { 
    contentKey, 
    isAdmin, 
    isEditMode,
    hasToken: !!accessToken 
  });

  // Fetch the stored image URL from content
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const fetchContent = async (retryCount = 0) => {
      const maxRetries = 3;
      
      try {
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        setLoading(true);
        
        console.log(`[EditableImage FETCH] Starting fetch for ${contentKey}`);
        
        // Get the stored image URL - use publicAnonKey for public endpoint access
        // Use AbortController properly with better timeout handling
        const controller = new AbortController();
        timeoutId = setTimeout(() => {
          console.warn(`[EditableImage FETCH] Request timeout for ${contentKey}`);
          controller.abort(new Error('Request timeout after 15 seconds'));
        }, 15000); // Increased to 15 seconds
        
        const response = await fetch(`${serverUrl}/content/${contentKey}`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          },
          signal: controller.signal
        }).catch(err => {
          // Clear timeout on error
          if (timeoutId) clearTimeout(timeoutId);
          
          // Handle abort errors gracefully
          if (err.name === 'AbortError') {
            console.warn(`[EditableImage FETCH] Request aborted for ${contentKey}`);
            throw new Error('Request timeout');
          }
          
          // Catch other network errors
          console.warn(`[EditableImage FETCH] Network error for ${contentKey}:`, err.message);
          throw err;
        });
        
        // Clear timeout after successful response
        if (timeoutId) clearTimeout(timeoutId);
        
        // Check if component is still mounted
        if (!isMounted) return;
        
        // Check if response is ok before parsing
        if (!response.ok) {
          console.warn(`[EditableImage FETCH] Server returned ${response.status} for ${contentKey}`);
          
          // Don't retry on 404 - just use default
          if (response.status === 404) {
            console.log(`[EditableImage FETCH] No content stored yet for ${contentKey}, using default`);
            setImageUrl(defaultSrc);
            localStorage.setItem(`img_${contentKey}`, defaultSrc);
            setLoading(false);
            return;
          }
          
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log(`[EditableImage FETCH] Response for ${contentKey}:`, data);
        
        // Retry on connection errors
        if (data.error && data.retryable && retryCount < maxRetries) {
          console.warn(`[EditableImage] Connection issue for ${contentKey}, retrying... (${retryCount + 1}/${maxRetries})`);
          const delay = 1000 * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchContent(retryCount + 1);
        }
        
        let finalUrl = defaultSrc;
        if (data.content?.value) {
          console.log(`[EditableImage FETCH] ✅ Loaded URL for ${contentKey}:`, data.content.value);
          finalUrl = data.content.value;
        } else {
          console.log(`[EditableImage FETCH] ⚠️ No URL stored for ${contentKey}, using default:`, defaultSrc);
        }
        
        // Update state and cache
        setImageUrl(finalUrl);
        localStorage.setItem(`img_${contentKey}`, finalUrl);
        
        // Get focal point if exists
        const focalResponse = await fetch(`${serverUrl}/content/${contentKey}_focal`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        const focalData = await focalResponse.json();
        
        console.log(`[EditableImage FETCH] Focal point response:`, focalData);
        
        if (focalData.content?.value) {
          const [x, y] = focalData.content.value.split(' ').map((v: string) => parseFloat(v));
          console.log(`[EditableImage FETCH] ✅ Loaded focal point:`, { x, y });
          setFocalPoint({ x, y });
          localStorage.setItem(`focal_${contentKey}`, `${x},${y}`);
        }
      } catch (error) {
        console.error('[EditableImage FETCH] ❌ Error loading content:', error);
        
        // Retry on network errors
        if (retryCount < maxRetries) {
          console.warn(`[EditableImage] Network error, retrying... (${retryCount + 1}/${maxRetries})`);
          const delay = 1000 * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchContent(retryCount + 1);
        }
        
        const fallback = defaultSrc;
        setImageUrl(fallback);
        localStorage.setItem(`img_${contentKey}`, fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    // Cleanup function to set isMounted to false when component unmounts
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [contentKey, serverUrl, defaultSrc, publicAnonKey]);

  // Handle image selection - SIMPLIFIED: Just save the URL
  const handleImageSelect = async (selectedPhotoId: string, publicUrl: string, focal: { x: number; y: number }) => {
    if (!accessToken) return;

    console.log('[EditableImage] Saving image URL:', {
      contentKey,
      url: publicUrl,
      focalPoint: focal
    });

    try {
      // STEP 1: Get the currently assigned photo for this location (if any)
      const currentResponse = await fetch(`${serverUrl}/content/${contentKey}`);
      let previousPhotoId: string | null = null;
      
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        // Check if there was a previously assigned photo
        if (currentData.content?.photoId) {
          previousPhotoId = currentData.content.photoId;
          console.log('[EditableImage] Found previously assigned photo:', previousPhotoId);
        }
      }

      // STEP 2: Publish the newly selected photo
      console.log('[EditableImage] Publishing selected photo:', selectedPhotoId);
      await fetch(`${serverUrl}/photos/${selectedPhotoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'published'
        })
      });

      // STEP 3: Unpublish the previous photo (if different from the new one)
      if (previousPhotoId && previousPhotoId !== selectedPhotoId) {
        console.log('[EditableImage] Unpublishing previous photo:', previousPhotoId);
        await fetch(`${serverUrl}/photos/${previousPhotoId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'unpublished'
          })
        });
      }

      // STEP 4: Save the public URL and photo ID to content
      console.log('[EditableImage SAVE] Saving content:', {
        contentKey,
        value: publicUrl,
        photoId: selectedPhotoId
      });
      
      const saveResponse = await fetch(`${serverUrl}/content/${contentKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: publicUrl,  // Save the URL for display
          photoId: selectedPhotoId  // Also save the photo ID for tracking
        })
      });

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error('[EditableImage SAVE] ❌ Save failed:', errorText);
        throw new Error(`Failed to save image URL: ${errorText}`);
      }
      
      const saveData = await saveResponse.json();
      console.log('[EditableImage SAVE] ✅ Save successful:', saveData);

      // STEP 5: Save focal point
      const focalKey = `${contentKey}_focal`;
      console.log('[EditableImage SAVE] Saving focal point:', {
        focalKey,
        value: `${focal.x}% ${focal.y}%`
      });
      
      await fetch(`${serverUrl}/content/${focalKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: `${focal.x}% ${focal.y}%`
        })
      });

      // Update UI immediately
      setImageUrl(publicUrl);
      setFocalPoint(focal);
      
      // Update localStorage cache
      localStorage.setItem(`img_${contentKey}`, publicUrl);
      localStorage.setItem(`focal_${contentKey}`, `${focal.x},${focal.y}`);
      
      setIsSelectorOpen(false);
      
      console.log('[EditableImage] Image saved successfully, publish status updated');
    } catch (error) {
      console.error('[EditableImage] Error saving:', error);
      alert('Failed to save image. Please try again.');
    }
  };

  const showEditControls = isAdmin && isEditMode;

  // DEBUG: Log render state
  console.log(`[EditableImage RENDER] ${contentKey}:`, {
    imageUrl,
    loading,
    showEditControls,
    hasImage: !!imageUrl
  });

  return (
    <>
      <div 
        className={`relative group ${showEditControls && !externalControls ? 'ring-2 ring-transparent hover:ring-secondary/20 ring-offset-2' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={alt} 
            className={`${className}`}
            style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
            onError={(e) => {
              console.error(`[EditableImage] Failed to load image: ${imageUrl}`);
              const img = e.target as HTMLImageElement;
              // Don't set to placeholder, just log the error
              img.style.opacity = '0.5';
            }}
          />
        ) : (
          <ImagePlaceholder
            className={className}
            alt={alt}
          />
        )}
        
        {/* Edit Badge - only show inside if NOT using external controls */}
        {showEditControls && !externalControls && (
          <div className="absolute top-2 right-2 z-50">
            <Button
              onClick={() => setIsSelectorOpen(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-secondary hover:bg-secondary/90 text-white shadow-xl border-2 border-white"
              size="sm"
            >
              <Edit2 className="w-3 h-3 mr-2" />
              <span>Edit</span>
            </Button>
          </div>
        )}

        {/* Hover Overlay for extra context */}
        {showEditControls && isHovered && !externalControls && (
          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none z-40 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
              {locationLabel}
            </div>
          </div>
        )}
      </div>

      {/* External Edit Button - rendered as sibling when externalControls is true */}
      {showEditControls && externalControls && (
        <div className="absolute -top-12 right-0 z-50">
          <Button
            onClick={() => setIsSelectorOpen(true)}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl border-2 border-white"
            size="sm"
          >
            <Edit2 className="w-3 h-3 mr-2" />
            <span>Edit {locationLabel}</span>
          </Button>
        </div>
      )}

      {/* Image Selector Dialog */}
      <ImageSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handleImageSelect}
        currentLocation={contentKey}
        locationLabel={locationLabel}
        cropOrientation={cropOrientation}
        cropAspectRatio={cropAspectRatio}
      />
    </>
  );
}