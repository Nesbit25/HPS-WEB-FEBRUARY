import React, { useRef } from 'react';

export interface BeforeAfterCardProps {
  beforeImage?: string;
  afterImage?: string;
  category?: string;
  title: string;
  onClick?: () => void;
  className?: string;
  interval?: number;
  imagePosition?: string;
  objectFit?: 'cover' | 'contain';
  /** 'side-by-side' (default) or 'stacked' — stacked shows full images top/bottom */
  layout?: 'side-by-side' | 'stacked';
}

export function BeforeAfterCard({
  beforeImage,
  afterImage,
  category,
  title,
  onClick,
  className = '',
  interval = 3000,
  imagePosition = 'center',
  objectFit = 'cover',
  layout = 'side-by-side',
}: BeforeAfterCardProps) {
  // Note: a previous IntersectionObserver-based lazy render was removed
  // because it left images stuck in the loading spinner on certain iOS
  // Safari versions (iPhone 12 in particular). The native loading="lazy"
  // attribute on the <img> elements below already defers off-screen image
  // loading, so the JS gate was redundant.
  const cardRef = useRef<HTMLDivElement>(null);

  const getOptimizedUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      return `${url}?width=800&quality=80&format=webp`;
    }
    return url;
  };

  const beforeFullUrl = getOptimizedUrl(beforeImage);
  const afterFullUrl = getOptimizedUrl(afterImage);

  const isStacked = layout === 'stacked';

  return (
    <div
      ref={cardRef}
      className={`group relative bg-[#242938]/50 rounded-2xl overflow-hidden cursor-pointer border border-[#2d3548] hover:shadow-lg hover:shadow-[#c9b896]/10 transition-all duration-500 ${className}`}
      onClick={onClick}
    >
      {/* ── Side-by-side layout ── */}
      {!isStacked && (
        <>
          <div className="relative bg-[#1a1f2e] aspect-[2/1] flex overflow-hidden">
            {/* Before — left */}
            <div className="w-1/2 relative overflow-hidden flex items-center justify-center bg-[#1a1f2e]">
              {beforeImage ? (
                <img
                  src={beforeFullUrl}
                  alt="Before"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full"
                  style={{ objectFit, objectPosition: imagePosition }}
                />
              ) : (
                <span className="text-xs text-[#c9b896]/40">No image</span>
              )}
            </div>
            <div className="w-px bg-[#2d3548] flex-shrink-0 z-10" />
            {/* After — right */}
            <div className="w-1/2 relative overflow-hidden flex items-center justify-center bg-[#1a1f2e]">
              {afterImage ? (
                <img
                  src={afterFullUrl}
                  alt="After"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full"
                  style={{ objectFit, objectPosition: imagePosition }}
                />
              ) : (
                <span className="text-xs text-[#c9b896]/40">No image</span>
              )}
            </div>
            <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-2xl group-hover:border-[#c9b896]/30 transition-colors" />
          </div>
          {/* Before/After labels — below photos in navy strip */}
          <div className="flex bg-[#1a1f2e] border-t border-[#2d3548]">
            <div className="w-1/2 flex justify-center py-2">
              <span className="bg-black/60 backdrop-blur-sm px-3 py-0.5 text-[10px] text-[#c9b896] rounded-full border border-white/10">Before</span>
            </div>
            <div className="w-px bg-[#2d3548] flex-shrink-0" />
            <div className="w-1/2 flex justify-center py-2">
              <span className="bg-black/60 backdrop-blur-sm px-3 py-0.5 text-[10px] text-[#c9b896] rounded-full border border-white/10">After</span>
            </div>
          </div>
        </>
      )}

      {/* ── Stacked layout — full image, auto height ── */}
      {isStacked && (
        <div className="relative bg-[#1a1f2e] flex flex-col overflow-hidden">
          {/* Before — top, natural height */}
          <div className="relative w-full bg-[#1a1f2e]">
            {beforeImage ? (
              <img
                src={beforeFullUrl}
                alt="Before"
                loading="lazy"
                decoding="async"
                className="w-full block"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="h-32 flex items-center justify-center">
                <span className="text-xs text-[#c9b896]/40">No image</span>
              </div>
            )}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] text-[#c9b896] rounded-full border border-white/10">Before</span>
            </div>
          </div>
          {/* Horizontal divider */}
          <div className="h-px w-full bg-[#2d3548]" />
          {/* After — bottom, natural height */}
          <div className="relative w-full bg-[#1a1f2e]">
            {afterImage ? (
              <img
                src={afterFullUrl}
                alt="After"
                loading="lazy"
                decoding="async"
                className="w-full block"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="h-32 flex items-center justify-center">
                <span className="text-xs text-[#c9b896]/40">No image</span>
              </div>
            )}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] text-[#c9b896] rounded-full border border-white/10">After</span>
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-2xl group-hover:border-[#c9b896]/30 transition-colors" />
        </div>
      )}

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
