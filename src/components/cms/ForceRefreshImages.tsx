import React from 'react';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function ForceRefreshImages() {
  const { isAdmin } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  if (!isAdmin) return null;

  const handleRefresh = () => {
    setRefreshing(true);
    // Force reload the page to refresh all images
    window.location.reload();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleRefresh}
        disabled={refreshing}
        className="rounded-full bg-secondary hover:bg-secondary/90 shadow-lg"
        size="lg"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing...' : 'Refresh All Images'}
      </Button>
    </div>
  );
}
