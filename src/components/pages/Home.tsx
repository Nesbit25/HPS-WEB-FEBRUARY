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
    { title: 'Nose', desc: 'Refining profile and function.', page: 'Nose', img: 'https://images.unsplash.com/photo-1760341682514-41b5199c6205?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dGlmdWwlMjB3b21hbiUyMHByb2ZpbGUlMjBwb3J0cmFpdCUyMGVsZWdhbnR8ZW58MXx8fHwxNzcxOTc3NDU3fDA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Rhinoplasty', 'Revision Rhinoplasty', 'Ethnic Rhinoplasty'] },
    { title: 'Face', desc: 'Restoring youth and harmony.', page: 'Face', img: 'https://images.unsplash.com/photo-1764265923632-b2126ec0dedc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd29tYW4lMjBmYWNlJTIwcG9ydHJhaXQlMjBsdXh1cnklMjBiZWF1dHl8ZW58MXx8fHwxNzcxOTc3NDU3fDA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Facelift', 'Browlift', 'Eyelid Surgery', 'Neck Lift', 'Otoplasty', 'Neck and Jawline Shaping with Liposuction'] },
    { title: 'Breast', desc: 'Enhancing shape and volume.', page: 'Breast', img: 'https://images.unsplash.com/photo-1768609957045-591c79431f48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd29tYW4lMjBzaWxob3VldHRlJTIwYmVhdXR5JTIwbHV4dXJ5fGVufDF8fHx8MTc3MTk3NzQ1OHww&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Augmentation', 'Lift/Reduction', 'Lift/Augmentation', 'Lift/Auto-Augmentation', 'Revision', 'Fatgrafting'] },
    { title: 'Body', desc: 'Sculpting your ideal contour.', page: 'Body', img: 'https://images.unsplash.com/photo-1646932520067-81bdc09af07a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXQlMjB3b21hbiUyMGJvZHklMjBjb250b3VyJTIwZWxlZ2FudCUyMGx1eHVyeXxlbnwxfHx8fDE3NzE5Nzc0NTh8MA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Abdominoplasty (Tummy Tuck)', 'Liposuction', 'Body Lift', 'Mommy Makeover', 'Brachioplasty (Arm Lift)', 'Thigh Lift'] },
  ];

  // Load hero image positions from database
  useEffect(() => {
    loadHeroPositions();
    loadServiceImages();
  }, []);

  const loadServiceImages = async () => {
    const imageUrls: Record<string, string> = {};
    
    for (const service of serviceCards) {
      const contentKey = `service_card_${service.title.toLowerCase()}`;
      try {
        const response = await fetch(`${serverUrl}/content/${contentKey}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        const data = await response.json();
        if (data.content?.value) {
          imageUrls[service.title] = data.content.value;
        }
      } catch (error) {
        console.error(`Error loading ${service.title} service image:`, error);
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
        const featured = all.filter((c: any) => c.featuredOnHome);
        console.log('[Home] Loaded', featured.length, 'featured items from cache');
        setFeaturedGallery(featured);
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
        const filenameRegex = /^(.*)_p(\d+)_img(\d+)\.(png|jpg|jpeg)$/;
        const casesMap = new Map<string, any>();

        filesData.files
          .filter((f: any) => f.type === 'file' && /\.(png|jpg|jpeg)$/i.test(f.name))
          .forEach((f: any) => {
            const m = f.name.match(filenameRegex);
            if (!m) return;
            const [, slug, , idxStr] = m;
            const type = parseInt(idxStr) % 2 !== 0 ? 'before' : 'after';
            const repoPath = f.path || `gallery/${f.name}`;
            const imageUrl = `${GITHUB_RAW}/${repoPath}`;
            if (!casesMap.has(slug)) {
              casesMap.set(slug, {
                slug, id: slug,
                title: slug.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                category: f.category || 'Face', procedure: '', journeyNote: '',
              });
            }
            const c = casesMap.get(slug);
            if (type === 'before' && !c.beforeImage) c.beforeImage = imageUrl;
            if (type === 'after' && !c.afterImage) c.afterImage = imageUrl;
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
          };
        });
      } else {
        // GitHub unavailable — fall back to DB-only
        allItems = dbCases.map((c: any) => ({
          ...c,
          beforeImage: normalizeImageUrl(c.beforeImage),
          afterImage: normalizeImageUrl(c.afterImage),
        }));
      }

      // Cache results for other pages to reuse
      localStorage.setItem(cacheKey, JSON.stringify(allItems));
      localStorage.setItem(tsKey, Date.now().toString());

      const featured = allItems.filter((c: any) => c.featuredOnHome);
      console.log('[Home] Loaded', featured.length, 'featured items from GitHub');
      setFeaturedGallery(featured);
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
    const serviceCards = [
      { title: 'Nose' },
      { title: 'Face' },
      { title: 'Breast' },
      { title: 'Body' }
    ];
    const totalCards = serviceCards.length;
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
    setCurrentLightboxIndex((prev) => (prev + 1) % featuredGallery.length);
  };

  const handlePreviousImage = () => {
    setCurrentLightboxIndex((prev) => (prev - 1 + featuredGallery.length) % featuredGallery.length);
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
            
            {/* Desktop images - landscape, high res - STATIC FROM PUBLIC FOLDER */}
            <div className="hidden md:block absolute inset-0 w-full h-full z-0 bg-gray-400">
              <img
                src="/images/hero/desktop/hero-slide-1.jpg"
                alt="Hanemann Plastic Surgery Hero"
                className="w-full h-full object-cover"
                style={{ objectPosition: heroDesktopPosition }}
                onError={(e) => {
                  // Hide image on error, showing gray background
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
            </div>
            
            {/* Mobile images - portrait optimized - STATIC FROM PUBLIC FOLDER */}
            <div className="md:hidden absolute inset-0 w-full h-full z-0 bg-gray-400">
              <img
                src="/images/hero/mobile/hero-slide-1.jpg"
                alt="Hanemann Plastic Surgery Hero Mobile"
                className="w-full h-full object-cover"
                style={{ objectPosition: heroMobilePosition }}
                onError={(e) => {
                  // Hide image on error, showing gray background
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
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
                    <EditableText as="span" contentKey="home_hero_subtitle_1" defaultValue="Recognizing that each patient's goal is unique, Dr. Hanemann offers creative solutions for his patients, utilizing the latest technology and procedures to achieve desired results" />
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

      {/* Trust Bar - Credentials */}
      <section className="bg-[#1a1f2e] py-16 md:py-20 border-b border-[#2d3548] mt-12 md:mt-16">
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
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
              {/* American Society of Plastic Surgeons */}
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="h-28 md:h-32 w-36 md:w-44 flex items-center justify-center rounded-xl bg-[#faf9f7] shadow-lg shadow-black/20 group-hover:shadow-xl group-hover:shadow-[#c9b896]/15 border border-[#c9b896]/20 group-hover:border-[#c9b896]/50 transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.03]">
                  <img
                    src="/images/certifications/cert-logo-1.png"
                    alt="American Society of Plastic Surgeons"
                    className="h-20 md:h-24 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="mt-3 text-[11px] text-[#c9b896] font-semibold uppercase tracking-wider">ASPS</span>
                <span className="mt-0.5 text-[10px] text-gray-400 text-center max-w-[140px] leading-tight">American Society of Plastic Surgeons</span>
              </div>
              
              {/* American Board of Plastic Surgery */}
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="h-28 md:h-32 w-36 md:w-44 flex items-center justify-center rounded-xl bg-[#faf9f7] shadow-lg shadow-black/20 group-hover:shadow-xl group-hover:shadow-[#c9b896]/15 border border-[#c9b896]/20 group-hover:border-[#c9b896]/50 transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.03]">
                  <img
                    src="/images/certifications/cert-logo-2.png"
                    alt="American Board of Plastic Surgery"
                    className="h-20 md:h-24 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="mt-3 text-[11px] text-[#c9b896] font-semibold uppercase tracking-wider">ABPS</span>
                <span className="mt-0.5 text-[10px] text-gray-400 text-center max-w-[140px] leading-tight">American Board of Plastic Surgery</span>
              </div>
              
              {/* American Board of Otolaryngology */}
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="h-28 md:h-32 w-36 md:w-44 flex items-center justify-center rounded-xl bg-[#faf9f7] shadow-lg shadow-black/20 group-hover:shadow-xl group-hover:shadow-[#c9b896]/15 border border-[#c9b896]/20 group-hover:border-[#c9b896]/50 transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.03]">
                  <img
                    src="/images/certifications/cert-logo-3.png"
                    alt="American Board of Otolaryngology"
                    className="h-20 md:h-24 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="mt-3 text-[11px] text-[#c9b896] font-semibold uppercase tracking-wider">ABOto</span>
                <span className="mt-0.5 text-[10px] text-gray-400 text-center max-w-[140px] leading-tight">American Board of Otolaryngology</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-24 bg-cream">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left Content Section - ONLY ON DESKTOP */}
            <div className="hidden lg:block lg:col-span-2 space-y-8">
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
                  onClick={() => onNavigate('Procedures')}
                  className="bg-transparent border-2 border-secondary text-secondary hover:bg-secondary hover:text-white px-8 py-3 text-sm uppercase tracking-[0.2em] transition-all duration-300"
                >
                  View All Services
                </button>
              </div>
            </div>

            {/* Right Carousel Section - DESKTOP ONLY */}
            <div className="hidden lg:block lg:col-span-3 relative h-[600px]">
              <div className="relative overflow-hidden h-full w-[850px] mx-auto">
                {/* Carousel Container */}
                <div className="flex gap-4 overflow-x-auto lg:overflow-x-hidden scrollbar-hide snap-x snap-mandatory h-full touch-pan-x" ref={carouselRef}>
                  {/* Render three sets for seamless infinite loop */}
                  {[...serviceCards, ...serviceCards, ...serviceCards].map((service, index) => {
                    const resolvedSrc = failedServiceImages.has(service.title) 
                      ? undefined 
                      : (serviceImages[service.title] || service.img);
                    
                    return (
                    <div
                      key={`${service.title}-${index}`}
                      className="flex-shrink-0 w-80 md:w-96 snap-center group relative h-full"
                    >
                      {/* Background Image */}
                      <div className="absolute inset-0 overflow-hidden bg-gray-400">
                        {resolvedSrc && (
                          <img
                            src={resolvedSrc}
                            alt={service.title}
                            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                            onError={() => {
                              // Track failed images in state so ALL instances of this card are consistent
                              setFailedServiceImages(prev => new Set([...prev, service.title]));
                            }}
                          />
                        )}
                      </div>

                      {/* Clickable overlay for navigation */}
                      <div 
                        className="absolute inset-0 cursor-pointer" 
                        onClick={() => onNavigate(service.page)}
                      />

                      {/* Dark Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 group-hover:from-black/80 group-hover:via-black/50 group-hover:to-black/20 transition-all duration-500" />

                      {/* Category Title - Centered */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <h3 className="font-serif text-5xl md:text-6xl text-white italic group-hover:scale-110 transition-transform duration-500">
                          {service.title.toUpperCase()}
                        </h3>
                      </div>

                      {/* Hover Content - Bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
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
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    </div>
                    );
                  })}
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const container = e.currentTarget.parentElement?.querySelector('.overflow-x-auto');
                    if (container) {
                      container.scrollBy({ left: -320, behavior: 'smooth' });
                    }
                  }}
                  className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-white transition-all duration-300 hover:scale-110 z-10"
                  aria-label="Previous"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const container = e.currentTarget.parentElement?.querySelector('.overflow-x-auto');
                    if (container) {
                      container.scrollBy({ left: 320, behavior: 'smooth' });
                    }
                  }}
                  className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-white transition-all duration-300 hover:scale-110 z-10"
                  aria-label="Next"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {/* Mobile: Expandable Accordion List - ONLY SHOWN ON MOBILE */}
            <div className="lg:hidden space-y-4">{serviceCards.map((service) => (
              <div key={service.title} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                {/* Collapsible Header */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedService(expandedService === service.title ? null : service.title);
                  }}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-xl font-serif text-primary mb-1">{service.title}</h3>
                    <p className="text-sm text-gray-600">{service.desc}</p>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-secondary transition-transform duration-300 flex-shrink-0 ml-3 ${
                      expandedService === service.title ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {/* Expandable Content */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ${
                    expandedService === service.title ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                    <h4 className="text-xs uppercase tracking-wider text-secondary font-bold mb-3">Procedures</h4>
                    <ul className="space-y-2">
                      {service.procedures.map((procedure, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-secondary mr-2 flex-shrink-0">•</span>
                          <span className="text-gray-700 text-sm leading-relaxed">{procedure}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => onNavigate(service.page)}
                      className="mt-4 w-full bg-secondary text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-primary transition-colors"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
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
                  <p className="text-sm text-gray-500">Voted top surgeon 5 years running</p>
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
              className="hidden md:inline-flex items-center gap-2 text-secondary hover:text-white transition-colors"
            >
              View Full Gallery <ArrowRight size={16}/>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredGallery.length > 0 ? (
              <>
                {featuredGallery.slice(0, 6).map((c, index) => (
                  <BeforeAfterCard
                    key={c.id}
                    beforeImage={c.beforeImage}
                    afterImage={c.afterImage}
                    category={c.category}
                    title={c.title}
                    onClick={() => handleOpenLightbox(index)}
                    interval={3000}
                  />
                ))}
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
              className="inline-block border border-secondary text-secondary px-8 py-3 rounded-full"
            >
              View Full Gallery
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-cream">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <Star className="w-8 h-8 text-secondary mx-auto mb-6 fill-current" />
          <h2 className="font-serif text-3xl md:text-5xl text-primary mb-12 leading-tight">
            <EditableText 
              as="span"
              contentKey="testimonial_hero" 
              defaultValue="Dr. Hanemann changed my life. The results are so natural, no one knows I had surgery, they just tell me I look great." 
              multiline
            />
          </h2>
          <div className="flex justify-center items-center gap-4">
            <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center text-secondary font-serif font-bold text-xl">S</div>
            <div className="text-left">
              <p className="font-bold text-primary">
                <EditableText contentKey="testimonial_author" defaultValue="Sarah M." as="span" />
              </p>
              <p className="text-xs text-gray-500">
                <EditableText contentKey="testimonial_author_detail" defaultValue="Rhinoplasty Patient" as="span" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && featuredGallery.length > 0 && (
        <GalleryLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          currentItem={featuredGallery[currentLightboxIndex]}
          currentIndex={currentLightboxIndex}
          totalImages={featuredGallery.length}
          onNext={handleNextImage}
          onPrevious={handlePreviousImage}
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
