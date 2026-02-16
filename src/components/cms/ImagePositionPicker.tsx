import React, { useState, useRef, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface ImagePositionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'desktop' | 'mobile';
  currentPosition?: string;
  onSave: (position: string) => void;
  accessToken?: string;
}

export function ImagePositionPicker({
  isOpen,
  onClose,
  type,
  currentPosition = 'center center',
  onSave,
  accessToken
}: ImagePositionPickerProps) {
  const [position, setPosition] = useState(currentPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const imagePath = type === 'desktop' 
    ? '/images/hero/desktop/hero-slide-1.jpg'
    : '/images/hero/mobile/hero-slide-1.jpg';

  // Parse position string to x,y percentages
  const parsePosition = (posStr: string): { x: number; y: number } => {
    const parts = posStr.split(' ');
    const xPart = parts[0] || 'center';
    const yPart = parts[1] || 'center';
    
    const x = xPart === 'center' ? 50 : xPart === 'left' ? 0 : xPart === 'right' ? 100 : parseFloat(xPart);
    const y = yPart === 'center' ? 50 : yPart === 'top' ? 0 : yPart === 'bottom' ? 100 : parseFloat(yPart);
    
    return { x, y };
  };

  // Convert x,y percentages to position string
  const formatPosition = (x: number, y: number): string => {
    return `${x}% ${y}%`;
  };

  const { x: initialX, y: initialY } = parsePosition(position);
  const [focal, setFocal] = useState({ x: initialX, y: initialY });

  useEffect(() => {
    const { x, y } = parsePosition(currentPosition);
    setFocal({ x, y });
    setPosition(currentPosition);
  }, [currentPosition]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    setFocal({ x, y });
    setPosition(formatPosition(Math.round(x), Math.round(y)));
  };

  const handleReset = () => {
    const defaultPos = type === 'desktop' ? 'center center' : 'center 30%';
    const { x, y } = parsePosition(defaultPos);
    setFocal({ x, y });
    setPosition(defaultPos);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const contentKey = type === 'desktop' ? 'hero_desktop_position' : 'hero_mobile_position';
      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;
      
      await fetch(`${serverUrl}/content/${contentKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || publicAnonKey}`
        },
        body: JSON.stringify({ value: position })
      });
      
      onSave(position);
      onClose();
    } catch (error) {
      console.error('Error saving position:', error);
      alert('Failed to save position. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
              Adjust {type === 'desktop' ? 'Desktop' : 'Mobile'} Hero Image
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Click and drag on the image to set the focal point
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preview Container */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Interactive Preview</h3>
              <div className="text-sm text-gray-600">
                Position: <code className="bg-gray-100 px-2 py-1 rounded">{position}</code>
              </div>
            </div>

            {/* Image Preview with Draggable Focal Point */}
            <div
              ref={containerRef}
              className="relative w-full rounded-xl overflow-hidden shadow-2xl cursor-crosshair select-none"
              style={{ 
                height: type === 'desktop' ? '500px' : '600px',
                aspectRatio: type === 'desktop' ? '16/9' : '9/16'
              }}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseUp}
            >
              {/* Hero Image */}
              <img
                src={imagePath}
                alt="Hero preview"
                className="w-full h-full object-cover pointer-events-none"
                style={{ objectPosition: position }}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.src.endsWith('.jpg')) {
                    img.src = img.src.replace('.jpg', '.png');
                  }
                }}
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent pointer-events-none" />

              {/* Sample Text Content */}
              <div className="absolute inset-0 flex items-center px-6 md:px-12 pointer-events-none">
                <div className="max-w-2xl">
                  <h2 className="text-secondary text-xs md:text-sm uppercase tracking-[0.3em] mb-3 font-bold">
                    Double Board Certified Plastic Surgeon
                  </h2>
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif text-white mb-4 leading-tight">
                    Revealing Beauty
                  </h1>
                  <p className="text-gray-200 text-sm md:text-base lg:text-lg font-light max-w-xl leading-relaxed">
                    Recognizing that each patient's goal is unique, Dr. Hanemann offers creative solutions
                  </p>
                </div>
              </div>

              {/* Focal Point Indicator */}
              <div
                className="absolute w-12 h-12 pointer-events-none"
                style={{
                  left: `${focal.x}%`,
                  top: `${focal.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-secondary shadow-lg"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-full bg-secondary shadow-lg"></div>
                </div>
                {/* Center dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-secondary rounded-full border-2 border-white shadow-lg"></div>
                </div>
              </div>

              {/* Grid Lines (subtle) */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-1/3 left-0 w-full h-px bg-white"></div>
                <div className="absolute top-2/3 left-0 w-full h-px bg-white"></div>
                <div className="absolute left-1/3 top-0 w-px h-full bg-white"></div>
                <div className="absolute left-2/3 top-0 w-px h-full bg-white"></div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">i</span>
                How to Use
              </h4>
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li>• <strong>Click and drag</strong> anywhere on the image to reposition it</li>
                <li>• The <strong className="text-secondary">crosshair</strong> shows where the image will be centered</li>
                <li>• Watch the preview text to ensure it doesn't cover important parts of the image</li>
                <li>• The gradient overlay will be darker on the left side (where text appears)</li>
                <li>• Try to keep the subject's face/eyes in a visible area</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Position'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
