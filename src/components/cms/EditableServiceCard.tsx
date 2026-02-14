import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEditMode } from '../../contexts/EditModeContext';
import { Button } from '../ui/button';
import { Edit2, ChevronDown } from 'lucide-react';
import { EditableImage } from './EditableImage';
import { ImageSelector } from './ImageSelector';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface EditableServiceCardProps {
  contentKey: string;
  defaultSrc: string;
  alt: string;
  title: string;
  description: string;
  procedures: string[];
  onNavigate: () => void;
  expanded?: boolean;
  onToggle?: () => void;
}

export function EditableServiceCard({
  contentKey,
  defaultSrc,
  alt,
  title,
  description,
  procedures,
  onNavigate,
  expanded,
  onToggle
}: EditableServiceCardProps) {
  const { isAdmin, accessToken } = useAuth();
  const { isEditMode } = useEditMode();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;
  const showEditControls = isAdmin && isEditMode;

  // Load the image URL
  React.useEffect(() => {
    const loadImage = async () => {
      try {
        const response = await fetch(`${serverUrl}/content/${contentKey}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        const data = await response.json();
        setImageUrl(data.content?.value || defaultSrc);
      } catch (error) {
        console.error('Error loading image:', error);
        setImageUrl(defaultSrc);
      }
    };
    loadImage();
  }, [contentKey, defaultSrc, serverUrl]);

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
      await fetch(`${serverUrl}/content/${contentKey}`, {
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

      // Update UI
      setImageUrl(publicUrl);
      localStorage.setItem(`img_${contentKey}`, publicUrl);
      localStorage.setItem(`focal_${contentKey}`, `${focal.x},${focal.y}`);
      setIsSelectorOpen(false);
    } catch (error) {
      console.error('Error saving image:', error);
      alert('Failed to save image. Please try again.');
    }
  };

  return (
    <>
      {/* External Edit Button - floats above everything */}
      {showEditControls && (
        <div className="absolute -top-3 right-2 z-50">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setIsSelectorOpen(true);
            }}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xl border-2 border-white text-xs px-3 py-1.5"
            size="sm"
          >
            <Edit2 className="w-3 h-3 mr-1.5" />
            <span>Edit Image</span>
          </Button>
        </div>
      )}

      {/* The Clickable Card */}
      <button 
        onClick={onNavigate}
        className="group block relative overflow-hidden rounded-2xl shadow-xl w-full"
      >
        {/* Image Container with proper aspect ratio - STRICT HEIGHT LIMIT */}
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <img 
            src={imageUrl || defaultSrc} 
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        
          {/* Diagonal gradient hover overlay with procedures - MUST MATCH IMAGE DIMENSIONS */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/95 via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
            <div className="absolute inset-0 flex items-end justify-end p-6 md:p-8 lg:p-10">
              <div className="text-right max-w-[75%] max-h-[80%] flex flex-col overflow-hidden">
                <h3 className="text-white mb-2 tracking-wide uppercase text-base md:text-lg font-bold flex-shrink-0 truncate">
                  {title}
                </h3>
                {/* Scrollable procedures list on mobile, fixed on desktop */}
                <div className="overflow-y-auto md:overflow-hidden space-y-1 scrollbar-thin scrollbar-thumb-secondary/50 scrollbar-track-transparent pr-2">
                  {procedures.map((procedure, index) => (
                    <p 
                      key={index}
                      className="text-white text-xs md:text-sm leading-snug"
                    >
                      {procedure}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Default overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent flex flex-col justify-end p-6 md:p-8 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none">
            <h3 className="text-lg md:text-xl font-serif text-white mb-1 truncate">{title}</h3>
            <p className="text-secondary text-xs truncate">{description}</p>
          </div>
        </div>
      </button>

      {/* Image Selector Dialog */}
      <ImageSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handleImageSelect}
        currentLocation={contentKey}
        locationLabel={`${title} Service Card`}
        cropAspectRatio={4/3}
      />
    </>
  );
}