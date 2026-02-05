import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Star, Check } from 'lucide-react';
import { ImageLocationSelector } from './ImageLocationSelector';
import { projectId } from '../../utils/supabase/info';

interface PhotoEditDialogProps {
  photo: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  accessToken: string;
}

export function PhotoEditDialog({ photo, isOpen, onClose, onSave, accessToken }: PhotoEditDialogProps) {
  const [title, setTitle] = useState(photo?.title || '');
  const [caption, setCaption] = useState(photo?.caption || '');
  const [category, setCategory] = useState(photo?.category || 'facility');
  const [displayLocation, setDisplayLocation] = useState(photo?.displayLocation || 'hidden');
  const [status, setStatus] = useState(photo?.status || 'published');
  const [featured, setFeatured] = useState(photo?.featured || false);
  const [saving, setSaving] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  // Reset form when photo changes
  React.useEffect(() => {
    if (photo) {
      setTitle(photo.title || '');
      setCaption(photo.caption || '');
      setCategory(photo.category || 'facility');
      setDisplayLocation(photo.displayLocation || 'hidden');
      setStatus(photo.status || 'published');
      setFeatured(photo.featured || false);
    }
  }, [photo]);

  const handleSave = async () => {
    if (!photo || !accessToken) return;

    try {
      setSaving(true);

      const response = await fetch(`${serverUrl}/photos/${photo.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          caption,
          category,
          displayLocation,
          status,
          featured
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update photo');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating photo:', error);
      alert('Failed to update photo');
    } finally {
      setSaving(false);
    }
  };

  if (!photo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Photo</DialogTitle>
          <DialogDescription>
            Edit photo details, crop, and adjust the focal point for optimal display.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Preview */}
          <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-border">
            <img 
              src={photo.publicUrl} 
              alt={photo.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Photo Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl"
                placeholder="e.g., Rhinoplasty Result"
              />
            </div>

            <ImageLocationSelector
              value={displayLocation}
              onChange={setDisplayLocation}
            />

            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl" id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nose">Nose</SelectItem>
                  <SelectItem value="face">Face</SelectItem>
                  <SelectItem value="breast">Breast</SelectItem>
                  <SelectItem value="body">Body</SelectItem>
                  <SelectItem value="facility">Facility</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-status">Visibility Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl" id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published (Visible)</SelectItem>
                  <SelectItem value="draft">Draft (Hidden)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Control if photo is visible on the website
              </p>
            </div>

            <div className="flex items-center space-x-2 p-4 rounded-lg border border-secondary/20 bg-secondary/5">
              <Checkbox
                id="edit-featured"
                checked={featured}
                onCheckedChange={(checked) => setFeatured(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="edit-featured" className="cursor-pointer flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Mark as Featured
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Featured photos appear in before/after sections
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-caption">Caption / Description</Label>
              <Textarea
                id="edit-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="rounded-xl"
                rows={3}
                placeholder="Add details about the procedure, timing, etc..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-full"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="rounded-full bg-secondary hover:bg-secondary/90"
              disabled={saving}
            >
              <Check className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
