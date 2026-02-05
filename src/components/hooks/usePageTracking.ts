import { useEffect } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function usePageTracking(pageName: string) {
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;
        
        await fetch(`${serverUrl}/analytics/pageview`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ page: pageName })
        });
        
        console.log(`📊 Page view tracked: ${pageName}`);
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [pageName]);
}
