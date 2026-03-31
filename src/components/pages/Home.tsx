import React, { useState, useEffect } from 'react';
import { EditableText } from '../cms/EditableText';
import { EditableServiceCard } from '../cms/EditableServiceCard';
import { ArrowRight, Star, Shield, Award, Plus, Settings } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { BeforeAfterCard } from '../BeforeAfterCard';
import { GalleryLightbox } from '../GalleryLightbox';
import { NewGalleryCaseEditor } from '../cms/NewGalleryCaseEditor';
import { useAuth } from '../../contexts/AuthContext';
import { useEditMode } from '../../contexts/EditModeContext';
import { SEOHead } from '../seo/SEOHead';
import { ChevronDown } from 'lucide-react';
import { ImagePositionPicker } from '../cms/ImagePositionPicker';
import { HeroImageUploader } from '../cms/HeroImageUploader';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import drHanemannPhoto from '/images/dr-hanemann.png';

interface GalleryItem {
  id: number;
  category: string;
  title: string;
  procedure: string;
  journeyNote: string;
  beforeImage?: string;
  afterImage?: string;
  featuredOnHome?: boolean;
}

interface HomeProps {
  onNavigate: (page: string) => void;
  onOpenConsultation?: () => void;
  onOpenNewsletter?: () => void;
  heroPositionRequest?: 'desktop' | 'mobile' | null;
  onHeroPositionHandled?: () => void;
  heroUploadRequest?: 'desktop' | 'mobile' | null;
  onHeroUploadHandled?: () => void;
}

export function Home({ onNavigate, onOpenConsultation, heroPositionRequest, onHeroPositionHandled, heroUploadRequest, onHeroUploadHandled }: HomeProps) {
  const { isAdmin, accessToken } = useAuth();
  const { isEditMode } = useEditMode();
  
  const [featuredGallery, setFeaturedGallery] = useState<GalleryItem[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);

  // Client-specified 6 patients in exact order, with preferred orientation index for the card thumbnail
  const FEATURED_ORDER: { slug: string; preferredView?: number }[] = [
    { slug: 'TUMMY_TUCK_Patient01' },                          // 1. Abdominoplasty Pt #1
    { slug: 'BREAST_AUGMENTATION_Patient01' },                  // 2. Breast Augmentation Pt #1
    { slug: 'BREAST_LIFT_Patient01' },                          // 3. Breast Lift (Mastopexy) Pt #1
    { slug: 'RHINOPLASTY_Patient01', preferredView: 2 },       // 4. Rhinoplasty Pt #1 — profile (View 3, index 2)
    { slug: 'FACELIFT_NECKLIFT_Patient12' },                   // 5. Facelift Pt #12
    { slug: 'CHIN_AUGMENTATION_Patient02', preferredView: 1 }, // 6. Chin Aug Pt #2 / Neck Lipo Pt #8 — oblique (View 2, index 1)
  ];

  const displayedGallery = React.useMemo(() => {
    return FEATURED_ORDER
      .map(({ slug, preferredView }) => {
        const item = featuredGallery.find(i => i.slug === slug);
        if (!item) return null;
        // Attach preferred view so the card can show the right orientation thumbnail
        return { ...item, _preferredView: preferredView ?? 0 };
      })
      .filter(Boolean) as (GalleryItem & { _preferredView: number })[];
  }, [featuredGallery]);
  const [newCaseEditorOpen, setNewCaseEditorOpen] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  
  // Image position picker state
  const [positionPickerOpen, setPositionPickerOpen] = useState<'desktop' | 'mobile' | null>(null);
  const [uploaderOpen, setUploaderOpen] = useState<'desktop' | 'mobile' | null>(null);
  const [heroDesktopPosition, setHeroDesktopPosition] = useState('center center');
  const [heroMobilePosition, setHeroMobilePosition] = useState('center 30%');

  // Service card images state - loaded from database
  const [serviceImages, setServiceImages] = useState<Record<string, string>>({});
  const [serviceImagesLoaded, setServiceImagesLoaded] = useState(false);
  const [failedServiceImages, setFailedServiceImages] = useState<Set<string>>(new Set());

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  // Service card data
  const serviceCards = [
    { title: 'Breast', desc: 'Enhancing shape and volume.', page: 'Breast', img: 'https://images.unsplash.com/photo-1768609957045-591c79431f48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd29tYW4lMjBzaWxob3VldHRlJTIwYmVhdXR5JTIwbHV4dXJ5fGVufDF8fHx8MTc3MTk3NzQ1OHww&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Augmentation', 'Lift/Reduction', 'Lift/Augmentation', 'Lift/Auto-Augmentation', 'Revision', 'Fatgrafting'] },
    { title: 'Body', desc: 'Sculpting your ideal contour.', page: 'Body', img: 'https://images.unsplash.com/photo-1646932520067-81bdc09af07a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXQlMjB3b21hbiUyMGJvZHklMjBjb250b3VyJTIwZWxlZ2FudCUyMGx1eHVyeXxlbnwxfHx8fDE3NzE5Nzc0NTh8MA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Abdominoplasty (Tummy Tuck)', 'Liposuction', 'Body Lift', 'Mommy Makeover', 'Brachioplasty (Arm Lift)', 'Thigh Lift'] },
    { title: 'Face', desc: 'Restoring youth and harmony.', page: 'Face', img: 'https://images.unsplash.com/photo-1764265923632-b2126ec0dedc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd29tYW4lMjBmYWNlJTIwcG9ydHJhaXQlMjBsdXh1cnklMjBiZWF1dHl8ZW58MXx8fHwxNzcxOTc3NDU3fDA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Facelift', 'Browlift', 'Eyelid Surgery', 'Neck Lift', 'Otoplasty', 'Neck and Jawline Shaping with Liposuction'] },
    { title: 'Nose', desc: 'Refining profile and function.', page: 'Nose', img: 'https://images.unsplash.com/photo-1760341682514-41b5199c6205?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dGlmdWwlMjB3b21hbiUyMHByb2ZpbGUlMjBwb3J0cmFpdCUyMGVsZWdhbnR8ZW58MXx8fHwxNzcxOTc3NDU3fDA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Rhinoplasty', 'Revision Rhinoplasty', 'Ethnic Rhinoplasty'] },
  ];

  // Load hero image positions from database
  useEffect(() => {
    loadHeroPositions();
    loadServiceImages();
  }, []);

  const loadServiceImages = async () => {
    // Fire all 4 requests in parallel instead of sequentially
    const results = await Promise.allSettled(
      serviceCards.map(async (service) => {
        const contentKey = `service_card_${service.title.toLowerCase()}`;
        const response = await fetch(`${serverUrl}/content/${contentKey}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        const data = await response.json();
        return { title: service.title, url: data.content?.value };
      })
    );

    const imageUrls: Record<string, string> = {};
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.url) {
        imageUrls[result.value.title] = result.value.url;

        // Preload the image in the browser cache so it renders instantly when React needs it
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = result.value.url;
        document.head.appendChild(link);
      }
    }

    setServiceImages(imageUrls);
    setServiceImagesLoaded(true);
  };

  const loadHeroPositions = async () => {
    try {
      const desktopRes = await fetch(`${serverUrl}/content/hero_desktop_position`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const desktopData = await desktopRes.json();
      if (desktopData.content?.value) {
        setHeroDesktopPosition(desktopData.content.value);
      }

      const mobileRes = await fetch(`${serverUrl}/content/hero_mobile_position`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const mobileData = await mobileRes.json();
      if (mobileData.content?.value) {
        setHeroMobilePosition(mobileData.content.value);
      }
    } catch (error) {
      console.error('Error loading hero positions:', error);
    }
  };

  // Listen for hero position adjustment requests from Admin Panel
  useEffect(() => {
    if (heroPositionRequest) {
      setPositionPickerOpen(heroPositionRequest);
      onHeroPositionHandled?.();
    }
  }, [heroPositionRequest, onHeroPositionHandled]);

  // Listen for hero image upload requests from Admin Panel
  useEffect(() => {
    if (heroUploadRequest) {
      setUploaderOpen(heroUploadRequest);
      onHeroUploadHandled?.();
    }
  }, [heroUploadRequest, onHeroUploadHandled]);

  // Base gallery items with full metadata
  const baseGalleryItems: GalleryItem[] = [
    {
      id: 1,
      category: 'Nose',
      title: 'Rhinoplasty Case Study',
      procedure: 'Primary Rhinoplasty',
      journeyNote: 'I had been self-conscious about my nose for years. Dr. Hanemann took the time to understand exactly what I wanted and the results exceeded my expectations. The recovery was smooth, and the staff was incredibly supportive throughout the entire process. I finally feel confident in my appearance.'
    },
    {
      id: 2,
      category: 'Face',
      title: 'Facelift Transformation',
      procedure: 'Deep Plane Facelift',
      journeyNote: 'After years of considering a facelift, I finally took the step. Dr. Hanemann\'s expertise is evident in the natural-looking results. I look refreshed and more like myself, not overdone. Friends tell me I look well-rested, not that I\'ve had work done. That\'s exactly what I hoped for.'
    },
    {
      id: 3,
      category: 'Breast',
      title: 'Breast Augmentation Journey',
      procedure: 'Breast Augmentation',
      journeyNote: 'Becoming a mother changed my body, and I wanted to feel like myself again. Dr. Hanemann listened to my concerns and helped me choose the perfect size. The results look completely natural, and I couldn\'t be happier with my decision. My confidence has returned.'
    },
    {
      id: 4,
      category: 'Body',
      title: 'Abdominoplasty Results',
      procedure: 'Tummy Tuck',
      journeyNote: 'After significant weight loss, I struggled with excess skin. Dr. Hanemann performed an amazing tummy tuck that gave me the flat stomach I had worked so hard for. The transformation has been life-changing, and I finally feel comfortable in my own skin.'
    },
    {
      id: 5,
      category: 'Nose',
      title: 'Revision Rhinoplasty',
      procedure: 'Revision Rhinoplasty',
      journeyNote: 'I needed revision surgery after an unsuccessful rhinoplasty elsewhere. Dr. Hanemann\'s skill in revision work is exceptional. He corrected the issues and gave me the nose I had always wanted. I\'m so grateful for his expertise and meticulous attention to detail.'
    },
    {
      id: 6,
      category: 'Face',
      title: 'Brow Lift Enhancement',
      procedure: 'Endoscopic Brow Lift',
      journeyNote: 'My heavy brows made me look tired and older than I felt. The brow lift has opened up my eyes and taken years off my appearance. Dr. Hanemann\'s technique resulted in minimal scarring and a very natural outcome. I look more alert and feel more youthful.'
    },
    {
      id: 7,
      category: 'Breast',
      title: 'Breast Lift Success',
      procedure: 'Mastopexy (Breast Lift)',
      journeyNote: 'Years of nursing and aging had taken their toll. Dr. Hanemann performed a breast lift that restored my youthful contour without implants. The results are beautiful and natural. I feel comfortable going braless again, which I haven\'t done in years.'
    },
    {
      id: 8,
      category: 'Body',
      title: 'Liposuction Transformation',
      procedure: 'Liposuction - Multiple Areas',
      journeyNote: 'Despite diet and exercise, I had stubborn fat deposits that wouldn\'t budge. Dr. Hanemann\'s liposuction technique sculpted my body beautifully. The results are smooth and natural-looking. I finally have the body contours I worked so hard to achieve.'
    },
    {
      id: 9,
      category: 'Nose',
      title: 'Ethnic Rhinoplasty',
      procedure: 'Ethnic Rhinoplasty',
      journeyNote: 'I wanted to refine my nose while maintaining my ethnic identity. Dr. Hanemann understood my goals perfectly and created results that enhanced my features without erasing my heritage. The outcome is exactly what I envisioned - natural and harmonious with my face.'
    },
    {
      id: 10,
      category: 'Face',
      title: 'Neck Lift Results',
      procedure: 'Neck Lift & Platysmaplasty',
      journeyNote: 'My neck was aging faster than the rest of my face. Dr. Hanemann\'s neck lift procedure has given me a more defined jawline and eliminated the sagging that bothered me. The results are dramatic yet natural, and I look years younger.'
    },
    {
      id: 11,
      category: 'Breast',
      title: 'Breast Reconstruction',
      procedure: 'Breast Reconstruction',
      journeyNote: 'After my mastectomy, Dr. Hanemann helped me feel whole again. His compassionate care and surgical skill gave me beautiful, natural-looking breasts. The reconstruction was an important part of my healing journey, and I\'m grateful for the outcome.'
    },
    {
      id: 12,
      category: 'Body',
      title: 'Mommy Makeover',
      procedure: 'Mommy Makeover',
      journeyNote: 'Pregnancy changed my body in ways I wasn\'t prepared for. Dr. Hanemann\'s mommy makeover combined multiple procedures to restore my pre-pregnancy figure. The comprehensive approach addressed all my concerns, and I feel like myself again. Worth every penny.'
    }
  ];

  // Load featured gallery items
  useEffect(() => {
    loadFeaturedGallery();
  }, []);

  // ─── Gallery constants (mirrors Gallery.tsx) ───────────────────────────────
  const GITHUB_RAW = 'https://raw.githubusercontent.com/Nesbit25/HPS-WEB-FEBRUARY/main';
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  const normalizeImageUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.includes('raw.githubusercontent.com')) return url;
    if (url.startsWith('gallery-img:')) return `${GITHUB_RAW}/gallery/${url.slice('gallery-img:'.length)}`;
    if (url.includes('/gallery/img/')) { const m = url.match(/\/gallery\/img\/(.+)$/); if (m) return `${GITHUB_RAW}/gallery/${m[1]}`; }
    if (url.startsWith('/gallery/')) return `${GITHUB_RAW}/${url.slice(1)}`;
    return url;
  };

  const loadFeaturedGallery = async () => {
    try {
      // 1. Try shared localStorage cache (populated by Gallery page)
      const cacheKey = 'gallery_items_cache';
      const tsKey = 'gallery_items_cache_timestamp';
      const cached = localStorage.getItem(cacheKey);
      const ts = localStorage.getItem(tsKey);

      if (cached && ts && Date.now() - parseInt(ts) < CACHE_DURATION) {
        const all: GalleryItem[] = JSON.parse(cached);
        console.log('[Home] Loaded', all.length, 'gallery items from cache');
        setFeaturedGallery(all);
        return;
      }

      // 2. No valid cache — fetch from GitHub + DB in parallel
      console.log('[Home] No cache — fetching from GitHub + DB...');
      const [filesRes, casesRes] = await Promise.all([
        fetch(`${serverUrl}/gallery/github-files?t=${Date.now()}`),
        fetch(`${serverUrl}/gallery/cases`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } })
      ]);
      const filesData = await filesRes.json();
      const casesData = await casesRes.json();
      const dbCases: any[] = casesData.cases || [];

      let allItems: GalleryItem[];

      if (filesData.files?.length) {
        // Parse GitHub filenames into cases (same logic as Gallery.tsx)
        // New format: {PROCEDURE_PREFIX}_Patient{NN}_{Before|After}{N}.{ext}
        const filenameRegex = /^([A-Z_]+)_Patient(\d+)_(Before|After)(\d+)\.(jpg|jpeg|png)$/i;
        const casesMap = new Map<string, any>();

        filesData.files
          .filter((f: any) => f.type === 'file' && /\.(png|jpg|jpeg)$/i.test(f.name))
          .forEach((f: any) => {
            const m = f.name.match(filenameRegex);
            if (!m) return;
            const [, procedurePrefix, patientNum, beforeAfter, viewNumStr] = m;
            const slug = `${procedurePrefix}_Patient${patientNum}`;
            const type = beforeAfter.toLowerCase() === 'before' ? 'before' : 'after';
            const viewNum = parseInt(viewNumStr);
            const repoPath = f.path || `gallery/${f.name}`;
            const imageUrl = `${GITHUB_RAW}/${repoPath}`;
            if (!casesMap.has(slug)) {
              const procTitle = procedurePrefix
                .replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, (w: string) => w.charAt(0).toUpperCase() + w.slice(1));
              casesMap.set(slug, {
                slug, id: slug,
                title: `${procTitle} — Patient ${patientNum}`,
                category: f.category || 'Face', procedure: '', journeyNote: '',
              });
            }
            const c = casesMap.get(slug);
            // Only take view 1 as the primary before/after for the home featured cards
            if (viewNum === 1) {
              if (type === 'before' && !c.beforeImage) c.beforeImage = imageUrl;
              if (type === 'after' && !c.afterImage) c.afterImage = imageUrl;
            }
          });

        allItems = Array.from(casesMap.values()).map(item => {
          const db = dbCases.find((c: any) => c.slug === item.slug);
          if (!db) return item;
          return {
            ...item,
            category: db.category || item.category,
            procedure: db.procedure || item.category,
            journeyNote: db.journeyNote || '',
            featuredOnHome: db.featuredOnHome || false,
            showOnNose: db.showOnNose || false,
            showOnFace: db.showOnFace || false,
            showOnBreast: db.showOnBreast || false,
            showOnBody: db.showOnBody || false,
            orientations: (db.orientations || []).map((o: any) => ({
              ...o,
              beforeImage: normalizeImageUrl(o.beforeImage),
              afterImage: normalizeImageUrl(o.afterImage),
            })),
          };
        });
      } else {
        // GitHub unavailable — fall back to DB-only
        allItems = dbCases.map((c: any) => ({
          ...c,
          beforeImage: normalizeImageUrl(c.beforeImage),
          afterImage: normalizeImageUrl(c.afterImage),
          orientations: (c.orientations || []).map((o: any) => ({
            ...o,
            beforeImage: normalizeImageUrl(o.beforeImage),
            afterImage: normalizeImageUrl(o.afterImage),
          })),
        }));
      }

      // Cache results for other pages to reuse
      localStorage.setItem(cacheKey, JSON.stringify(allItems));
      localStorage.setItem(tsKey, Date.now().toString());

      console.log('[Home] Loaded', allItems.length, 'gallery items');
      setFeaturedGallery(allItems);
    } catch (error) {
      console.error('[Home] Error loading featured gallery:', error);
      setFeaturedGallery([]);
    }
  };

  // Auto rotate hero
  useEffect(() => {
    const interval = setInterval(() => setActiveSlide(prev => (prev + 1) % 3), 5000);
    return () => clearInterval(interval);
  }, []);

  // Infinite scroll logic for service carousel
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    const cardWidth = 384; // md:w-96 = 384px
    const gap = 16; // gap-4 = 16px
    const cardPlusGap = cardWidth + gap;
    const localServiceCards = [
      { title: 'Breast' },
      { title: 'Body' },
      { title: 'Face' },
      { title: 'Nose' }
    ];
    const totalCards = localServiceCards.length;
    const totalWidth = cardPlusGap * totalCards;

    // Start at the beginning of the middle set
    container.scrollLeft = totalWidth;

    const handleScroll = () => {
      if (isAutoScrolling) return;

      const scrollLeft = container.scrollLeft;

      // If scrolled to the end (reached third set), jump back to first set at same position
      if (scrollLeft >= totalWidth * 2 - cardPlusGap / 2) {
        setIsAutoScrolling(true);
        container.scrollLeft = scrollLeft - totalWidth;
        setTimeout(() => setIsAutoScrolling(false), 50);
      }
      // If scrolled to the beginning (reached first set), jump forward to second set at same position
      else if (scrollLeft <= cardPlusGap / 2) {
        setIsAutoScrolling(true);
        container.scrollLeft = scrollLeft + totalWidth;
        setTimeout(() => setIsAutoScrolling(false), 50);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isAutoScrolling]);

  const handleOpenLightbox = (index: number) => {
    setCurrentLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleNextImage = () => {
    setCurrentLightboxIndex((prev) => (prev + 1) % displayedGallery.length);
  };

  const handlePreviousImage = () => {
    setCurrentLightboxIndex((prev) => (prev - 1 + displayedGallery.length) % displayedGallery.length);
  };

  return (
    <div>
      <SEOHead
        title="Plastic Surgeon Baton Rouge, LA | Dr. Hanemann"
        description="Dr. Michael Hanemann, double board-certified plastic surgeon in Baton Rouge, LA. Expert rhinoplasty, facelifts, breast augmentation, body contouring. Serving Baton Rouge and surrounding areas."
        keywords="plastic surgeon Baton Rouge, Dr. Hanemann, rhinoplasty Baton Rouge, breast augmentation Baton Rouge, tummy tuck Baton Rouge, facelift Baton Rouge, board certified plastic surgeon Louisiana"
        canonical="/"
      />
      {/* Hero Section - Full Screen */}
      <section className="relative w-full overflow-hidden">
        {/* Full viewport height container - starts at very top edge */}
        <div className="relative w-full h-screen -mt-[180px] min-h-[600px]">
          {/* Single hero image - absolutely positioned to fill entire container */}
          <div className="absolute inset-0">
            
            {/* Desktop slides - crossfade through 3 images */}
            <div className="hidden md:block absolute inset-0 w-full h-full z-0 bg-gray-900">
              {[1, 2, 3].map((n, i) => (
                <img
                  key={`desktop-${n}`}
                  src={`/images/hero/desktop/hero-slide-${n}.jpg`}
                  alt={`Hanemann Plastic Surgery Hero ${n}`}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                  style={{
                    objectPosition: heroDesktopPosition,
                    opacity: activeSlide === i ? 1 : 0,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ))}
            </div>

            {/* Mobile slides - portrait optimized */}
            <div className="md:hidden absolute inset-0 w-full h-full z-0 bg-gray-900">
              {[1, 2, 3].map((n, i) => (
                <img
                  key={`mobile-${n}`}
                  src={`/images/hero/mobile/hero-slide-${n}.jpg`}
                  alt={`Hanemann Plastic Surgery Hero Mobile ${n}`}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                  style={{
                    objectPosition: heroMobilePosition,
                    opacity: activeSlide === i ? 1 : 0,
                  }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    // Try .png if .jpg fails, then hide if that fails too
                    if (img.src.endsWith('.jpg')) {
                      img.src = img.src.replace('.jpg', '.png');
                    } else {
                      img.style.display = 'none';
                    }
                  }}
                />
              ))}
            </div>

            {/* Dark gradient overlay - allow pointer events to pass through in edit mode */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-5 pointer-events-none" />
          </div>
          
          {/* Content Overlay - positioned over images */}
          <div className="absolute inset-0 z-20 flex items-center px-4 md:px-6 pt-[220px] md:pt-[240px] pointer-events-none">
            <div className="container mx-auto pointer-events-auto">
              <div className="max-w-3xl">
                {/* Hero Content */}
                <div>
                  <h2 className="text-secondary text-xs md:text-sm lg:text-base uppercase tracking-[0.3em] mb-3 md:mb-4 font-bold">
                    <EditableText as="span" contentKey="hero_label_1" defaultValue="Double Board Certified Plastic Surgeon" />
                  </h2>
                  <h1 className="text-3xl md:text-5xl lg:text-7xl font-serif text-white mb-4 md:mb-6 leading-tight">
                    <EditableText as="span" contentKey="home_hero_title_1" defaultValue="Experience you can trust" />
                  </h1>
                  <p className="text-gray-200 text-base md:text-lg lg:text-xl mb-6 md:mb-8 font-light max-w-2xl leading-relaxed">
                    <EditableText as="span" contentKey="home_hero_subtitle_1" defaultValue="Recognizing that each patient's goal is unique, Dr. Hanemann offers creative solutions for his patients, utilizing the latest techniques and procedures to achieve desired results" />
                  </p>
                  <button 
                    onClick={() => onNavigate('Contact')}
                    className="inline-block bg-secondary text-white px-8 md:px-10 py-3 md:py-4 rounded-full text-sm md:text-base uppercase tracking-widest hover:bg-white hover:text-primary transition-all duration-300"
                  >
                    Schedule Consultation
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Slide indicator dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2 pointer-events-auto">
            {[0, 1, 2].map(i => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="transition-all duration-300"
                style={{
                  width: activeSlide === i ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  background: activeSlide === i ? '#c9b896' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Edit Mode - Hero Image Position Buttons */}
          {isEditMode && isAdmin && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex gap-4 pointer-events-auto">
              <button
                onClick={() => setPositionPickerOpen('desktop')}
                className="bg-secondary/90 hover:bg-secondary text-white px-6 py-3 rounded-lg shadow-2xl backdrop-blur-sm border-2 border-white/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Adjust Desktop Hero</span>
              </button>
              <button
                onClick={() => setPositionPickerOpen('mobile')}
                className="bg-secondary/90 hover:bg-secondary text-white px-6 py-3 rounded-lg shadow-2xl backdrop-blur-sm border-2 border-white/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Adjust Mobile Hero</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-24 bg-cream">

        {/* ── DESKTOP LAYOUT (lg+) ── completely separate from mobile ── */}
        <div className="hidden lg:block">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-5 gap-12 items-center">
              {/* Left Content Section */}
              <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-primary mb-2">
                  <span className="text-3xl md:text-4xl tracking-wide uppercase">OUR MAIN</span>
                  <br />
                  <span className="font-serif text-5xl md:text-6xl italic">Services</span>
                </h2>
                
                <div className="w-16 h-0.5 bg-secondary my-8"></div>
                
                <p className="text-gray-600 leading-relaxed text-base mb-8">
                  <EditableText 
                    contentKey="home_services_description_long"
                    defaultValue="Whether you're looking to refine your facial features, contour your body, or restore symmetry and function after an injury or illness, our classic personalized approach and attention to detail ensure exceptional results tailored to your unique needs. You can trust Dr. Hanemann's skill and artistry to transform your vision into reality and rediscover your confidence and self-assurance."
                    as="span"
                    multiline
                  />
                </p>
                
                <button
                  onClick={() => onNavigate('Gallery')}
                  className="bg-transparent border-2 border-secondary text-secondary hover:bg-secondary hover:text-white px-8 py-3 text-sm uppercase tracking-[0.2em] transition-all duration-300"
                >
                  See Our Results
                </button>
              </div>
            </div>

              {/* Right Carousel Section */}
              <div className="lg:col-span-3 relative h-[600px]">
                <div className="relative overflow-hidden h-full w-[850px] mx-auto">
                  <div className="flex gap-4 overflow-x-hidden scrollbar-hide snap-x snap-mandatory h-full" ref={carouselRef}>
                  {/* Render three sets for seamless infinite loop */}
                  {[...serviceCards, ...serviceCards, ...serviceCards].map((service, index) => {
                    // Only show image after custom images have been checked;
                    // this prevents the stock photo from flashing before the real one loads
                    const resolvedSrc = failedServiceImages.has(service.title)
                      ? undefined
                      : serviceImagesLoaded
                        ? (serviceImages[service.title] || service.img)
                        : undefined;
                    
                    return (
                    <div
                      key={`${service.title}-${index}`}
                      className="flex-shrink-0 w-80 md:w-96 snap-center group relative h-full"
                    >
                      {/* Background Image */}
                      <div className="absolute inset-0 overflow-hidden bg-[#2a2f3a]">
                        {resolvedSrc && (
                          <img
                            src={resolvedSrc}
                            alt={service.title}
                            loading="eager"
                            // @ts-ignore - fetchPriority is valid but not yet in React types
                            fetchPriority="high"
                            className="w-full h-full object-cover object-center group-hover:scale-110 transition-all duration-700 opacity-0"
                            onLoad={(e) => { (e.target as HTMLImageElement).classList.remove('opacity-0'); (e.target as HTMLImageElement).classList.add('opacity-100'); }}
                            onError={() => {
                              setFailedServiceImages(prev => new Set([...prev, service.title]));
                            }}
                          />
                        )}
                      </div>

                      {/* Dark Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 group-hover:from-black/80 group-hover:via-black/50 group-hover:to-black/20 transition-all duration-500 pointer-events-none" />

                      {/* Category Title - Centered */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <h3 className="font-serif text-5xl md:text-6xl text-white italic group-hover:scale-110 transition-transform duration-500">
                          {service.title.toUpperCase()}
                        </h3>
                      </div>

                      {/* Hover Content - Bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="space-y-2 mb-4">
                          {service.procedures.map((proc, i) => (
                            <p key={i} className="text-sm text-white/90 tracking-wide">
                              • {proc}
                            </p>
                          ))}
                        </div>
                        <div className="flex items-center text-secondary mt-4">
                          <span className="text-sm uppercase tracking-wider mr-2">Explore</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      {/* Bottom Accent Line */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left pointer-events-none" />

                      {/* Clickable overlay for navigation - must be last to sit on top */}
                      <div
                        className="absolute inset-0 z-10 cursor-pointer"
                        onClick={() => onNavigate(service.page)}
                      />
                    </div>
                    );
                  })}
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={(e) => { e.stopPropagation(); const c = e.currentTarget.parentElement?.querySelector('.overflow-x-hidden') as HTMLElement; if (c) c.scrollBy({ left: -320, behavior: 'smooth' }); }}
                  className="flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-white transition-all duration-300 hover:scale-110 z-10"
                  aria-label="Previous"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); const c = e.currentTarget.parentElement?.querySelector('.overflow-x-hidden') as HTMLElement; if (c) c.scrollBy({ left: 320, behavior: 'smooth' }); }}
                  className="flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-white transition-all duration-300 hover:scale-110 z-10"
                  aria-label="Next"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>{/* end hidden lg:block desktop wrapper */}

        {/* ── MOBILE LAYOUT (below lg) — fully independent, no grid parent ── */}
        <div className="block lg:hidden">
          <div className="container mx-auto px-6">
            {/* Section heading */}
            <div className="mb-8">
              <h2 className="text-primary mb-2">
                <span className="text-3xl tracking-wide uppercase">OUR MAIN</span>
                <br />
                <span className="font-serif text-5xl italic">Services</span>
              </h2>
              <div className="w-16 h-0.5 bg-secondary mt-4"></div>
            </div>

            {/* Cards — fully inline styles so Tailwind purge cannot affect them */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {serviceCards.map((service) => {
                const resolvedSrc = failedServiceImages.has(service.title)
                  ? undefined
                  : serviceImagesLoaded
                    ? (serviceImages[service.title] || service.img)
                    : undefined;
                return (
                  <div
                    key={service.title}
                    onClick={() => onNavigate(service.page)}
                    style={{
                      position: 'relative',
                      height: '288px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                    }}
                  >
                    {/* Background image */}
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: '#2a2f3a' }}>
                      {resolvedSrc && (
                        <img
                          src={resolvedSrc}
                          alt={service.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 0.5s ease-in-out' }}
                          onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                          onError={() => { setFailedServiceImages(prev => new Set([...prev, service.title])); }}
                        />
                      )}
                    </div>
                    {/* Gradient overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.12) 100%)' }} />
                    {/* Category title */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '96px' }}>
                      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '3rem', color: '#ffffff', fontStyle: 'italic', margin: 0, lineHeight: 1 }}>
                        {service.title.toUpperCase()}
                      </h3>
                    </div>
                    {/* Procedure list + explore link */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
                      <div style={{ marginBottom: '12px' }}>
                        {service.procedures.map((proc, i) => (
                          <p key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', margin: '3px 0', letterSpacing: '0.04em' }}>
                            • {proc}
                          </p>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', color: '#c9b896' }}>
                        <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', marginRight: '8px' }}>Explore</span>
                        <ArrowRight style={{ width: '16px', height: '16px' }} />
                      </div>
                    </div>
                    {/* Gold accent bar */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '3px', backgroundColor: '#c9b896' }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
      </section>

      {/* Introduction */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 border-t-4 border-l-4 border-secondary"></div>
            <img
              src="/images/about/dr-hanemann-reading.png"
              alt="Dr. Hanemann"
              className="rounded-lg shadow-2xl relative z-10 w-full h-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-4 border-r-4 border-secondary z-0"></div>
          </div>
          <div>
            <h4 className="text-secondary font-bold uppercase tracking-widest mb-2">The Surgeon</h4>
            <h2 className="font-serif text-4xl lg:text-5xl text-primary mb-6">
              <EditableText as="span" contentKey="intro_heading" defaultValue="Meet Dr. Hanemann" />
            </h2>
            <div className="text-gray-600 font-light leading-relaxed mb-8">
              <EditableText 
                contentKey="intro_text" 
                multiline
                defaultValue="Dr. Hanemann is a renowned plastic surgeon known for his meticulous attention to detail and natural-looking results. With a deep understanding of anatomy and an artistic eye, he helps patients achieve their aesthetic goals with confidence." 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-3">
                <Shield className="text-secondary mt-1" />
                <div>
                  <h5 className="font-bold text-primary">Board Certified</h5>
                  <p className="text-sm text-gray-500">American Board of Plastic Surgery</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award className="text-secondary mt-1" />
                <div>
                  <h5 className="font-bold text-primary">Top Doctor</h5>
                  <p className="text-sm text-gray-500">Board Certified American Board of Otolaryngology</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => onNavigate('About')}
              className="text-primary font-bold border-b-2 border-secondary hover:text-secondary transition-colors pb-1"
            >
              Read Full Bio
            </button>
          </div>
        </div>
      </section>

      {/* The Process Section */}
      <section className="py-24 bg-[#1a1f2e] border-t border-[#2d3548] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#c9b896]/4 rounded-full blur-3xl pointer-events-none"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <p className="text-[#c9b896] text-xs uppercase tracking-[0.25em] font-medium mb-3">Your Journey</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#faf9f7] mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-base">From your first question to your final result, we guide you every step of the way.</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#c9b896] to-transparent mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 max-w-5xl mx-auto relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center px-8 pb-12 md:pb-0 relative z-10">
              <div className="w-[104px] h-[104px] rounded-full bg-[#c9b896]/10 border border-[#c9b896]/30 flex items-center justify-center mb-6 relative">
                <span className="font-serif text-4xl text-[#c9b896] font-bold">1</span>
                <div className="absolute inset-0 rounded-full bg-[#c9b896]/5 animate-pulse"></div>
              </div>
              <h3 className="text-[#faf9f7] text-lg font-semibold mb-3">Schedule a Consultation</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Meet with Dr. Hanemann in his private Baton Rouge office for a personalized, pressure-free consultation to discuss your goals.</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center px-8 pb-12 md:pb-0 relative z-10">
              <div className="w-[104px] h-[104px] rounded-full bg-[#c9b896]/20 border border-[#c9b896]/50 flex items-center justify-center mb-6">
                <span className="font-serif text-4xl text-[#c9b896] font-bold">2</span>
              </div>
              <h3 className="text-[#faf9f7] text-lg font-semibold mb-3">Your Custom Plan</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Dr. Hanemann crafts a tailored treatment plan around your unique anatomy, aesthetic goals, and lifestyle — never a one-size-fits-all approach.</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center px-8 relative z-10">
              <div className="w-[104px] h-[104px] rounded-full bg-[#c9b896]/10 border border-[#c9b896]/30 flex items-center justify-center mb-6">
                <span className="font-serif text-4xl text-[#c9b896] font-bold">3</span>
              </div>
              <h3 className="text-[#faf9f7] text-lg font-semibold mb-3">Your Transformation</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Experience natural, lasting results with the confidence of knowing you were cared for by one of Louisiana's most trusted surgeons.</p>
            </div>
          </div>

          <div className="text-center mt-14">
            <button
              onClick={() => onNavigate('Contact')}
              className="inline-flex items-center gap-3 bg-[#c9b896] text-[#1a1f2e] font-semibold px-10 py-4 rounded-full text-sm uppercase tracking-widest hover:bg-[#d4c4a8] transition-all duration-300 shadow-lg shadow-[#c9b896]/20"
            >
              Begin Your Journey
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Before & After Preview */}
      <section className="py-24 bg-primary text-white">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-serif text-4xl mb-2">
                <EditableText as="span" contentKey="home_gallery_heading" defaultValue="Real Results" />
              </h2>
              <p className="text-gray-400">
                <EditableText as="span" contentKey="home_gallery_description" defaultValue="Browse our extensive gallery of patient transformations." />
              </p>
            </div>
            <button 
              onClick={() => onNavigate('Gallery')}
              className="hidden md:inline-flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-full hover:bg-white hover:text-primary transition-all duration-300 font-semibold uppercase tracking-wider text-sm"
            >
              View Full Gallery <ArrowRight size={18}/>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedGallery.length > 0 ? (
              <>
                {displayedGallery.map((c, index) => {
                  const titleLower = c.title.toLowerCase();
                  const isStackedType =
                    titleLower.includes('arm lift') ||
                    titleLower.includes('eyelid');
                  // Use preferred orientation images for the card thumbnail
                  const viewIdx = (c as any)._preferredView ?? 0;
                  const ori = c.orientations?.[viewIdx];
                  const cardBefore = ori?.beforeImage || c.beforeImage;
                  const cardAfter = ori?.afterImage || c.afterImage;
                  return (
                  <BeforeAfterCard
                    key={c.id}
                    beforeImage={cardBefore}
                    afterImage={cardAfter}
                    category={c.category}
                    title={c.title}
                    onClick={() => handleOpenLightbox(index)}
                    interval={3000}
                    layout={isStackedType ? 'stacked' : 'side-by-side'}
                    objectFit={isStackedType ? 'contain' : 'cover'}
                    imagePosition="center"
                  />
                  );
                })}
                {isAdmin && isEditMode && (
                  <div 
                    className="bg-card text-card-foreground border-2 border-dashed border-secondary/40 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-secondary/20 transition-all duration-500 cursor-pointer hover:-translate-y-2 group hover:border-secondary"
                    onClick={() => setNewCaseEditorOpen(true)}
                  >
                    <div className="aspect-square bg-gradient-to-br from-muted to-secondary/10 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
                      <Plus className="w-16 h-16 text-secondary/40 group-hover:text-secondary transition-colors duration-500 group-hover:scale-110 transform" />
                      <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="p-4 bg-card relative">
                      <div className="flex items-center justify-between">
                        <span className="text-secondary">Add New Case</span>
                        <span className="text-xs text-muted-foreground group-hover:text-secondary transition-colors">Click to Create →</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {isAdmin && isEditMode ? (
                  <div 
                    className="bg-card text-card-foreground border-2 border-dashed border-secondary/40 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-secondary/20 transition-all duration-500 cursor-pointer hover:-translate-y-2 group hover:border-secondary"
                    onClick={() => setNewCaseEditorOpen(true)}
                  >
                    <div className="aspect-square bg-gradient-to-br from-muted to-secondary/10 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
                      <Plus className="w-16 h-16 text-secondary/40 group-hover:text-secondary transition-colors duration-500 group-hover:scale-110 transform" />
                      <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="p-4 bg-card relative">
                      <div className="flex items-center justify-between">
                        <span className="text-secondary">Add New Case</span>
                        <span className="text-xs text-muted-foreground group-hover:text-secondary transition-colors">Click to Create →</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-400">No featured cases yet. Add cases in the admin panel.</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="mt-12 text-center md:hidden">
            <button 
              onClick={() => onNavigate('Gallery')}
              className="inline-flex items-center gap-2 bg-secondary text-white px-8 py-3 rounded-full hover:bg-white hover:text-primary transition-all duration-300 font-semibold uppercase tracking-wider text-sm"
            >
              View Full Gallery <ArrowRight size={18}/>
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-cream">
        <div className="container mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-secondary text-xs uppercase tracking-[0.25em] font-bold mb-3">Patient Stories</p>
            <h2 className="font-serif text-4xl md:text-5xl text-primary mb-4 leading-tight">What Our Patients Say</h2>
            <div className="w-16 h-0.5 bg-secondary mx-auto mt-4"></div>
          </div>

          {/* 3-column testimonial grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-secondary fill-secondary" />
                ))}
              </div>
              <blockquote className="text-gray-600 leading-relaxed italic flex-1 mb-6 text-sm md:text-base">
                "Dr. Hanemann changed my life. The results are so natural — no one knows I had surgery, they just tell me I look great. The care I received throughout the entire process was exceptional."
              </blockquote>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 bg-secondary/15 rounded-full flex items-center justify-center text-secondary font-serif font-bold">S</div>
                <div>
                  <p className="font-bold text-primary text-sm">Sarah M.</p>
                  <p className="text-xs text-gray-400">Rhinoplasty Patient</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 — featured center */}
            <div className="bg-[#1a1f2e] rounded-2xl p-8 shadow-xl flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#c9b896]/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#c9b896] fill-[#c9b896]" />
                ))}
              </div>
              <blockquote className="text-gray-300 leading-relaxed italic flex-1 mb-6 text-sm md:text-base relative z-10">
                "After years of insecurity, I finally feel like myself. Dr. Hanemann took the time to truly understand what I was looking for and delivered results that are beautiful and completely natural. I couldn't be happier."
              </blockquote>
              <div className="flex items-center gap-3 pt-4 border-t border-[#2d3548] relative z-10">
                <div className="w-10 h-10 bg-[#c9b896]/20 rounded-full flex items-center justify-center text-[#c9b896] font-serif font-bold">J</div>
                <div>
                  <p className="font-bold text-white text-sm">Jennifer L.</p>
                  <p className="text-xs text-gray-400">Breast Augmentation Patient</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-secondary fill-secondary" />
                ))}
              </div>
              <blockquote className="text-gray-600 leading-relaxed italic flex-1 mb-6 text-sm md:text-base">
                "The attention to detail and artistry Dr. Hanemann brings to his work is unmatched. My facelift results are stunning — friends say I look refreshed and well-rested, not like I had surgery. Exactly what I wanted."
              </blockquote>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 bg-secondary/15 rounded-full flex items-center justify-center text-secondary font-serif font-bold">M</div>
                <div>
                  <p className="font-bold text-primary text-sm">Michelle T.</p>
                  <p className="text-xs text-gray-400">Facelift Patient</p>
                </div>
              </div>
            </div>
          </div>

          {/* Google Reviews CTA */}
          <div className="text-center mt-12">
            <a
              href="https://www.google.com/search?q=Hanemann+Plastic+Surgery+Baton+Rouge+reviews"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-secondary transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Read more reviews on Google
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Trust Bar - Credentials */}
      <section className="bg-[#1a1f2e] py-16 md:py-20 border-b border-[#2d3548]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {/* Board Certified */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#c9b896]/10 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-[#c9b896]/20 transition-colors">
                <Award className="w-6 h-6 md:w-8 md:h-8 text-[#c9b896]" />
              </div>
              <h3 className="text-white text-sm md:text-base font-semibold mb-1">Double Board Certified</h3>
              <p className="text-gray-400 text-xs md:text-sm leading-tight">American Board of Plastic Surgery & American Board of Otolaryngology</p>
            </div>

            {/* Years Experience */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#c9b896]/10 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-[#c9b896]/20 transition-colors">
                <Shield className="w-6 h-6 md:w-8 md:h-8 text-[#c9b896]" />
              </div>
              <h3 className="text-white text-sm md:text-base font-semibold mb-1">15+ Years</h3>
              <p className="text-gray-400 text-xs md:text-sm">Experience</p>
            </div>

            {/* Procedures */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#c9b896]/10 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-[#c9b896]/20 transition-colors">
                <Star className="w-6 h-6 md:w-8 md:h-8 text-[#c9b896]" />
              </div>
              <h3 className="text-white text-sm md:text-base font-semibold mb-1">4,000+</h3>
              <p className="text-gray-400 text-xs md:text-sm">Procedures</p>
            </div>

            {/* Patient Reviews */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#c9b896]/10 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-[#c9b896]/20 transition-colors">
                <Star className="w-6 h-6 md:w-8 md:h-8 text-[#c9b896] fill-[#c9b896]" />
              </div>
              <h3 className="text-white text-sm md:text-base font-semibold mb-1">5 Star</h3>
              <p className="text-gray-400 text-xs md:text-sm">Patient Reviews</p>
            </div>
          </div>
          
          {/* Certification Logos - Below Stats */}
          <div className="mt-12 pt-10 border-t border-[#2d3548]">
            <p className="text-center text-[#c9b896] text-xs uppercase tracking-[0.25em] mb-8">Certified &amp; Accredited</p>
            <div className="flex flex-nowrap justify-center items-center gap-4 md:gap-8 lg:gap-12 xl:gap-16 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0">
              {/* SESPRS - Blue & Red Symbol */}
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="h-28 md:h-32 w-36 md:w-44 flex items-center justify-center rounded-xl bg-[#faf9f7] shadow-lg shadow-black/20 group-hover:shadow-xl group-hover:shadow-[#c9b896]/15 border border-[#c9b896]/20 group-hover:border-[#c9b896]/50 transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.03]">
                  <img
                    src="/images/certifications/cert-logo-1.png"
                    alt="Southeastern Society of Plastic and Reconstructive Surgeons"
                    className="h-20 md:h-24 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="mt-3 text-[11px] text-[#c9b896] font-semibold uppercase tracking-wider">SESPRS</span>
                <span className="mt-0.5 text-[10px] text-gray-400 text-center max-w-[140px] leading-tight">Southeastern Society of Plastic and Reconstructive Surgeons</span>
              </div>
              
              {/* ASAPS - Triangle Symbol */}
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="h-28 md:h-32 w-36 md:w-44 flex items-center justify-center rounded-xl bg-[#faf9f7] shadow-lg shadow-black/20 group-hover:shadow-xl group-hover:shadow-[#c9b896]/15 border border-[#c9b896]/20 group-hover:border-[#c9b896]/50 transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.03]">
                  <img
                    src="/images/certifications/cert-logo-2.png"
                    alt="American Society for Aesthetic Plastic Surgery"
                    className="h-20 md:h-24 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="mt-3 text-[11px] text-[#c9b896] font-semibold uppercase tracking-wider">ASAPS</span>
                <span className="mt-0.5 text-[10px] text-gray-400 text-center max-w-[140px] leading-tight">American Society for Aesthetic Plastic Surgery</span>
              </div>
              
              {/* ASPS - Circle Image */}
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="h-28 md:h-32 w-36 md:w-44 flex items-center justify-center rounded-xl bg-[#faf9f7] shadow-lg shadow-black/20 group-hover:shadow-xl group-hover:shadow-[#c9b896]/15 border border-[#c9b896]/20 group-hover:border-[#c9b896]/50 transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.03]">
                  <img
                    src="/images/certifications/cert-logo-3.png"
                    alt="American Society of Plastic Surgeons"
                    className="h-20 md:h-24 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="mt-3 text-[11px] text-[#c9b896] font-semibold uppercase tracking-wider">ASPS</span>
                <span className="mt-0.5 text-[10px] text-gray-400 text-center max-w-[140px] leading-tight">American Society of Plastic Surgeons</span>
              </div>

              {/* ABPS - American Board of Plastic Surgery */}
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="h-28 md:h-32 w-36 md:w-44 flex items-center justify-center rounded-xl bg-[#faf9f7] shadow-lg shadow-black/20 group-hover:shadow-xl group-hover:shadow-[#c9b896]/15 border border-[#c9b896]/20 group-hover:border-[#c9b896]/50 transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.03]">
                  <img
                    src="/images/certifications/abps-logo.png"
                    alt="American Board of Plastic Surgery"
                    className="h-20 md:h-24 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="mt-3 text-[11px] text-[#c9b896] font-semibold uppercase tracking-wider">ABPS</span>
                <span className="mt-0.5 text-[10px] text-gray-400 text-center max-w-[140px] leading-tight">American Board of Plastic Surgery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && displayedGallery.length > 0 && (
        <GalleryLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          currentItem={displayedGallery[currentLightboxIndex]}
          currentIndex={currentLightboxIndex}
          totalImages={displayedGallery.length}
          onNext={handleNextImage}
          onPrevious={handlePreviousImage}
          defaultOrientation={(displayedGallery[currentLightboxIndex] as any)?._preferredView ?? 0}
        />
      )}

      {/* New Case Editor */}
      {newCaseEditorOpen && accessToken && (
        <NewGalleryCaseEditor
          isOpen={newCaseEditorOpen}
          onClose={() => setNewCaseEditorOpen(false)}
          onSaved={loadFeaturedGallery}
          accessToken={accessToken}
        />
      )}

      {/* Image Position Picker */}
      {positionPickerOpen && (
        <ImagePositionPicker
          isOpen={true}
          type={positionPickerOpen}
          onClose={() => setPositionPickerOpen(null)}
          onSave={(position) => {
            if (positionPickerOpen === 'desktop') {
              setHeroDesktopPosition(position);
            } else {
              setHeroMobilePosition(position);
            }
          }}
          currentPosition={positionPickerOpen === 'desktop' ? heroDesktopPosition : heroMobilePosition}
          accessToken={accessToken}
        />
      )}

      {/* Hero Image Uploader */}
      {uploaderOpen && (
        <HeroImageUploader
          isOpen={true}
          type={uploaderOpen}
          onClose={() => setUploaderOpen(null)}
          onUploadComplete={(newImageUrl) => {
            console.log('Hero image uploaded:', newImageUrl);
            // Image URL is saved to database by the component
          }}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}