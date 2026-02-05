import React from 'react';
import { Button } from './ui/button';
import { Phone } from 'lucide-react';
import { Card } from './ui/card';

interface CallToActionProps {
  variant?: 'default' | 'inline' | 'banner';
  onScheduleClick?: () => void;
  className?: string;
}

export function CallToAction({ variant = 'default', onScheduleClick, className = '' }: CallToActionProps) {
  const phoneNumber = '225-766-2166';
  const phoneHref = 'tel:+12257662166';

  if (variant === 'inline') {
    return (
      <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${className}`}>
        <Button
          size="lg"
          className="rounded-full px-10 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          onClick={onScheduleClick}
        >
          Schedule a Consultation
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">or call</span>
          <a 
            href={phoneHref}
            className="flex items-center gap-2 text-lg text-secondary hover:text-secondary/80 transition-colors group"
            onClick={() => {
              // Track click-to-call event
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'phone_call', {
                  event_category: 'engagement',
                  event_label: 'Click to Call'
                });
              }
            }}
          >
            <Phone className="w-5 h-5 group-hover:animate-pulse" />
            <span className="font-semibold">{phoneNumber}</span>
          </a>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <section className={`py-20 bg-gradient-to-br from-primary to-primary/80 ${className}`}>
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-card mb-6">Ready to Get Started?</h2>
          <p className="text-card/90 text-lg mb-10 max-w-2xl mx-auto">
            Schedule your private consultation with Dr. Hanemann to discuss your goals and explore your options.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full px-10 bg-card text-primary hover:bg-card/90 shadow-lg hover:shadow-xl transition-all"
              onClick={onScheduleClick}
            >
              Schedule a Consultation
            </Button>
            <a 
              href={phoneHref}
              className="flex items-center gap-2 text-lg text-card hover:text-card/80 transition-colors group px-6 py-3 rounded-full border-2 border-card/30 hover:border-card/60"
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'phone_call', {
                    event_category: 'engagement',
                    event_label: 'Click to Call - Banner'
                  });
                }
              }}
            >
              <Phone className="w-5 h-5 group-hover:animate-pulse" />
              <span className="font-semibold">{phoneNumber}</span>
            </a>
          </div>
        </div>
      </section>
    );
  }

  // Default variant - card style
  return (
    <Card className={`p-8 bg-gradient-to-br from-muted to-secondary/10 border-secondary/20 ${className}`}>
      <div className="text-center">
        <h3 className="mb-4">Schedule Your Consultation</h3>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Take the first step toward achieving your aesthetic goals. Contact us today to schedule your private consultation with Dr. Hanemann.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="rounded-full px-10 bg-secondary hover:bg-secondary/90"
            onClick={onScheduleClick}
          >
            Request Consultation
          </Button>
          <a 
            href={phoneHref}
            className="flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors group"
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'phone_call', {
                  event_category: 'engagement',
                  event_label: 'Click to Call - Card'
                });
              }
            }}
          >
            <Phone className="w-5 h-5 group-hover:animate-pulse" />
            <span className="font-semibold text-lg">{phoneNumber}</span>
          </a>
        </div>
      </div>
    </Card>
  );
}
