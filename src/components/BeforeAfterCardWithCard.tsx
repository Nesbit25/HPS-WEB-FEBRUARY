import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';

interface BeforeAfterCardWithCardProps {
  beforeImage?: string;
  afterImage?: string;
  title: string;
  procedure: string;
  onClick?: () => void;
  interval?: number; // milliseconds between transitions
}

export function BeforeAfterCardWithCard({ 
  beforeImage, 
  afterImage, 
  title, 
  procedure,
  onClick,
  interval = 3000 
}: BeforeAfterCardWithCardProps) {
  const [showBefore, setShowBefore] = useState(false);

  // Auto-cycle between before/after images
  useEffect(() => {
    if (!beforeImage || !afterImage) return;
    
    const timer = setInterval(() => {
      setShowBefore(prev => !prev);
    }, interval);

    return () => clearInterval(timer);
  }, [beforeImage, afterImage, interval]);

  return (
    <Card 
      className="border-border rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden">
        {afterImage && (
          <img 
            src={afterImage} 
            alt="After" 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${showBefore ? 'opacity-0' : 'opacity-100'}`} 
          />
        )}
        {beforeImage && (
          <img 
            src={beforeImage} 
            alt="Before" 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${showBefore ? 'opacity-100' : 'opacity-0'}`} 
          />
        )}
        {!beforeImage || !afterImage ? (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted to-secondary/20 flex items-center justify-center">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <span className="text-white text-sm">
            {showBefore ? 'Before' : 'After'}
          </span>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{procedure}</p>
      </CardContent>
    </Card>
  );
}
