import { useEffect } from 'react';

/**
 * Preloads images to improve perceived performance
 * Uses link rel="preload" for high-priority images
 */
export function useImagePreload(urls: string[], priority: 'high' | 'low' = 'low') {
  useEffect(() => {
    if (!urls || urls.length === 0) return;
    
    // For high-priority images, use link rel="preload"
    if (priority === 'high') {
      const links: HTMLLinkElement[] = [];
      
      urls.forEach(url => {
        if (!url) return;
        
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        
        // Add CORS for cross-origin images
        if (url.includes('supabase.co') || url.includes('githubusercontent.com')) {
          link.crossOrigin = 'anonymous';
        }
        
        document.head.appendChild(link);
        links.push(link);
      });
      
      // Cleanup
      return () => {
        links.forEach(link => {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        });
      };
    } else {
      // For low-priority, just preload in background
      urls.forEach(url => {
        if (!url) return;
        
        const img = new Image();
        img.src = url;
      });
    }
  }, [urls, priority]);
}

/**
 * Optimizes a Supabase URL with transformation parameters
 */
export function getOptimizedSupabaseUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'origin';
  } = {}
): string {
  if (!url) return url;
  
  // Only optimize Supabase storage URLs
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  
  const params = new URLSearchParams();
  
  if (options.width) {
    params.append('width', options.width.toString());
  }
  if (options.height) {
    params.append('height', options.height.toString());
  }
  if (options.quality) {
    params.append('quality', options.quality.toString());
  }
  if (options.format) {
    params.append('format', options.format);
  }
  
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}
