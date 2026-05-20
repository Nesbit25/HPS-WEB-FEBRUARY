import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Save, RotateCcw, Monitor, Smartphone, Upload } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// ─── Helpers ────────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const parsePosition = (pos: string): { x: number; y: number } => {
  const parts = pos.trim().split(/\s+/);
  const parse = (s: string, def: number) => {
    if (!s || s === 'center') return 50;
    if (s === 'left' || s === 'top') return 0;
    if (s === 'right' || s === 'bottom') return 100;
    const n = parseFloat(s);
    return isNaN(n) ? def : n;
  };
  return { x: parse(parts[0], 50), y: parse(parts[1] ?? 'center', 50) };
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface ImagePositionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'desktop' | 'mobile';
  currentPosition?: string;
  onSave: (position: string) => void;
  accessToken?: string;
}

// ─── Mobile phone dimensions (CSS px, inner screen) ─────────────────────────
const PHONE_W = 300;
const PHONE_H = 650;

// ─── Desktop: nav bar covers this fraction of the viewport ──────────────────
// Hero uses h-screen -mt-[180px] ≈ 20% of a ~900px viewport
const DESKTOP_NAV_RATIO = 0.20;

// ─── Component ───────────────────────────────────────────────────────────────
export function ImagePositionPicker({
  isOpen,
  onClose,
  type,
  currentPosition = 'center center',
  onSave,
  accessToken,
}: ImagePositionPickerProps) {
  const [xPct, setXPct] = useState(50);
  const [yPct, setYPct] = useState(50);
  const [activeSlide, setActiveSlide] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [frameRect, setFrameRect] = useState({ w: 0, h: 0 });
  // CMS-stored image URL for each slide. Loaded on open; null falls back to the
  // static repo file under /images/hero/{type}/hero-slide-N.jpg.
  const [slideImageUrls, setSlideImageUrls] = useState<Record<number, string | null>>({ 1: null, 2: null, 3: null });
  const [uploading, setUploading] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const dragRef = useRef({ startX: 0, startY: 0, startXPct: 50, startYPct: 50 });
  const frameRef = useRef<HTMLDivElement>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>();
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;
  const staticFallback = `/images/hero/${type}/hero-slide-${activeSlide}.jpg`;
  const imageSrc = slideImageUrls[activeSlide] || staticFallback;

  // Sync from prop on open
  useEffect(() => {
    if (isOpen) {
      const { x, y } = parsePosition(currentPosition);
      setXPct(x);
      setYPct(y);
      setShowHint(true);
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setShowHint(false), 3000);
    }
    return () => clearTimeout(hintTimer.current);
  }, [isOpen, currentPosition]);

  // Load the current CMS-stored image for each slide whenever the dialog opens
  // so the picker shows the photo that's actually live on the site (instead of
  // the original static repo file). Cache-busting query string + no-store so
  // the browser doesn't return a stale response.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      const ts = Date.now();
      const results = await Promise.all(
        [1, 2, 3].map(async (n) => {
          try {
            const res = await fetch(`${serverUrl}/content/home_hero_image_${n}?t=${ts}`, {
              headers: { 'Authorization': `Bearer ${publicAnonKey}` },
              cache: 'no-store',
            });
            if (!res.ok) return [n, null] as const;
            const data = await res.json();
            const value = data?.content?.value;
            return [n, typeof value === 'string' && value.length > 0 ? value : null] as const;
          } catch {
            return [n, null] as const;
          }
        })
      );
      if (cancelled) return;
      const next: Record<number, string | null> = { 1: null, 2: null, 3: null };
      for (const [n, url] of results) next[n] = url;
      setSlideImageUrls(next);
    })();
    return () => { cancelled = true; };
  }, [isOpen, serverUrl]);

  // Compress an image to a reasonable size before upload.
  const compressImage = (file: File, maxW = 1920, maxH = 1280, quality = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxW || h > maxH) {
            const r = w / h;
            if (r > maxW / maxH) { w = maxW; h = Math.round(w / r); }
            else { h = maxH; w = Math.round(h * r); }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('No canvas context'));
          ctx.drawImage(img, 0, 0, w, h);
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64.split(',')[1]);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Upload a photo for the currently-selected slide and immediately reflect it
  // in the preview. The site picks up the change on next reload (or now if the
  // user just opens the page again).
  const handleUploadForSlide = async (file: File) => {
    if (!file || !accessToken) {
      alert('You need to be signed in as an admin to upload.');
      return;
    }
    setUploading(true);
    try {
      const base64Data = await compressImage(file);
      const uploadRes = await fetch(`${serverUrl}/photos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: `hero-slide-${activeSlide}-${Date.now()}.jpg`,
          fileData: base64Data,
          category: 'facility',
          title: `Hero Slide ${activeSlide}`,
          caption: `Uploaded for hero carousel slide ${activeSlide}`,
          displayLocation: `home_hero_image_${activeSlide}`,
          status: 'published',
          featured: false,
        }),
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Upload failed (${uploadRes.status}): ${err}`);
      }
      const uploadData = await uploadRes.json();
      if (!uploadData.success || !uploadData.publicUrl) {
        throw new Error('Upload response missing publicUrl');
      }
      // Persist the new URL to the content key the home hero reads from.
      const saveRes = await fetch(`${serverUrl}/content/home_hero_image_${activeSlide}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: uploadData.publicUrl }),
      });
      if (!saveRes.ok) {
        const err = await saveRes.text();
        throw new Error(`Could not save image URL (${saveRes.status}): ${err}`);
      }
      const saveJson = await saveRes.json().catch(() => null);
      console.log('[ImagePositionPicker] Save response:', saveJson);

      // Verify the write actually landed by reading it back fresh.
      try {
        const verify = await fetch(
          `${serverUrl}/content/home_hero_image_${activeSlide}?t=${Date.now()}`,
          { headers: { 'Authorization': `Bearer ${publicAnonKey}` }, cache: 'no-store' }
        );
        const verifyData = await verify.json();
        console.log('[ImagePositionPicker] Verify read:', verifyData?.content?.value);
      } catch (vErr) {
        console.warn('[ImagePositionPicker] Verify read failed:', vErr);
      }

      // Reflect in the picker immediately.
      setSlideImageUrls(prev => ({ ...prev, [activeSlide]: uploadData.publicUrl }));
      setImgNatural({ w: 0, h: 0 }); // force re-measure on next load
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (err: any) {
      console.error('[ImagePositionPicker] Upload error:', err);
      alert(err?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  // Measure frame after render (needed for desktop responsive width)
  useEffect(() => {
    if (!isOpen) return;
    const measure = () => {
      if (frameRef.current) {
        const { width, height } = frameRef.current.getBoundingClientRect();
        setFrameRect({ w: width, h: height });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (frameRef.current) ro.observe(frameRef.current);
    return () => ro.disconnect();
  }, [isOpen]);

  // ─── Compute pan overflow ─────────────────────────────────────────────────
  const getOverflow = useCallback(() => {
    const fw = type === 'mobile' ? PHONE_W : frameRect.w;
    const fh = type === 'mobile' ? PHONE_H : frameRect.h;
    if (!imgNatural.w || !imgNatural.h || !fw || !fh) return { ox: 0, oy: 0 };

    const imgR = imgNatural.w / imgNatural.h;
    const frmR = fw / fh;
    let dW: number, dH: number;

    if (imgR > frmR) {
      // Image is wider relative to frame → fits height, overflows width
      dH = fh;
      dW = fh * imgR;
    } else {
      // Image is taller relative to frame → fits width, overflows height
      dW = fw;
      dH = fw / imgR;
    }
    return { ox: Math.max(0, dW - fw), oy: Math.max(0, dH - fh) };
  }, [imgNatural, frameRect, type]);

  // ─── Drag logic ───────────────────────────────────────────────────────────
  const applyDrag = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    const { ox, oy } = getOverflow();

    let newX = dragRef.current.startXPct;
    let newY = dragRef.current.startYPct;

    // Dragging right → image moves right → revealing left side → X decreases
    if (ox > 0) newX = clamp(newX - (dx / ox) * 100, 0, 100);
    if (oy > 0) newY = clamp(newY - (dy / oy) * 100, 0, 100);

    setXPct(newX);
    setYPct(newY);
  }, [getOverflow]);

  const onDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setShowHint(false);
    dragRef.current = { startX: clientX, startY: clientY, startXPct: xPct, startYPct: yPct };
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => applyDrag(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => applyDrag(e.touches[0].clientX, e.touches[0].clientY);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, applyDrag]);

  // ─── Keyboard nudge ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowLeft')  setXPct(p => clamp(p - step, 0, 100));
      if (e.key === 'ArrowRight') setXPct(p => clamp(p + step, 0, 100));
      if (e.key === 'ArrowUp')    setYPct(p => clamp(p - step, 0, 100));
      if (e.key === 'ArrowDown')  setYPct(p => clamp(p + step, 0, 100));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const positionString = `${Math.round(xPct)}% ${Math.round(yPct)}%`;

  const handleReset = () => {
    const { x, y } = parsePosition(type === 'desktop' ? 'center center' : 'center 30%');
    setXPct(x);
    setYPct(y);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const contentKey = type === 'desktop' ? 'hero_desktop_position' : 'hero_mobile_position';
      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;
      await fetch(`${serverUrl}/content/${contentKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken ?? publicAnonKey}`,
        },
        body: JSON.stringify({ value: positionString }),
      });
      onSave(positionString);
      onClose();
    } catch (err) {
      console.error('Error saving position:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const { ox, oy } = getOverflow();

  // ─── Shared image / overlay JSX ──────────────────────────────────────────
  // `key` forces a fresh load when the source URL changes (slide switch or
  // upload completion) so we get a correct natural-size measurement.
  const heroImage = (
    <img
      key={imageSrc}
      src={imageSrc}
      alt="Hero preview"
      className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      style={{ objectPosition: positionString }}
      draggable={false}
      onLoad={(e) => {
        const img = e.target as HTMLImageElement;
        setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      }}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        // CMS URL failed → fall back to the static repo file.
        if (slideImageUrls[activeSlide] && img.src === slideImageUrls[activeSlide]) {
          img.src = staticFallback;
        } else if (img.src.endsWith('.jpg')) {
          img.src = img.src.replace('.jpg', '.png');
        }
      }}
    />
  );

  const gradient = (
    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent pointer-events-none" />
  );

  const dragHint = showHint ? (
    <div
      className="absolute bottom-10 inset-x-0 flex justify-center pointer-events-none"
      style={{ transition: 'opacity 0.6s', opacity: showHint ? 0.8 : 0 }}
    >
      <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3" />
          <circle cx="12" cy="12" r="1" fill="white" />
        </svg>
        <span className="text-white text-[10px] font-medium">Drag to pan</span>
      </div>
    </div>
  ) : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div
        className="bg-[#1a1f2e] rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
        style={{ maxWidth: '1040px', maxHeight: '95vh' }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#c9b896]/15 flex items-center justify-center">
              {type === 'mobile'
                ? <Smartphone className="w-5 h-5 text-[#c9b896]" />
                : <Monitor className="w-5 h-5 text-[#c9b896]" />}
            </div>
            <div>
              <h2 className="text-white font-semibold">
                {type === 'mobile' ? 'Mobile' : 'Desktop'} Hero Position
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">
                {type === 'mobile'
                  ? 'Drag the image inside the phone to reframe it'
                  : "Drag the image to choose what's visible in the hero"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Preview area */}
          <div className="flex-1 flex items-center justify-center p-6 bg-black/25 overflow-auto">

            {type === 'mobile' ? (
              /* ─── Phone Frame ─────────────────────────────────────────── */
              <div className="relative flex-shrink-0">
                {/* Outer shell */}
                <div className="relative bg-[#0c0c0e] rounded-[44px] shadow-[0_30px_80px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
                  style={{ padding: '14px 12px 20px' }}>

                  {/* Dynamic Island / notch */}
                  <div className="absolute top-[14px] left-1/2 -translate-x-1/2 z-20
                    w-28 h-7 bg-[#0c0c0e] rounded-b-2xl flex items-center justify-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1e] ring-1 ring-white/5" />
                    <div className="w-1 h-1 rounded-full bg-[#1c1c1e]" />
                  </div>

                  {/* Screen */}
                  <div
                    ref={frameRef}
                    className="relative overflow-hidden rounded-[32px] select-none"
                    style={{
                      width: `${PHONE_W}px`,
                      height: `${PHONE_H}px`,
                      cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }}
                    onTouchStart={(e) => { const t = e.touches[0]; onDragStart(t.clientX, t.clientY); }}
                  >
                    {heroImage}
                    {gradient}

                    {/* Status bar */}
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-3 pb-1 pointer-events-none z-10">
                      <span className="text-white text-[11px] font-semibold">9:41</span>
                      <div className="flex items-center gap-1.5">
                        {/* Signal bars */}
                        <div className="flex items-end gap-[2px] h-3">
                          {[3, 5, 7, 9].map((h, i) => (
                            <div key={i} className="w-[3px] bg-white rounded-[1px]" style={{ height: `${h}px` }} />
                          ))}
                        </div>
                        {/* WiFi */}
                        <svg width="12" height="10" viewBox="0 0 24 18" fill="white">
                          <path d="M12 14a2 2 0 110 4 2 2 0 010-4zm0-5a8 8 0 016.4 3.2l-1.6 1.6A6 6 0 0012 11a6 6 0 00-4.8 2.4L5.6 11.8A8 8 0 0112 9zm0-5C16.97 4 21.4 6.1 24 9.5L22.4 11A11 11 0 0012 7a11 11 0 00-10.4 4L0 9.5A15 15 0 0112 4z" />
                        </svg>
                        {/* Battery */}
                        <div className="relative flex items-center">
                          <div className="w-5 h-2.5 border border-white/80 rounded-[3px] flex items-center px-[1px]">
                            <div className="h-1.5 w-3.5 bg-white rounded-[2px]" />
                          </div>
                          <div className="w-[2px] h-[6px] bg-white/60 rounded-r-[2px] -ml-[1px]" />
                        </div>
                      </div>
                    </div>

                    {/* Hero text overlay — matches real mobile layout */}
                    <div className="absolute inset-0 flex items-start px-5 pt-16 pb-8 pointer-events-none z-10">
                      <div>
                        <p className="text-[#c9b896] text-[8px] uppercase tracking-[0.28em] mb-2 font-bold">
                          Double Board Certified Plastic Surgeon
                        </p>
                        <h1 className="text-white font-serif text-[22px] leading-snug mb-2">
                          Experience<br />you can trust
                        </h1>
                        <p className="text-gray-200 text-[9px] leading-relaxed mb-4 max-w-[200px]">
                          Recognizing that each patient's goal is unique, Dr. Hanemann offers
                          creative solutions for exceptional results.
                        </p>
                        <div className="inline-flex items-center bg-[#c9b896] text-white text-[8px] uppercase tracking-[0.15em] px-4 py-2 rounded-full">
                          Schedule Consultation
                        </div>
                      </div>
                    </div>

                    {/* Dot indicators */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10">
                      {[0,1,2].map(i => (
                        <div key={i} className="rounded-full transition-all duration-300"
                          style={{
                            width: activeSlide - 1 === i ? '18px' : '6px',
                            height: '6px',
                            background: activeSlide - 1 === i ? '#c9b896' : 'rgba(255,255,255,0.35)',
                          }}
                        />
                      ))}
                    </div>

                    {dragHint}

                    {/* Home indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/50 rounded-full pointer-events-none z-10" />
                  </div>

                  {/* Physical buttons */}
                  <div className="absolute right-[-4px] top-[90px] w-[4px] h-12 bg-[#1c1c1e] rounded-r-lg" />
                  <div className="absolute left-[-4px] top-[70px] w-[4px] h-8 bg-[#1c1c1e] rounded-l-lg" />
                  <div className="absolute left-[-4px] top-[112px] w-[4px] h-10 bg-[#1c1c1e] rounded-l-lg" />
                  <div className="absolute left-[-4px] top-[158px] w-[4px] h-10 bg-[#1c1c1e] rounded-l-lg" />
                </div>
              </div>

            ) : (
              /* ─── Desktop Browser Frame ───────────────────────────────── */
              <div className="w-full max-w-[700px] flex-shrink-0">
                {/* Browser chrome */}
                <div className="bg-[#2a2a2d] rounded-t-xl px-4 py-2.5 flex items-center gap-3 border-b border-black/30">
                  <div className="flex gap-1.5 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57] ring-1 ring-black/20" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e] ring-1 ring-black/20" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840] ring-1 ring-black/20" />
                  </div>
                  <div className="flex-1 bg-[#1a1a1a] rounded-md px-3 py-1 text-[11px] text-gray-500 font-mono truncate">
                    hanemannplasticsurgery.com
                  </div>
                </div>

                {/* Screen */}
                <div
                  ref={frameRef}
                  className="relative overflow-hidden select-none rounded-b-xl"
                  style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    cursor: isDragging ? 'grabbing' : 'grab',
                  }}
                  onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }}
                  onTouchStart={(e) => { const t = e.touches[0]; onDragStart(t.clientX, t.clientY); }}
                >
                  {heroImage}
                  {gradient}

                  {/* ── Nav bar overlay (non-interactive, visual only) ─────
                      Represents the fixed header that covers the top ~20% of
                      the hero. Image shows through (semi-transparent) so the
                      admin can still adjust, but the dashed edge makes it
                      crystal-clear where the visible hero actually begins.  */}
                  <div
                    className="absolute top-0 left-0 right-0 pointer-events-none z-30"
                    style={{ height: `${DESKTOP_NAV_RATIO * 100}%` }}
                  >
                    {/* Nav background — matches the site's transparent-to-navy gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a1f2e]/85 via-[#1a1f2e]/70 to-transparent" />

                    {/* Simplified nav content */}
                    <div className="relative h-full flex items-center justify-between px-5">
                      {/* Left: social icon placeholders */}
                      <div className="flex gap-1.5 items-center">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-3 h-3 rounded-full bg-white/20" />
                        ))}
                      </div>

                      {/* Center: Logo wordmark */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5">
                        <span className="text-[#c9b896] font-serif text-sm tracking-[0.2em] leading-none">HANEMANN</span>
                        <span className="text-white/50 text-[6px] uppercase tracking-[0.3em]">Plastic Surgery</span>
                      </div>

                      {/* Right: CTA button placeholder */}
                      <div className="bg-[#c9b896]/30 rounded-full px-2 py-0.5">
                        <span className="text-[#c9b896] text-[7px] uppercase tracking-wider">Consult</span>
                      </div>
                    </div>

                    {/* Nav tabs row at the bottom of the nav area */}
                    <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-5 pb-1">
                      {['About', 'Procedures', 'Gallery', 'Before & After', 'Contact'].map(tab => (
                        <span key={tab} className="text-white/30 text-[6px] uppercase tracking-wider whitespace-nowrap">{tab}</span>
                      ))}
                    </div>

                    {/* ── Visible-area edge marker ─────────────────────────
                        Gold dashed line + label at the exact bottom of the
                        nav bar — this is where the visible hero begins.     */}
                    <div className="absolute bottom-0 left-0 right-0 border-b-2 border-dashed border-[#c9b896]/80" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-0.5 flex items-center gap-1 pointer-events-none">
                      <div className="bg-[#c9b896] text-[#1a1f2e] text-[7px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-b whitespace-nowrap shadow-lg">
                        ↓ Visible hero starts here
                      </div>
                    </div>
                  </div>

                  {/* Desktop text overlay — positioned below the nav bar */}
                  <div
                    className="absolute inset-0 flex items-start px-12 pointer-events-none z-10"
                    style={{ paddingTop: `${(DESKTOP_NAV_RATIO + 0.06) * 100}%` }}
                  >
                    <div className="max-w-lg">
                      <p className="text-[#c9b896] text-[11px] uppercase tracking-[0.3em] mb-2 font-bold">
                        Double Board Certified Plastic Surgeon
                      </p>
                      <h1 className="text-white font-serif text-4xl leading-tight mb-3">
                        Experience you can trust
                      </h1>
                      <p className="text-gray-200 text-sm font-light leading-relaxed mb-5 max-w-sm">
                        Recognizing that each patient&#39;s goal is unique, Dr. Hanemann offers creative solutions for exceptional results.
                      </p>
                      <div className="inline-flex items-center bg-[#c9b896] text-white text-xs uppercase tracking-widest px-7 py-3 rounded-full">
                        Schedule Consultation
                      </div>
                    </div>
                  </div>

                  {/* Dot indicators */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10">
                    {[0,1,2].map(i => (
                      <div key={i} className="rounded-full transition-all duration-300"
                        style={{
                          width: activeSlide - 1 === i ? '22px' : '8px',
                          height: '8px',
                          background: activeSlide - 1 === i ? '#c9b896' : 'rgba(255,255,255,0.35)',
                        }}
                      />
                    ))}
                  </div>

                  {dragHint}
                </div>

                {/* Legend below the frame */}
                <div className="mt-2 flex items-center gap-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 border-t-2 border-dashed border-[#c9b896]/70" />
                    <span className="text-gray-600 text-[9px]">Nav bar boundary (image shows through)</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3">
                    <div className="w-3 h-3 rounded-sm bg-[#c9b896]/20 border border-[#c9b896]/40" />
                    <span className="text-gray-600 text-[9px]">Draggable area (full viewport)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Controls sidebar ──────────────────────────────────────────── */}
          <div className="w-60 flex-shrink-0 border-l border-white/10 flex flex-col bg-[#13172a] overflow-y-auto">

            {/* Slide switcher */}
            <div className="p-4 border-b border-white/8">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2.5 font-semibold">Preview Slide</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setActiveSlide(n)}
                    className="py-2 rounded-lg text-sm font-medium transition-all duration-200 relative"
                    style={{
                      background: activeSlide === n ? '#c9b896' : 'rgba(255,255,255,0.05)',
                      color: activeSlide === n ? '#fff' : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {n}
                    {slideImageUrls[n] && (
                      <span
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400"
                        title="Custom image uploaded"
                      />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-gray-600 text-[9px] mt-2">
                Green dot = custom uploaded image. No dot = default image from the site files.
              </p>
            </div>

            {/* Upload new image for this slide */}
            <div className="p-4 border-b border-white/8">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2.5 font-semibold">
                Photo for Slide {activeSlide}
              </p>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadForSlide(file);
                  if (e.target) e.target.value = '';
                }}
              />
              <button
                onClick={() => uploadInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#c9b896]/15 hover:bg-[#c9b896]/25 text-[#c9b896] text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploading ? 'Uploading…' : (slideImageUrls[activeSlide] ? 'Replace Photo' : 'Upload Photo')}
              </button>
              {savedFlash && (
                <div className="mt-2 px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Saved! Close this dialog to see it on the page.
                </div>
              )}
              <p className="text-gray-600 text-[9px] mt-2 leading-relaxed">
                Pick a wide (landscape) photo. One image covers both desktop and mobile — the position controls below let you fine-tune the crop for each device.
              </p>
            </div>

            {/* Sliders */}
            <div className="p-4 border-b border-white/8 space-y-4">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 font-semibold">Fine Adjust</p>

              {/* X slider */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-gray-500 text-xs">← Horizontal →</span>
                  <span className="text-[#c9b896] text-xs font-mono">{Math.round(xPct)}%</span>
                </div>
                <input
                  type="range" min="0" max="100" step="1"
                  value={Math.round(xPct)}
                  onChange={e => setXPct(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: '#c9b896' }}
                />
                <div className="flex justify-between mt-0.5">
                  <span className="text-gray-700 text-[9px]">Left</span>
                  <span className="text-gray-700 text-[9px]">Right</span>
                </div>
              </div>

              {/* Y slider */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-gray-500 text-xs">↑ Vertical ↓</span>
                  <span className="text-[#c9b896] text-xs font-mono">{Math.round(yPct)}%</span>
                </div>
                <input
                  type="range" min="0" max="100" step="1"
                  value={Math.round(yPct)}
                  onChange={e => setYPct(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: '#c9b896' }}
                />
                <div className="flex justify-between mt-0.5">
                  <span className="text-gray-700 text-[9px]">Top</span>
                  <span className="text-gray-700 text-[9px]">Bottom</span>
                </div>
              </div>
            </div>

            {/* CSS value */}
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 font-semibold">CSS Value</p>
              <div className="bg-black/30 rounded-lg px-3 py-2">
                <code className="text-[#c9b896] text-xs break-all">{positionString}</code>
              </div>
            </div>

            {/* Keyboard shortcuts */}
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2.5 font-semibold">Keyboard Nudge</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {['←','→','↑','↓'].map(k => (
                      <kbd key={k} className="bg-white/10 text-white text-[10px] px-1.5 py-0.5 rounded font-mono leading-none">{k}</kbd>
                    ))}
                  </div>
                  <span className="text-gray-600 text-[10px]">1%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    <kbd className="bg-white/10 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">⇧</kbd>
                    <span className="text-gray-600 text-[10px] mx-0.5">+</span>
                    <kbd className="bg-white/10 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">↑↓</kbd>
                  </div>
                  <span className="text-gray-600 text-[10px]">5%</span>
                </div>
              </div>
            </div>

            {/* Pan range */}
            <div className="px-4 py-3">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2.5 font-semibold">Pan Freedom</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ox > 0 ? 'bg-emerald-400' : 'bg-gray-700'}`} />
                  <span className="text-gray-500 text-[10px] flex-1">Horizontal</span>
                  <span className={`text-[10px] font-mono ${ox > 0 ? 'text-emerald-400' : 'text-gray-700'}`}>
                    {ox > 0 ? `${Math.round(ox)}px` : 'Fixed'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${oy > 0 ? 'bg-emerald-400' : 'bg-gray-700'}`} />
                  <span className="text-gray-500 text-[10px] flex-1">Vertical</span>
                  <span className={`text-[10px] font-mono ${oy > 0 ? 'text-emerald-400' : 'text-gray-700'}`}>
                    {oy > 0 ? `${Math.round(oy)}px` : 'Fixed'}
                  </span>
                </div>
                {ox === 0 && oy === 0 && (
                  <p className="text-gray-600 text-[9px] leading-relaxed mt-1">
                    Image fits the frame exactly — no panning available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20 flex-shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-white hover:bg-white/8 rounded-lg transition-colors text-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 text-gray-500 hover:text-white hover:bg-white/8 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#c9b896] hover:bg-[#b8976a] text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save Position'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}