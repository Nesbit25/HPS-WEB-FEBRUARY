import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Plus, Upload, X } from 'lucide-react';
import { projectId } from '../../utils/supabase/info';

interface ProcedureOption {
  value: string; // canonical name stored on the case (e.g. "Breast Lift")
  label: string; // public display (e.g. "Breast Lift (Mastopexy)")
}

interface NewGalleryCaseEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  accessToken: string;
  /** Pre-select these from the page the admin is currently viewing. */
  initialCategory?: string;
  initialProcedure?: string;
  /** Canonical procedure list per category, value+label. Drives the dropdown
      so a new case gets the same procedure name as the page it's added on. */
  proceduresByCategory?: Record<string, ProcedureOption[]>;
}

type Side = 'before' | 'after';

interface PhotoSlot {
  file: File | null;
  preview: string | null;
}

export function NewGalleryCaseEditor({
  isOpen,
  onClose,
  onSaved,
  accessToken,
  initialCategory,
  initialProcedure,
  proceduresByCategory = {},
}: NewGalleryCaseEditorProps) {
  const categories = ['Nose', 'Face', 'Breast', 'Body'];
  const defaultCategory = initialCategory && categories.includes(initialCategory)
    ? initialCategory
    : 'Nose';
  // Procedure options for a given category (empty list if the category has none
  // configured — falls back to a freeform "use category name" behavior).
  const procOptionsFor = (cat: string): ProcedureOption[] => proceduresByCategory[cat] || [];
  const defaultProcedureFor = (cat: string, preferred?: string): string => {
    const opts = procOptionsFor(cat);
    if (preferred && opts.some(o => o.value === preferred)) return preferred;
    return opts[0]?.value || '';
  };

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: defaultCategory,
    title: '',
    procedure: defaultProcedureFor(defaultCategory, initialProcedure),
    journeyNote: '',
  });
  const [beforePhoto, setBeforePhoto] = useState<PhotoSlot>({ file: null, preview: null });
  const [afterPhoto, setAfterPhoto] = useState<PhotoSlot>({ file: null, preview: null });

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  // When the dialog (re)opens, sync the defaults to the current page context.
  useEffect(() => {
    if (isOpen) {
      const cat = initialCategory && categories.includes(initialCategory) ? initialCategory : 'Nose';
      setFormData({
        category: cat,
        title: '',
        procedure: defaultProcedureFor(cat, initialProcedure),
        journeyNote: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialCategory, initialProcedure]);

  const currentProcedureOptions = procOptionsFor(formData.category);
  const currentProcedureLabel =
    currentProcedureOptions.find(o => o.value === formData.procedure)?.label ||
    formData.procedure ||
    formData.category;

  const handleCategoryChange = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      category: cat,
      // Reset procedure to the first option of the new category.
      procedure: defaultProcedureFor(cat),
    }));
  };

  const resetState = () => {
    setSaving(false);
    setStatusMessage(null);
    const cat = initialCategory && categories.includes(initialCategory) ? initialCategory : 'Nose';
    setFormData({
      category: cat,
      title: '',
      procedure: defaultProcedureFor(cat, initialProcedure),
      journeyNote: '',
    });
    setBeforePhoto({ file: null, preview: null });
    setAfterPhoto({ file: null, preview: null });
  };

  const handleClose = () => {
    if (saving) return; // don't allow close mid-upload
    resetState();
    onClose();
  };

  const handlePhotoSelect = (side: Side, file: File | null) => {
    const setter = side === 'before' ? setBeforePhoto : setAfterPhoto;
    if (!file) {
      setter({ file: null, preview: null });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setter({ file, preview: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = (reader.result as string).split(',')[1];
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadOnePhoto = async (caseId: number, side: Side, file: File) => {
    const base64Data = await fileToBase64(file);
    const fileName = `${side}_${caseId}_${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;

    const uploadRes = await fetch(`${serverUrl}/gallery/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        fileData: base64Data,
        galleryItemId: caseId,
        imageType: side,
      }),
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.error || `Failed to upload ${side} photo (${uploadRes.status}).`);
    }
    const { publicUrl } = await uploadRes.json();

    // Assign the URL to the case's primary view (orientation index 0) via the
    // canonical endpoint the gallery actually reads from. The old code PUT to
    // a /content/gallery_<id>_<side> key that nothing rendered, so newly
    // created cases came up with no photos.
    const saveRes = await fetch(`${serverUrl}/gallery/case/${caseId}/image`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageType: side, orientationIndex: 0, url: publicUrl }),
    });
    if (!saveRes.ok) {
      const errText = await saveRes.text();
      throw new Error(`Photo uploaded but URL save failed: ${errText}`);
    }
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!beforePhoto.file) {
      alert('Please choose a "Before" photo.');
      return;
    }
    if (!afterPhoto.file) {
      alert('Please choose an "After" photo.');
      return;
    }

    setSaving(true);
    setStatusMessage('Creating case…');

    try {
      // Canonical procedure name (e.g. "Breast Lift") drives the card label
      // via getProcedureDisplayLabel → "Breast Lift (Mastopexy)" and ensures
      // the case appears on the matching procedure page.
      const procedure = formData.procedure.trim() || formData.category;
      // Title is optional now — default to the procedure's public display
      // label so the lightbox heading reads sensibly.
      const title = formData.title.trim() || currentProcedureLabel;

      // 1. Create the case metadata
      const createRes = await fetch(`${serverUrl}/gallery/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: formData.category,
          title,
          procedure,
          journeyNote: formData.journeyNote.trim() || 'Real patient transformation.',
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create case');
      }
      const { id } = await createRes.json();
      if (!id) throw new Error('Server did not return a new case ID.');

      // 2. Upload Before photo
      setStatusMessage('Uploading "Before" photo…');
      await uploadOnePhoto(id, 'before', beforePhoto.file);

      // 3. Upload After photo
      setStatusMessage('Uploading "After" photo…');
      await uploadOnePhoto(id, 'after', afterPhoto.file);

      setStatusMessage('Done!');
      alert(`✅ New case created with before/after photos.\n\nCase ID: ${id}`);
      resetState();
      onSaved();
      onClose();
    } catch (error: any) {
      console.error('[NewGalleryCaseEditor] Error:', error);
      alert(error?.message || 'Failed to create new case.');
      setSaving(false);
      setStatusMessage(null);
    }
  };

  const renderPhotoPicker = (side: Side) => {
    const photo = side === 'before' ? beforePhoto : afterPhoto;
    const inputRef = side === 'before' ? beforeInputRef : afterInputRef;
    const label = side === 'before' ? 'Before Photo' : 'After Photo';

    return (
      <div className="space-y-2">
        <Label>
          {label} <span className="text-red-500">*</span>
        </Label>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePhotoSelect(side, e.target.files?.[0] || null)}
        />
        {!photo.preview ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={saving}
            className="w-full border-2 border-dashed border-secondary/40 rounded-xl p-6 text-center hover:border-secondary hover:bg-secondary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-secondary/60" />
            <p className="text-sm font-medium">Click to choose {label.toLowerCase()}</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or WEBP</p>
          </button>
        ) : (
          <div className="relative rounded-xl overflow-hidden border-2 border-secondary/30 bg-black/5">
            <img src={photo.preview} alt={label} className="w-full h-48 object-cover" />
            <button
              type="button"
              onClick={() => handlePhotoSelect(side, null)}
              disabled={saving}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors disabled:opacity-50"
              aria-label={`Remove ${label}`}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] uppercase tracking-wider">
              {label}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Gallery Case</DialogTitle>
          <DialogDescription>
            Fill in the case details and add the before & after photos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Procedure — dropdown of the canonical procedures for the chosen
              category, so the new case carries the same name as its page. */}
          <div className="space-y-2">
            <Label htmlFor="procedure">Procedure</Label>
            {currentProcedureOptions.length > 0 ? (
              <Select
                value={formData.procedure}
                onValueChange={(value) => setFormData(prev => ({ ...prev, procedure: value }))}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a procedure" />
                </SelectTrigger>
                <SelectContent>
                  {currentProcedureOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="procedure"
                placeholder="e.g., Primary Rhinoplasty"
                value={formData.procedure}
                onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                disabled={saving}
              />
            )}
            <p className="text-xs text-muted-foreground">
              The card will be labeled <span className="text-secondary font-medium">{currentProcedureLabel}</span> — Patient #.
            </p>
          </div>

          {/* Title (optional) */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Case Title <span className="text-gray-400 text-xs">(optional — defaults to the procedure name)</span>
            </Label>
            <Input
              id="title"
              placeholder={currentProcedureLabel}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={saving}
            />
          </div>

          {/* Patient Journey */}
          <div className="space-y-2">
            <Label htmlFor="journeyNote">
              Patient Journey Note <span className="text-gray-400 text-xs">(optional)</span>
            </Label>
            <Textarea
              id="journeyNote"
              placeholder="Write the patient's testimonial or journey note here…"
              value={formData.journeyNote}
              onChange={(e) => setFormData({ ...formData, journeyNote: e.target.value })}
              rows={4}
              disabled={saving}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Shown in the lightbox when visitors view this case.
            </p>
          </div>

          {/* Before / After Photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
            {renderPhotoPicker('before')}
            {renderPhotoPicker('after')}
          </div>
          <p className="text-xs text-muted-foreground -mt-3">
            You can add additional angle views (front, side, ¾) later using the "Add Views" button on the case card.
          </p>

          {/* Status / Actions */}
          {statusMessage && (
            <div className="bg-secondary/10 border border-secondary/30 rounded-lg px-4 py-2 text-sm text-secondary flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {statusMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={saving || !formData.title.trim() || !beforePhoto.file || !afterPhoto.file}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Case
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
