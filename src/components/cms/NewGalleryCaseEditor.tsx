import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Plus } from 'lucide-react';
import { projectId } from '../../utils/supabase/info';

interface NewGalleryCaseEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  accessToken: string;
}

export function NewGalleryCaseEditor({
  isOpen,
  onClose,
  onSaved,
  accessToken
}: NewGalleryCaseEditorProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Nose',
    title: '',
    procedure: '',
    journeyNote: ''
  });

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;
  const categories = ['Nose', 'Face', 'Breast', 'Body'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('Please enter a case title');
      return;
    }

    setSaving(true);

    try {
      // Create new gallery case metadata
      const response = await fetch(`${serverUrl}/gallery/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: formData.category,
          title: formData.title,
          procedure: formData.procedure || formData.category,
          journeyNote: formData.journeyNote || 'Real patient transformation.'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create case');
      }

      const { id } = await response.json();

      alert(`✅ New case created successfully!\n\nCase ID: ${id}\n\nYou can now upload before/after images for this case.`);
      
      // Reset form
      setFormData({
        category: 'Nose',
        title: '',
        procedure: '',
        journeyNote: ''
      });
      
      onSaved();
      onClose();
    } catch (error) {
      console.error('[NewGalleryCaseEditor] Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create new case');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Gallery Case</DialogTitle>
          <DialogDescription>
            Create a new before & after case for the gallery. Fill in all details and upload images after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Case Title</Label>
            <Input
              id="title"
              placeholder="e.g., Rhinoplasty Case Study"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={saving}
            />
          </div>

          {/* Procedure */}
          <div className="space-y-2">
            <Label htmlFor="procedure">Procedure Name <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Input
              id="procedure"
              placeholder="e.g., Primary Rhinoplasty"
              value={formData.procedure}
              onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
              disabled={saving}
            />
          </div>

          {/* Patient Journey */}
          <div className="space-y-2">
            <Label htmlFor="journeyNote">Patient Journey Note <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Textarea
              id="journeyNote"
              placeholder="Write the patient's testimonial or journey note here..."
              value={formData.journeyNote}
              onChange={(e) => setFormData({ ...formData, journeyNote: e.target.value })}
              rows={6}
              disabled={saving}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This will be displayed in the lightbox when users view this case.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Case
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            After creating the case, you'll be able to upload before and after images from the gallery page.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}