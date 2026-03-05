import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';

export interface BeforeAfterCardWithCardProps {
  beforeImage?: string;
  afterImage?: string;
  title: string;
  procedure: string;
  onClick?: () => void;
  interval?: number;
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

  useEffect(() => {
    if (!beforeImage || !afterImage) return;
    
    const timer = setInterval(() => {
      setShowBefore(prev => !prev);
    }, interval);

    return () => clearInterval(timer);
  }, [beforeImage, afterImage, interval]);

  return (
    <Card 
      className="border-[#2d3548] bg-[#242938]/50 backdrop-blur rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-[#c9b896]/10 transition-all duration-500 group"
      onClick={onClick}
    >
      <div className="aspect-[3/4] relative overflow-hidden flex items-center justify-center bg-[#1a1f2e]">
        {afterImage && (
          <img 
            src={afterImage} 
            alt="After" 
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${showBefore ? 'opacity-0' : 'opacity-100'}`} 
          />
        )}
        {beforeImage && (
          <img 
            src={beforeImage} 
            alt="Before" 
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${showBefore ? 'opacity-100' : 'opacity-0'}`} 
          />
        )}
        {!beforeImage && !afterImage ? (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#242938] to-[#1a1f2e] flex items-center justify-center">
            <span className="text-gray-500 text-sm">Loading...</span>
          </div>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <span className="text-white text-sm">
            {showBefore ? 'Before' : 'After'}
          </span>
        </div>
      </div>
      <CardContent className="p-4 bg-[#1a1f2e]">
        <h3 className="mb-2 text-[#faf9f7]">{title}</h3>
        <p className="text-sm text-gray-400 line-clamp-2">{procedure}</p>
      </CardContent>
    </Card>
  );
}
