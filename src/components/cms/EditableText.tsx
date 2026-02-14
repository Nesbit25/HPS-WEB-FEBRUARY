import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEditMode } from '../../contexts/EditModeContext';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Edit2, Save, X, History, RotateCcw } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';

interface EditableTextProps {
  contentKey: string;
  defaultValue: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  className?: string;
  multiline?: boolean;
}

export function EditableText({ 
  contentKey, 
  defaultValue, 
  as: Component = 'p',
  className = '',
  multiline = false
}: EditableTextProps) {
  const { isAdmin, accessToken } = useAuth();
  const { isEditMode } = useEditMode();
  const [content, setContent] = useState(defaultValue);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [revisions, setRevisions] = useState<Array<{ timestamp: number; value: string; date: string }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  useEffect(() => {
    fetchContent();
  }, [contentKey]);

  const fetchContent = async (retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      // Public GET requests need Bearer token with anon key
      const response = await fetch(`${serverUrl}/content/${contentKey}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch content for ${contentKey}:`, response.status);
        setContent(defaultValue);
        setEditValue(defaultValue);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      // Check if there was a backend error but returned 200
      if (data.error && data.retryable && retryCount < maxRetries) {
        console.warn(`Connection issue for ${contentKey}, retrying... (${retryCount + 1}/${maxRetries})`);
        const delay = 1000 * Math.pow(2, retryCount); // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchContent(retryCount + 1);
      }
      
      if (data.content && data.content.value) {
        setContent(data.content.value);
        setEditValue(data.content.value);
      } else {
        setContent(defaultValue);
        setEditValue(defaultValue);
      }
    } catch (error) {
      console.error(`Error fetching content for ${contentKey}:`, error);
      
      // Retry on network errors
      if (retryCount < maxRetries) {
        console.warn(`Network error, retrying... (${retryCount + 1}/${maxRetries})`);
        const delay = 1000 * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchContent(retryCount + 1);
      }
      
      setContent(defaultValue);
      setEditValue(defaultValue);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${serverUrl}/content/${contentKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: editValue })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error saving content - Server responded with:', response.status, result);
        alert(`Failed to save: ${result.error || 'Unknown error'}`);
        return;
      }

      console.log('Content saved successfully:', result);
      setContent(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving content:', error);
      alert(`Failed to save: ${error}`);
    }
  };

  const fetchHistory = async () => {
    if (!accessToken) return;

    setLoadingHistory(true);
    try {
      const response = await fetch(`${serverUrl}/content/${contentKey}/history`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error fetching history - Server responded with:', response.status, result);
        alert(`Failed to fetch history: ${result.error || 'Unknown error'}`);
        return;
      }

      console.log('History fetched successfully:', result);
      setRevisions(result.revisions || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      alert(`Failed to fetch history: ${error}`);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRevertToRevision = async (revision: { timestamp: number; value: any }) => {
    if (!accessToken || !confirm('Are you sure you want to revert to this version?')) return;

    try {
      const response = await fetch(`${serverUrl}/content/${contentKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: revision.value.value })
      });

      const result = await response.json(); 
      
      if (!response.ok) {
        console.error('Error reverting content:', response.status, result);
        alert(`Failed to revert: ${result.error || 'Unknown error'}`);
        return;
      }

      console.log('Content reverted successfully');
      setContent(revision.value.value);
      setEditValue(revision.value.value);
      setShowHistory(false);
    } catch (error) {
      console.error('Error reverting content:', error);
      alert(`Failed to revert: ${error}`);
    }
  };

  if (loading) {
    return <Component className={className}>{defaultValue}</Component>;
  }

  // If not in edit mode or not admin, render inline without wrapper div
  if (!isAdmin || !isEditMode) {
    return <Component className={className}>{content}</Component>;
  }

  return (
    <span className="relative group inline-block">
      <Component className={className}>{content}</Component>
      
      {isAdmin && isEditMode && (
        <>
          <Button
            size="sm"
            variant="ghost"
            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary text-white hover:bg-secondary/90 hover:text-white rounded-full w-8 h-8 p-0"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>

          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Edit Content</DialogTitle>
                <DialogDescription>
                  Update the text content for this element.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {multiline ? (
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="rounded-xl min-h-[150px]"
                    rows={8}
                  />
                ) : (
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="rounded-xl"
                    rows={3}
                  />
                )}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditValue(content);
                      setIsEditing(false);
                    }}
                    className="rounded-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="rounded-full bg-secondary hover:bg-secondary/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            variant="ghost"
            className="absolute -top-2 -right-12 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary text-white hover:bg-secondary/90 hover:text-white rounded-full w-8 h-8 p-0"
            onClick={() => {
              setShowHistory(true);
              fetchHistory();
            }}
          >
            <History className="w-4 h-4" />
          </Button>

          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogContent className="rounded-2xl max-w-2xl">
              <DialogHeader>
                <DialogTitle>Content History</DialogTitle>
                <DialogDescription>
                  View and restore previous versions of this content.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {loadingHistory ? (
                  <div className="text-center py-8 text-muted-foreground">Loading history...</div>
                ) : revisions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No history available</div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {revisions.map((rev) => (
                        <Card key={rev.timestamp} className="p-4 rounded-xl">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-1">
                              <div className="text-xs text-muted-foreground">
                                {new Date(rev.timestamp).toLocaleString()}
                              </div>
                              <div className="text-sm bg-muted p-3 rounded-lg">
                                {rev.value.value || rev.value}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevertToRevision(rev)}
                              className="rounded-full"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
                <div className="flex gap-2 justify-end border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowHistory(false)}
                    className="rounded-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </span>
  );
}