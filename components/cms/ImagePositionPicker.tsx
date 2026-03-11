import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Save, RotateCcw, Monitor, Smartphone } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

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

interface ImagePositionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'desktop' | 'mobile';
  currentPosition?: string;
  onSave: (position: string) => void;
  accessToken?: string;
}

const PHONE_W = 300;
const PHONE_H = 650;
const DESKTOP_NAV_RATIO = 0.20;

export function ImagePositionPicker({
  isOpen, onClose, type, currentPosition = 'center center', onSave, accessToken,
}: ImagePositionPickerProps) {
  const [xPct, setXPct] = useState(50);
  const [yPct, setYPct] = useState(50);
  const [activeSlide, setActiveSlide] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [frameRect, setFrameRect] = useState({ w: 0, h: 0 });
  const dragRef = useRef({ startX: 0, startY: 0, startXPct: 50, startYPct: 50 });
  const frameRef = useRef<HTMLDivElement>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>();
  const imageSrc = `/images/hero/${type}/hero-slide-${activeSlide}.jpg`;

  useEffect(() => {
    if (isOpen) {
      const { x, y } = parsePosition(currentPosition);
      setXPct(x); setYPct(y);
      setShowHint(true);
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setShowHint(false), 3000);
    }
    return () => clearTimeout(hintTimer.current);
  }, [isOpen, currentPosition]);

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

  const getOverflow = useCallback(() => {
    const fw = type === 'mobile' ? PHONE_W : frameRect.w;
    const fh = type === 'mobile' ? PHONE_H : frameRect.h;
    if (!imgNatural.w || !imgNatural.h || !fw || !fh) return { ox: 0, oy: 0 };
    const imgR = imgNatural.w / imgNatural.h;
    const frmR = fw / fh;
    let dW: number, dH: number;
    if (imgR > frmR) { dH = fh; dW = fh * imgR; } else { dW = fw; dH = fw / imgR; }
    return { ox: Math.max(0, dW - fw), oy: Math.max(0, dH - fh) };
  }, [imgNatural, frameRect, type]);

  const applyDrag = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    const { ox, oy } = getOverflow();
    let newX = dragRef.current.startXPct;
    let newY = dragRef.current.startYPct;
    if (ox > 0) newX = clamp(newX - (dx / ox) * 100, 0, 100);
    if (oy > 0) newY = clamp(newY - (dy / oy) * 100, 0, 100);
    setXPct(newX); setYPct(newY);
  }, [getOverflow]);

  const onDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true); setShowHint(false);
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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
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

  const positionString = `${Math.round(xPct)}% ${Math.round(yPct)}%`;

  const handleReset = () => {
    const { x, y } = parsePosition(type === 'desktop' ? 'center center' : 'center 30%');
    setXPct(x); setYPct(y);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const contentKey = type === 'desktop' ? 'hero_desktop_position' : 'hero_mobile_position';
      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;
      await fetch(`${serverUrl}/content/${contentKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken ?? publicAnonKey}` },
        body: JSON.stringify({ value: positionString }),
      });
      onSave(positionString); onClose();
    } catch (err) {
      console.error('Error saving position:', err);
      alert('Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  if (!isOpen) return null;
  const { ox, oy } = getOverflow();

  const heroImage = (
    <img src={imageSrc} alt="Hero preview"
      className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      style={{ objectPosition: positionString }} draggable={false}
      onLoad={(e) => { const img = e.target as HTMLImageElement; setImgNatural({ w: img.naturalWidth, h: img.naturalHeight }); }}
      onError={(e) => { const img = e.target as HTMLImageElement; if (img.src.endsWith('.jpg')) img.src = img.src.replace('.jpg', '.png'); }}
    />
  );

  const gradient = <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent pointer-events-none" />;

  const dragHint = showHint ? (
    <div className="absolute bottom-10 inset-x-0 flex justify-center pointer-events-none" style={{ transition: 'opacity 0.6s', opacity: 0.8 }}>
      <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3" />
          <circle cx="12" cy="12" r="1" fill="white" />
        </svg>
        <span className="text-white text-[10px] font-medium">Drag to pan</span>
      </div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1a1f2e] rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden" style={{ maxWidth: '1040px', maxHeight: '95vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#c9b896]/15 flex items-center justify-center">
              {type === 'mobile' ? <Smartphone className="w-5 h-5 text-[#c9b896]" /> : <Monitor className="w-5 h-5 text-[#c9b896]" />}
            </div>
            <div>
              <h2 className="text-white font-semibold">{type === 'mobile' ? 'Mobile' : 'Desktop'} Hero Position</h2>
              <p className="text-gray-500 text-xs mt-0.5">
                {type === 'mobile'
                  ? 'Drag the image inside the phone to reframe it'
                  : "Drag the image to choose what's visible below the nav"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-6 bg-black/25 overflow-auto">

            {type === 'mobile' ? (
              <div className="relative flex-shrink-0">
                <div className="relative bg-[#0c0c0e] rounded-[44px] shadow-[0_30px_80px_rgba(0,0,0,0.7)] ring-1 ring-white/10" style={{ padding: '14px 12px 20px' }}>
                  <div className="absolute top-[14px] left-1/2 -translate-x-1/2 z-20 w-28 h-7 bg-[#0c0c0e] rounded-b-2xl flex items-center justify-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1e] ring-1 ring-white/5" />
                    <div className="w-1 h-1 rounded-full bg-[#1c1c1e]" />
                  </div>
                  <div ref={frameRef} className="relative overflow-hidden rounded-[32px] select-none"
                    style={{ width: `${PHONE_W}px`, height: `${PHONE_H}px`, cursor: isDragging ? 'grabbing' : 'grab' }}
                    onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }}
                    onTouchStart={(e) => { const t = e.touches[0]; onDragStart(t.clientX, t.clientY); }}
                  >
                    {heroImage}{gradient}
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-3 pb-1 pointer-events-none z-10">
                      <span className="text-white text-[11px] font-semibold">9:41</span>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-end gap-[2px] h-3">{[3,5,7,9].map((h,i) => <div key={i} className="w-[3px] bg-white rounded-[1px]" style={{ height: `${h}px` }} />)}</div>
                        <svg width="12" height="10" viewBox="0 0 24 18" fill="white"><path d="M12 14a2 2 0 110 4 2 2 0 010-4zm0-5a8 8 0 016.4 3.2l-1.6 1.6A6 6 0 0012 11a6 6 0 00-4.8 2.4L5.6 11.8A8 8 0 0112 9zm0-5C16.97 4 21.4 6.1 24 9.5L22.4 11A11 11 0 0012 7a11 11 0 00-10.4 4L0 9.5A15 15 0 0112 4z" /></svg>
                        <div className="relative flex items-center"><div className="w-5 h-2.5 border border-white/80 rounded-[3px] flex items-center px-[1px]"><div className="h-1.5 w-3.5 bg-white rounded-[2px]" /></div><div className="w-[2px] h-[6px] bg-white/60 rounded-r-[2px] -ml-[1px]" /></div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-start px-5 pt-16 pb-8 pointer-events-none z-10">
                      <div>
                        <p className="text-[#c9b896] text-[8px] uppercase tracking-[0.28em] mb-2 font-bold">Double Board Certified Plastic Surgeon</p>
                        <h1 className="text-white font-serif text-[22px] leading-snug mb-2">Experience<br />you can trust</h1>
                        <p className="text-gray-200 text-[9px] leading-relaxed mb-4 max-w-[200px]">Recognizing that each patient&#39;s goal is unique, Dr. Hanemann offers creative solutions for exceptional results.</p>
                        <div className="inline-flex items-center bg-[#c9b896] text-white text-[8px] uppercase tracking-[0.15em] px-4 py-2 rounded-full">Schedule Consultation</div>
                      </div>
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10">
                      {[0,1,2].map(i => <div key={i} className="rounded-full transition-all duration-300" style={{ width: activeSlide-1===i ? '18px':'6px', height:'6px', background: activeSlide-1===i ? '#c9b896':'rgba(255,255,255,0.35)' }} />)}
                    </div>
                    {dragHint}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/50 rounded-full pointer-events-none z-10" />
                  </div>
                  <div className="absolute right-[-4px] top-[90px] w-[4px] h-12 bg-[#1c1c1e] rounded-r-lg" />
                  <div className="absolute left-[-4px] top-[70px] w-[4px] h-8 bg-[#1c1c1e] rounded-l-lg" />
                  <div className="absolute left-[-4px] top-[112px] w-[4px] h-10 bg-[#1c1c1e] rounded-l-lg" />
                  <div className="absolute left-[-4px] top-[158px] w-[4px] h-10 bg-[#1c1c1e] rounded-l-lg" />
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[700px] flex-shrink-0">
                {/* Browser chrome */}
                <div className="bg-[#2a2a2d] rounded-t-xl px-4 py-2.5 flex items-center gap-3 border-b border-black/30">
                  <div className="flex gap-1.5 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57] ring-1 ring-black/20" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e] ring-1 ring-black/20" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840] ring-1 ring-black/20" />
                  </div>
                  <div className="flex-1 bg-[#1a1a1a] rounded-md px-3 py-1 text-[11px] text-gray-500 font-mono truncate">hanemannplasticsurgery.com</div>
                </div>

                {/* Screen */}
                <div ref={frameRef} className="relative overflow-hidden select-none rounded-b-xl"
                  style={{ width: '100%', aspectRatio: '16 / 9', cursor: isDragging ? 'grabbing' : 'grab' }}
                  onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }}
                  onTouchStart={(e) => { const t = e.touches[0]; onDragStart(t.clientX, t.clientY); }}
                >
                  {heroImage}
                  {gradient}

                  {/* Nav bar overlay - visual only, shows what the fixed header covers */}
                  <div className="absolute top-0 left-0 right-0 pointer-events-none z-30" style={{ height: `${DESKTOP_NAV_RATIO * 100}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a1f2e]/85 via-[#1a1f2e]/70 to-transparent" />
                    <div className="relative h-full flex items-center justify-between px-5">
                      <div className="flex gap-1.5 items-center">
                        {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-white/20" />)}
                      </div>
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5">
                        <span className="text-[#c9b896] font-serif text-sm tracking-[0.2em] leading-none">HANEMANN</span>
                        <span className="text-white/50 text-[6px] uppercase tracking-[0.3em]">Plastic Surgery</span>
                      </div>
                      <div className="bg-[#c9b896]/30 rounded-full px-2 py-0.5">
                        <span className="text-[#c9b896] text-[7px] uppercase tracking-wider">Consult</span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-5 pb-1">
                      {['About','Procedures','Gallery','Before & After','Contact'].map(tab => (
                        <span key={tab} className="text-white/30 text-[6px] uppercase tracking-wider whitespace-nowrap">{tab}</span>
                      ))}
                    </div>
                    {/* Gold dashed boundary line */}
                    <div className="absolute bottom-0 left-0 right-0 border-b-2 border-dashed border-[#c9b896]/80" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-0.5">
                      <div className="bg-[#c9b896] text-[#1a1f2e] text-[7px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-b whitespace-nowrap shadow-lg">
                        &#8595; Visible hero starts here
                      </div>
                    </div>
                  </div>

                  {/* Text overlay — below nav bar, matching real pt-[240px] layout */}
                  <div className="absolute inset-0 flex items-start px-12 pointer-events-none z-10"
                    style={{ paddingTop: `${(DESKTOP_NAV_RATIO + 0.06) * 100}%` }}>
                    <div className="max-w-lg">
                      <p className="text-[#c9b896] text-[11px] uppercase tracking-[0.3em] mb-2 font-bold">Double Board Certified Plastic Surgeon</p>
                      <h1 className="text-white font-serif text-4xl leading-tight mb-3">Experience you can trust</h1>
                      <p className="text-gray-200 text-sm font-light leading-relaxed mb-5 max-w-sm">Recognizing that each patient&#39;s goal is unique, Dr. Hanemann offers creative solutions for exceptional results.</p>
                      <div className="inline-flex items-center bg-[#c9b896] text-white text-xs uppercase tracking-widest px-7 py-3 rounded-full">Schedule Consultation</div>
                    </div>
                  </div>

                  {/* Slide dots */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10">
                    {[0,1,2].map(i => <div key={i} className="rounded-full transition-all duration-300" style={{ width: activeSlide-1===i ? '22px':'8px', height:'8px', background: activeSlide-1===i ? '#c9b896':'rgba(255,255,255,0.35)' }} />)}
                  </div>
                  {dragHint}
                </div>

                {/* Legend */}
                <div className="mt-2 flex items-center gap-4 px-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-0 border-t-2 border-dashed border-[#c9b896]/70" />
                    <span className="text-gray-600 text-[9px]">Nav bar boundary (image still shows through)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#c9b896]/20 border border-[#c9b896]/40" />
                    <span className="text-gray-600 text-[9px]">Drag anywhere — adjusts full viewport</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls sidebar */}
          <div className="w-60 flex-shrink-0 border-l border-white/10 flex flex-col bg-[#13172a] overflow-y-auto">
            <div className="p-4 border-b border-white/8">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2.5 font-semibold">Preview Slide</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[1,2,3].map(n => <button key={n} onClick={() => setActiveSlide(n)} className="py-2 rounded-lg text-sm font-medium transition-all duration-200" style={{ background: activeSlide===n ? '#c9b896':'rgba(255,255,255,0.05)', color: activeSlide===n ? '#fff':'rgba(255,255,255,0.45)' }}>{n}</button>)}
              </div>
            </div>
            <div className="p-4 border-b border-white/8 space-y-4">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 font-semibold">Fine Adjust</p>
              <div>
                <div className="flex justify-between mb-1.5"><span className="text-gray-500 text-xs">&#8592; Horizontal &#8594;</span><span className="text-[#c9b896] text-xs font-mono">{Math.round(xPct)}%</span></div>
                <input type="range" min="0" max="100" step="1" value={Math.round(xPct)} onChange={e => setXPct(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#c9b896' }} />
                <div className="flex justify-between mt-0.5"><span className="text-gray-700 text-[9px]">Left</span><span className="text-gray-700 text-[9px]">Right</span></div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5"><span className="text-gray-500 text-xs">&#8593; Vertical &#8595;</span><span className="text-[#c9b896] text-xs font-mono">{Math.round(yPct)}%</span></div>
                <input type="range" min="0" max="100" step="1" value={Math.round(yPct)} onChange={e => setYPct(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#c9b896' }} />
                <div className="flex justify-between mt-0.5"><span className="text-gray-700 text-[9px]">Top</span><span className="text-gray-700 text-[9px]">Bottom</span></div>
              </div>
            </div>
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 font-semibold">CSS Value</p>
              <div className="bg-black/30 rounded-lg px-3 py-2"><code className="text-[#c9b896] text-xs break-all">{positionString}</code></div>
            </div>
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2.5 font-semibold">Keyboard Nudge</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">{['\u2190','\u2192','\u2191','\u2193'].map(k => <kbd key={k} className="bg-white/10 text-white text-[10px] px-1.5 py-0.5 rounded font-mono leading-none">{k}</kbd>)}</div>
                  <span className="text-gray-600 text-[10px]">1%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    <kbd className="bg-white/10 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">&#8679;</kbd>
                    <span className="text-gray-600 text-[10px] mx-0.5">+</span>
                    <kbd className="bg-white/10 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">&#8593;&#8595;</kbd>
                  </div>
                  <span className="text-gray-600 text-[10px]">5%</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2.5 font-semibold">Pan Freedom</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ox>0?'bg-emerald-400':'bg-gray-700'}`} /><span className="text-gray-500 text-[10px] flex-1">Horizontal</span><span className={`text-[10px] font-mono ${ox>0?'text-emerald-400':'text-gray-700'}`}>{ox>0?`${Math.round(ox)}px`:'Fixed'}</span></div>
                <div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${oy>0?'bg-emerald-400':'bg-gray-700'}`} /><span className="text-gray-500 text-[10px] flex-1">Vertical</span><span className={`text-[10px] font-mono ${oy>0?'text-emerald-400':'text-gray-700'}`}>{oy>0?`${Math.round(oy)}px`:'Fixed'}</span></div>
                {ox===0 && oy===0 && <p className="text-gray-600 text-[9px] leading-relaxed mt-1">Image fits the frame exactly &#8212; no panning available.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20 flex-shrink-0">
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-white hover:bg-white/8 rounded-lg transition-colors text-sm"><RotateCcw className="w-3.5 h-3.5" />Reset to Default</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-5 py-2 text-gray-500 hover:text-white hover:bg-white/8 rounded-lg transition-colors text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-[#c9b896] hover:bg-[#b8976a] text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Save className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save Position'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
