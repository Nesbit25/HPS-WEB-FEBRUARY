import React, { useState, useEffect, useRef } from 'react';
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
  externalControls?: boolean;
  cropOrientation?: 'landscape' | 'portrait' | 'square';
  cropAspectRatio?: number;
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
  
  // Store defaultSrc in a ref so the useEffect doesn't re-trigger when it changes
  const defaultSrcRef = useRef(defaultSrc);
  defaultSrcRef.current = defaultSrc;
  
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`img_${contentKey}`);
      if (cached) return cached;
    }
    return null;
  });
  
  const [focalPoint, setFocalPoint] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`focal_${contentKey}`);
      if (cached) {
        const [x, y] = cached.split(',').map(parseFloat);
        if (!isNaN(x) && !isNaN(y)) return { x, y };
      }
    }
    return { x: 50, y: 50 };
  });
  
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  // Fetch the stored image URL from content — only depends on contentKey
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchContent = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        
        const response = await fetch(`${serverUrl}/content/${contentKey}`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          },
          signal: controller.signal
        });
        
        if (!isMounted) return;
        
        if (!response.ok) {
          if (response.status === 404) {
            setImageUrl(defaultSrcRef.current);
            localStorage.setItem(`img_${contentKey}`, defaultSrcRef.current);
            setLoading(false);
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!isMounted) return;
        
        let finalUrl = defaultSrcRef.current;
        if (data.content?.value) {
          // Use the stored URL directly — no broken-URL detection/clearing
          finalUrl = data.content.value;
        }
        
        setImageUrl(finalUrl);
        localStorage.setItem(`img_${contentKey}`, finalUrl);
        
        // Get focal point if exists
        try {
          const focalResponse = await fetch(`${serverUrl}/content/${contentKey}_focal`, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            },
            signal: controller.signal
          });
          
          if (!isMounted) return;
          
          if (focalResponse.ok) {
            const focalData = await focalResponse.json();
            if (focalData.content?.value) {
              const [x, y] = focalData.content.value.split(' ').map((v: string) => parseFloat(v));
              if (!isNaN(x) && !isNaN(y)) {
                setFocalPoint({ x, y });
                localStorage.setItem(`focal_${contentKey}`, `${x},${y}`);
              }
            }
          }
        } catch {
          // Focal point fetch failed — not critical, ignore
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        console.error(`[EditableImage] Error loading ${contentKey}:`, error);
        
        // Fall back to default
        if (isMounted) {
          setImageUrl(defaultSrcRef.current);
          localStorage.setItem(`img_${contentKey}`, defaultSrcRef.current);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [contentKey, serverUrl]);

  // Handle image selection
  const handleImageSelect = async (selectedPhotoId: string, publicUrl: string, focal: { x: number; y: number }) => {
    if (!accessToken) return;

    try {
      // Get currently assigned photo
      const currentResponse = await fetch(`${serverUrl}/content/${contentKey}`);
      let previousPhotoId: string | null = null;
      
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        if (currentData.content?.photoId) {
          previousPhotoId = currentData.content.photoId;
        }
      }

      // Publish the newly selected photo
      await fetch(`${serverUrl}/photos/${selectedPhotoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'published' })
      });

      // Unpublish the previous photo if different
      if (previousPhotoId && previousPhotoId !== selectedPhotoId) {
        await fetch(`${serverUrl}/photos/${previousPhotoId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'unpublished' })
        });
      }

      // Save the URL and photo ID
      const saveResponse = await fetch(`${serverUrl}/content/${contentKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: publicUrl,
          photoId: selectedPhotoId
        })
      });

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        throw new Error(`Failed to save image URL: ${errorText}`);
      }

      // Save focal point
      await fetch(`${serverUrl}/content/${contentKey}_focal`, {
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
      setImgError(false);
      
      // Update localStorage cache
      localStorage.setItem(`img_${contentKey}`, publicUrl);
      localStorage.setItem(`focal_${contentKey}`, `${focal.x},${focal.y}`);
      
      setIsSelectorOpen(false);
    } catch (error) {
      console.error('[EditableImage] Error saving:', error);
      alert('Failed to save image. Please try again.');
    }
  };

  const showEditControls = isAdmin && isEditMode;
  const displayUrl = imageUrl || defaultSrc;

  return (
    <>
      <div 
        className={`relative group ${showEditControls && !externalControls ? 'ring-2 ring-transparent hover:ring-secondary/20 ring-offset-2' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Always render the image when we have a URL */}
        {displayUrl && !imgError ? (
          <img
            src={displayUrl}
            alt={alt}
            className={className}
            style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
            onError={() => {
              console.warn(`[EditableImage] Image load failed for ${contentKey}: ${displayUrl}`);
              setImgError(true);
            }}
            loading="lazy"
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
