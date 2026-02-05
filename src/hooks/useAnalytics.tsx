import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AnalyticsEvent {
  eventType: 'pageview' | 'click' | 'form_start' | 'form_complete' | 'form_abandon' | 'custom';
  page: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface SessionData {
  sessionId: string;
  startTime: string;
  lastActivity: string;
  pages: string[];
  events: AnalyticsEvent[];
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  userId?: string;
}

const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

export function useAnalytics(userId?: string) {
  const location = useLocation();
  const sessionIdRef = useRef<string | null>(null);
  const pageStartTimeRef = useRef<number>(Date.now());
  const isTrackingRef = useRef<boolean>(false);

  // Initialize session
  useEffect(() => {
    initializeSession();
  }, []);

  // Track page views
  useEffect(() => {
    if (sessionIdRef.current) {
      trackPageView();
      pageStartTimeRef.current = Date.now();
    }

    // Track time on page when leaving
    return () => {
      if (sessionIdRef.current) {
        const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
        trackEvent('custom', {
          action: 'time_on_page',
          duration: timeOnPage,
          page: location.pathname
        });
      }
    };
  }, [location.pathname]);

  // Update userId when it changes
  useEffect(() => {
    if (userId && sessionIdRef.current) {
      updateSessionUserId(userId);
    }
  }, [userId]);

  const initializeSession = () => {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('analytics_session_id');
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
      
      // Create new session in backend
      createSession(sessionId);
    }
    
    sessionIdRef.current = sessionId;
    isTrackingRef.current = true;
  };

  const createSession = async (sessionId: string) => {
    try {
      // Extract UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmParams = {
        utmSource: urlParams.get('utm_source') || undefined,
        utmMedium: urlParams.get('utm_medium') || undefined,
        utmCampaign: urlParams.get('utm_campaign') || undefined,
        utmTerm: urlParams.get('utm_term') || undefined,
        utmContent: urlParams.get('utm_content') || undefined,
      };

      const sessionData: SessionData = {
        sessionId,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        pages: [location.pathname],
        events: [],
        referrer: document.referrer || 'direct',
        ...utmParams,
        deviceType: getDeviceType(),
        browser: getBrowser(),
        userId
      };

      await fetch(`${serverUrl}/analytics/session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });
    } catch (error) {
      console.error('Error creating analytics session:', error);
    }
  };

  const updateSessionUserId = async (userId: string) => {
    if (!sessionIdRef.current) return;

    try {
      await fetch(`${serverUrl}/analytics/session/${sessionIdRef.current}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      console.error('Error updating session userId:', error);
    }
  };

  const trackPageView = async () => {
    if (!sessionIdRef.current) return;

    try {
      await fetch(`${serverUrl}/analytics/event`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType: 'pageview',
          page: location.pathname,
          timestamp: new Date().toISOString(),
          sessionId: sessionIdRef.current,
          userId,
          metadata: {
            title: document.title,
            search: location.search,
            hash: location.hash
          }
        })
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  const trackEvent = async (
    eventType: AnalyticsEvent['eventType'],
    metadata?: Record<string, any>
  ) => {
    if (!sessionIdRef.current) return;

    try {
      await fetch(`${serverUrl}/analytics/event`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType,
          page: location.pathname,
          timestamp: new Date().toISOString(),
          sessionId: sessionIdRef.current,
          userId,
          metadata
        })
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  const trackClick = (elementName: string, metadata?: Record<string, any>) => {
    trackEvent('click', { elementName, ...metadata });
  };

  const trackFormStart = (formName: string) => {
    trackEvent('form_start', { formName });
  };

  const trackFormComplete = (formName: string, metadata?: Record<string, any>) => {
    trackEvent('form_complete', { formName, ...metadata });
  };

  const trackFormAbandon = (formName: string, completionPercent: number) => {
    trackEvent('form_abandon', { formName, completionPercent });
  };

  const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const getBrowser = (): string => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  };

  return {
    trackEvent,
    trackClick,
    trackFormStart,
    trackFormComplete,
    trackFormAbandon,
    sessionId: sessionIdRef.current
  };
}