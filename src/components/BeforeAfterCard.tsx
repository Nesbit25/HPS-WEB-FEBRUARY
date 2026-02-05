import React, { useState, useEffect, useRef } from 'react';

interface BeforeAfterCardProps {
  beforeImage?: string;
  afterImage?: string;
  category?: string;
  title: string;
  onClick?: () => void;
  className?: string;
  interval?: number; // milliseconds between transitions
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

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect(); // Stop observing once loaded
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-cycle between before/after images
  useEffect(() => {
    if (!beforeImage || !afterImage || !beforeLoaded || !afterLoaded) return;
    
    const timer = setInterval(() => {
      setShowBefore(prev => !prev);
    }, interval);

    return () => clearInterval(timer);
  }, [beforeImage, afterImage, interval, beforeLoaded, afterLoaded]);

  // Generate optimized image URLs with Supabase transformation
  const getOptimizedUrl = (url?: string, size: 'thumb' | 'full' = 'full') => {
    if (!url) return '';
    
    // Check if it's a Supabase storage URL
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      const width = size === 'thumb' ? 50 : 800; // Thumbnail vs display size
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
      className={`group relative bg-white/5 rounded-xl overflow-hidden cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="aspect-square relative bg-[#1a1f2e]">
        {isInView && afterImage && (
          <>
            {/* Blur placeholder */}
            <img 
              src={afterThumbUrl} 
              alt="" 
              className={`absolute inset-0 w-full h-full object-cover filter blur-xl scale-110 transition-opacity duration-500 ${afterLoaded ? 'opacity-0' : 'opacity-100'}`}
              aria-hidden="true"
            />
            {/* Full resolution image */}
            <img 
              src={afterFullUrl} 
              alt="After" 
              loading="lazy"
              onLoad={() => setAfterLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${showBefore ? 'opacity-0' : 'opacity-100'}`} 
            />
          </>
        )}
        {isInView && beforeImage && (
          <>
            {/* Blur placeholder */}
            <img 
              src={beforeThumbUrl} 
              alt="" 
              className={`absolute inset-0 w-full h-full object-cover filter blur-xl scale-110 transition-opacity duration-500 ${beforeLoaded ? 'opacity-0' : 'opacity-100'}`}
              aria-hidden="true"
            />
            {/* Full resolution image */}
            <img 
              src={beforeFullUrl} 
              alt="Before" 
              loading="lazy"
              onLoad={() => setBeforeLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${showBefore ? 'opacity-100' : 'opacity-0'}`} 
            />
          </>
        )}
        
        {/* Loading state */}
        {!isInView && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 text-xs rounded-full backdrop-blur-sm">
          <span className={showBefore ? 'hidden' : ''}>After</span>
          <span className={showBefore ? '' : 'hidden'}>Before</span>
        </div>
        <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-xl group-hover:border-secondary/50 transition-colors"></div>
      </div>
      <div className="p-6">
        {category && (
          <div className="text-xs text-secondary uppercase tracking-wider mb-1">{category}</div>
        )}
        <h3 className="font-serif text-xl">{title}</h3>
      </div>
    </div>
  );
}