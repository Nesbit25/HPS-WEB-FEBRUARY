import React from 'react';

/**
 * Loading skeleton for images
 * Provides a smooth placeholder while images load
 */
export function ImageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-[#242938] to-[#1a1f2e] ${className}`}>
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      
      {/* Subtle pulse */}
      <div className="absolute inset-0 bg-[#c9b896]/5 animate-pulse"></div>
    </div>
  );
}
