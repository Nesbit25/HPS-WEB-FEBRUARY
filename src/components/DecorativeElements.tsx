import React from 'react';

// Elegant section divider with centered decorative element
export function SectionDivider({ variant = 'default' }: { variant?: 'default' | 'gold' }) {
  return (
    <div className="flex items-center justify-center my-12">
      <div className={`h-px flex-1 max-w-xs ${variant === 'gold' ? 'bg-gradient-to-r from-transparent via-secondary to-transparent' : 'bg-gradient-to-r from-transparent via-border to-transparent'}`}></div>
      <div className="mx-6">
        <div className={`w-2 h-2 rounded-full ${variant === 'gold' ? 'bg-secondary' : 'bg-border'}`}></div>
      </div>
      <div className={`h-px flex-1 max-w-xs ${variant === 'gold' ? 'bg-gradient-to-r from-secondary via-transparent to-transparent' : 'bg-gradient-to-r from-border via-transparent to-transparent'}`}></div>
    </div>
  );
}

// Corner flourish decoration
export function CornerFlourish({ position = 'top-left' }: { position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0 rotate-90',
    'bottom-left': 'bottom-0 left-0 -rotate-90',
    'bottom-right': 'bottom-0 right-0 rotate-180'
  };

  return (
    <div className={`absolute ${positionClasses[position]} w-16 h-16 pointer-events-none opacity-30`}>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0 L20 0 M0 0 L0 20" stroke="currentColor" strokeWidth="1" className="text-secondary" />
        <path d="M4 4 L12 4 M4 4 L4 12" stroke="currentColor" strokeWidth="0.5" className="text-secondary" />
      </svg>
    </div>
  );
}

// Geometric pattern background
export function GeometricPattern({ opacity = 0.03 }: { opacity?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="geometric-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="1" fill="currentColor" className="text-secondary" />
            <circle cx="0" cy="0" r="1" fill="currentColor" className="text-secondary" />
            <circle cx="100" cy="0" r="1" fill="currentColor" className="text-secondary" />
            <circle cx="0" cy="100" r="1" fill="currentColor" className="text-secondary" />
            <circle cx="100" cy="100" r="1" fill="currentColor" className="text-secondary" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geometric-pattern)" />
      </svg>
    </div>
  );
}

// Premium badge for accreditations
export function PremiumBadge({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl transform rotate-3 transition-transform group-hover:rotate-6"></div>
      <div className="relative bg-card border-2 border-secondary/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all group-hover:border-secondary/50 group-hover:shadow-lg">
        {icon && <div className="text-secondary">{icon}</div>}
        <div className="text-center">{children}</div>
      </div>
    </div>
  );
}

// Decorative accent line
export function AccentLine({ orientation = 'horizontal', className = '' }: { orientation?: 'horizontal' | 'vertical'; className?: string }) {
  if (orientation === 'vertical') {
    return (
      <div className={`w-px h-full bg-gradient-to-b from-transparent via-secondary to-transparent ${className}`}></div>
    );
  }
  return (
    <div className={`h-px w-full bg-gradient-to-r from-transparent via-secondary to-transparent ${className}`}></div>
  );
}

// Subtle corner accent
export function CornerAccent() {
  return (
    <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none">
      <div className="absolute top-0 right-0 w-full h-full border-t-2 border-r-2 border-secondary/20 rounded-tr-3xl"></div>
      <div className="absolute top-2 right-2 w-20 h-20 border-t border-r border-secondary/10 rounded-tr-2xl"></div>
    </div>
  );
}

// Gold circle accent
export function CircleAccent({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  return (
    <div className={`${sizes[size]} rounded-full bg-secondary/30 ${className}`}></div>
  );
}
