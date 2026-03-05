import React, { useState, useEffect, useRef } from 'react';

export interface BeforeAfterCardProps {
  beforeImage?: string;
  afterImage?: string;
  category?: string;
  title: string;
  onClick?: () => void;
  className?: string;
  interval?: number;
}

export function BeforeAfterCard({ 
  beforeImage, 
  afterImage, 
  category, 
  title, 
  onClick,
  className = '',
  interval = 3000 
}: BeforeAfterCardProps) {
  const [showBefore, setShowBefore] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.01
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!beforeImage || !afterImage || !beforeLoaded || !afterLoaded) return;
    
    const timer = setInterval(() => {
      setShowBefore(prev => !prev);
    }, interval);

    return () => clearInterval(timer);
  }, [beforeImage, afterImage, interval, beforeLoaded, afterLoaded]);

  const getOptimizedUrl = (url?: string, size: 'thumb' | 'full' = 'full') => {
    if (!url) return '';
    
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      const width = size === 'thumb' ? 50 : 800;
      const quality = size === 'thumb' ? 10 : 80;
      return `${url}?width=${width}&quality=${quality}&format=webp`;
    }
    
    return url;
  };

  const beforeThumbUrl = getOptimizedUrl(beforeImage, 'thumb');
  const afterThumbUrl = getOptimizedUrl(afterImage, 'thumb');
  const beforeFullUrl = getOptimizedUrl(beforeImage, 'full');
  const afterFullUrl = getOptimizedUrl(afterImage, 'full');

  return (
    <div 
      ref={cardRef}
      className={`group relative bg-[#242938]/50 rounded-2xl overflow-hidden cursor-pointer border border-[#2d3548] hover:shadow-lg hover:shadow-[#c9b896]/10 transition-all duration-500 ${className}`}
      onClick={onClick}
    >
      {/* Image area — portrait 3:4 ratio, centered like Gallery.tsx */}
      <div className="relative bg-[#1a1f2e] aspect-[3/4] flex items-center justify-center overflow-hidden">
        {isInView && afterImage && (
          <>
            <img 
              src={afterThumbUrl} 
              alt="" 
              className={`absolute inset-0 w-full h-full object-contain filter blur-xl scale-110 transition-opacity duration-500 ${afterLoaded ? 'opacity-0' : 'opacity-100'}`}
              aria-hidden="true"
            />
            <img 
              src={afterFullUrl} 
              alt="After" 
              loading="lazy"
              onLoad={() => setAfterLoaded(true)}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${showBefore ? 'opacity-0' : 'opacity-100'}`} 
            />
          </>
        )}
        {isInView && beforeImage && (
          <>
            <img 
              src={beforeThumbUrl} 
              alt="" 
              className={`absolute inset-0 w-full h-full object-contain filter blur-xl scale-110 transition-opacity duration-500 ${beforeLoaded ? 'opacity-0' : 'opacity-100'}`}
              aria-hidden="true"
            />
            <img 
              src={beforeFullUrl} 
              alt="Before" 
              loading="lazy"
              onLoad={() => setBeforeLoaded(true)}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${showBefore ? 'opacity-100' : 'opacity-0'}`} 
            />
          </>
        )}
        
        {!isInView && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#c9b896]/30 border-t-[#c9b896] rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 text-xs rounded-full backdrop-blur-sm border border-white/10">
          <span className={showBefore ? 'hidden' : 'text-[#c9b896]'}>After</span>
          <span className={showBefore ? 'text-[#c9b896]' : 'hidden'}>Before</span>
        </div>
        <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-2xl group-hover:border-[#c9b896]/30 transition-colors"></div>
      </div>

      {/* Card info */}
      <div className="p-4 bg-[#1a1f2e]">
        {category && (
          <div className="text-xs text-[#c9b896] uppercase tracking-wider mb-1">{category}</div>
        )}
        <h3 className="font-serif text-base text-[#faf9f7]">{title}</h3>
      </div>
    </div>
  );
}
