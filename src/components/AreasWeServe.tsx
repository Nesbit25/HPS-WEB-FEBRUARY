import React from 'react';
import { MapPin } from 'lucide-react';

export function AreasWeServe() {
  const areas = [
    'Baton Rouge',
    'Prairieville',
    'Gonzales',
    'Denham Springs',
    'Zachary',
    'Baker',
    'Central',
    'Walker',
    'Livingston Parish',
    'Ascension Parish',
    'East Baton Rouge Parish'
  ];

  return (
    <div className="py-16 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <MapPin className="w-6 h-6 text-secondary" />
            <h3>Areas We Serve</h3>
          </div>
          <p className="text-muted-foreground mb-8">
            Proudly serving patients throughout the Baton Rouge metropolitan area and surrounding Louisiana communities
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {areas.map(area => (
              <span 
                key={area}
                className="px-4 py-2 bg-card border border-border rounded-full text-sm text-foreground hover:border-secondary/50 transition-colors"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
