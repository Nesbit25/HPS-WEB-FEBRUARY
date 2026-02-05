import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ImagePlaceholderProps {
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

export function ImagePlaceholder({ className = '', style = {}, alt = 'No image selected' }: ImagePlaceholderProps) {
  return (
    <div 
      className={`bg-cream flex items-center justify-center ${className}`}
      style={style}
      aria-label={alt}
    >
      <div className="flex flex-col items-center justify-center text-muted-foreground/30 p-8">
        <ImageIcon className="w-12 h-12 mb-2" />
        <p className="text-sm">No image assigned</p>
      </div>
    </div>
  );
}
