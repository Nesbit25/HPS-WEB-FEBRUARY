import React, { useState, useEffect } from 'react';
import { EditableText } from '../cms/EditableText';
import { EditableImage } from '../cms/EditableImage';
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
}

export function Home({ onNavigate, onOpenConsultation, heroPositionRequest, onHeroPositionHandled }: HomeProps) {
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
  const [heroDesktopPosition, setHeroDesktopPosition] = useState('center center');
  const [heroMobilePosition, setHeroMobilePosition] = useState('center 30%');

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  // Load hero image positions from database
  useEffect(() => {
    loadHeroPositions();
  }, []);

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

  const loadFeaturedGallery = async () => {
    try {
      const casesResponse = await fetch(`${serverUrl}/gallery/cases`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const casesData = await casesResponse.json();
      const customCases = casesData.cases || [];
      
      // Create a map of database cases by ID for easy lookup
      const dbCasesMap = new Map();
      customCases.forEach(caseData => {
        if (caseData.id) {
          dbCasesMap.set(caseData.id, caseData);
        }
      });
      
      // Merge base items with their database flags (if they exist)
      const mergedBaseItems = baseGalleryItems.map(baseItem => {
        const dbCase = dbCasesMap.get(baseItem.id);
        if (dbCase) {
          // Merge base item with database flags
          return {
            ...baseItem,
            featuredOnHome: dbCase.featuredOnHome || false
          };
        }
        return baseItem;
      });
      
      // Get only custom cases (IDs >= 1000) that aren't base items
      const customOnlyCases = customCases.filter(c => c.id >= 1000);
      
      // Merge base items (with flags) and custom cases
      const allItems = [...mergedBaseItems, ...customOnlyCases];
      
      // Filter for featured on home page
      const featuredCases = allItems.filter((c: any) => c.featuredOnHome);
      
      const updatedItems = await Promise.all(
        featuredCases.map(async (item: any) => {
          const beforeResponse = await fetch(`${serverUrl}/content/gallery_${item.id}_before`, {
            headers: { 'Authorization': `Bearer ${publicAnonKey}` }
          });
          const beforeData = await beforeResponse.json();
          const beforeImage = beforeData.content?.value;

          const afterResponse = await fetch(`${serverUrl}/content/gallery_${item.id}_after`, {
            headers: { 'Authorization': `Bearer ${publicAnonKey}` }
          });
          const afterData = await afterResponse.json();
          const afterImage = afterData.content?.value;

          return { ...item, beforeImage, afterImage };
        })
      );
      
      setFeaturedGallery(updatedItems);
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
            <div className="hidden md:block absolute inset-0 w-full h-full z-0">
              <img
                src="/images/hero/desktop/hero-slide-1.jpg"
                alt="Hanemann Plastic Surgery Hero"
                className="w-full h-full object-cover"
                style={{ objectPosition: heroDesktopPosition }}
                onError={(e) => {
                  // Fallback to PNG if JPG doesn't exist
                  const img = e.target as HTMLImageElement;
                  if (img.src.endsWith('.jpg')) {
                    img.src = '/images/hero/desktop/hero-slide-1.png';
                  }
                }}
              />
            </div>
            
            {/* Mobile images - portrait optimized - STATIC FROM PUBLIC FOLDER */}
            <div className="md:hidden absolute inset-0 w-full h-full z-0">
              <img
                src="/images/hero/mobile/hero-slide-1.jpg"
                alt="Hanemann Plastic Surgery Hero Mobile"
                className="w-full h-full object-cover"
                style={{ objectPosition: heroMobilePosition }}
                onError={(e) => {
                  // Fallback to PNG if JPG doesn't exist
                  const img = e.target as HTMLImageElement;
                  if (img.src.endsWith('.jpg')) {
                    img.src = '/images/hero/mobile/hero-slide-1.png';
                  }
                }}
              />
            </div>

            {/* Dark gradient overlay - allow pointer events to pass through in edit mode */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-5 pointer-events-none" />
          </div>
          
          {/* Content Overlay - positioned over images */}
          <div className="absolute inset-0 z-20 flex items-center px-4 md:px-6 pt-[180px] pointer-events-none">
            <div className="container mx-auto pointer-events-auto">
              <div className="max-w-3xl">
                {/* Hero Content */}
                <div>
                  <h2 className="text-secondary text-xs md:text-sm lg:text-base uppercase tracking-[0.3em] mb-3 md:mb-4 font-bold">
                    <EditableText contentKey="hero_label_1" defaultValue="Double Board Certified Plastic Surgeon" />
                  </h2>
                  <h1 className="text-3xl md:text-5xl lg:text-7xl font-serif text-white mb-4 md:mb-6 leading-tight">
                    <EditableText contentKey="home_hero_title_1" defaultValue="Revealing Beauty" />
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
                  {[
                    ...[
                      { title: 'Nose', desc: 'Refining profile and function.', page: 'Nose', img: 'https://images.unsplash.com/photo-1758101512269-660feabf64fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwbWVkaWNhbCUyMG9mZmljZXxlbnwxfHx8fDE3NjM1MTQ1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Open Rhinoplasty', 'Closed Rhinoplasty', 'Nasal Reconstruction', 'Revision Rhinoplasty', 'Ethnic Rhinoplasty'] },
                      { title: 'Face', desc: 'Restoring youth and harmony.', page: 'Face', img: 'https://images.unsplash.com/photo-1598448056086-307e98ef5c4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjbGluaWMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjM1MTQ1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Facelift', 'Brow Lift', 'Facial Rejuvenation', 'Eyelid Surgery', 'Neck Lift'] },
                      { title: 'Breast', desc: 'Enhancing shape and volume.', page: 'Breast', img: 'https://images.unsplash.com/photo-1763149191834-471c980404f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtZWRpY2FsJTIwZmFjaWxpdHl8ZW58MXx8fHwxNjM0MjMyOTR8MA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Breast Augmentation', 'Breast Lift', 'Breast Reconstruction', 'Breast Reduction', 'Breast Revision'] },
                      { title: 'Body', desc: 'Sculpting your ideal contour.', page: 'Body', img: 'https://images.unsplash.com/photo-1758691461516-7e716e0ca135?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFsdGhjYXJlJTIwZW52aXJvbm1lbnR8ZW58MXx8fHwxNzYzNTE0NTg4fDA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Liposuction', 'Tummy Tuck', 'Body Contouring', 'Brazilian Butt Lift', 'Arm Lift'] },
                    ],
                    ...[
                      { title: 'Nose', desc: 'Refining profile and function.', page: 'Nose', img: 'https://images.unsplash.com/photo-1758101512269-660feabf64fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwbWVkaWNhbCUyMG9mZmljZXxlbnwxfHx8fDE3NjM1MTQ1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Open Rhinoplasty', 'Closed Rhinoplasty', 'Nasal Reconstruction', 'Revision Rhinoplasty', 'Ethnic Rhinoplasty'] },
                      { title: 'Face', desc: 'Restoring youth and harmony.', page: 'Face', img: 'https://images.unsplash.com/photo-1598448056086-307e98ef5c4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjbGluaWMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjM1MTQ1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Facelift', 'Brow Lift', 'Facial Rejuvenation', 'Eyelid Surgery', 'Neck Lift'] },
                      { title: 'Breast', desc: 'Enhancing shape and volume.', page: 'Breast', img: 'https://images.unsplash.com/photo-1763149191834-471c980404f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtZWRpY2FsJTIwZmFjaWxpdHl8ZW58MXx8fHwxNjM0MjMyOTR8MA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Breast Augmentation', 'Breast Lift', 'Breast Reconstruction', 'Breast Reduction', 'Breast Revision'] },
                      { title: 'Body', desc: 'Sculpting your ideal contour.', page: 'Body', img: 'https://images.unsplash.com/photo-1758691461516-7e716e0ca135?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFsdGhjYXJlJTIwZW52aXJvbm1lbnR8ZW58MXx8fHwxNzYzNTE0NTg4fDA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Liposuction', 'Tummy Tuck', 'Body Contouring', 'Brazilian Butt Lift', 'Arm Lift'] },
                    ],
                    ...[
                      { title: 'Nose', desc: 'Refining profile and function.', page: 'Nose', img: 'https://images.unsplash.com/photo-1758101512269-660feabf64fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwbWVkaWNhbCUyMG9mZmljZXxlbnwxfHx8fDE3NjM1MTQ1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Open Rhinoplasty', 'Closed Rhinoplasty', 'Nasal Reconstruction', 'Revision Rhinoplasty', 'Ethnic Rhinoplasty'] },
                      { title: 'Face', desc: 'Restoring youth and harmony.', page: 'Face', img: 'https://images.unsplash.com/photo-1598448056086-307e98ef5c4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjbGluaWMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjM1MTQ1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Facelift', 'Brow Lift', 'Facial Rejuvenation', 'Eyelid Surgery', 'Neck Lift'] },
                      { title: 'Breast', desc: 'Enhancing shape and volume.', page: 'Breast', img: 'https://images.unsplash.com/photo-1763149191834-471c980404f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtZWRpY2FsJTIwZmFjaWxpdHl8ZW58MXx8fHwxNjM0MjMyOTR8MA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Breast Augmentation', 'Breast Lift', 'Breast Reconstruction', 'Breast Reduction', 'Breast Revision'] },
                      { title: 'Body', desc: 'Sculpting your ideal contour.', page: 'Body', img: 'https://images.unsplash.com/photo-1758691461516-7e716e0ca135?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFsdGhjYXJlJTIwZW52aXJvbm1lbnR8ZW58MXx8fHwxNzYzNTE0NTg4fDA&ixlib=rb-4.1.0&q=80&w=1080', procedures: ['Liposuction', 'Tummy Tuck', 'Body Contouring', 'Brazilian Butt Lift', 'Arm Lift'] },
                    ]
                  ].map((service, index) => (
                    <div
                      key={`${service.title}-${index}`}
                      className="flex-shrink-0 w-80 md:w-96 snap-center group relative h-full"
                    >
                      {/* Background Image */}
                      <div className="absolute inset-0 overflow-hidden">
                        <EditableImage
                          contentKey={`service_card_${service.title.toLowerCase()}`}
                          defaultSrc={service.img}
                          alt={service.title}
                          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                          locationLabel={`${service.title} Service Card`}
                          cropAspectRatio={0.65}
                        />
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
                  ))}
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
            <div className="lg:hidden space-y-4">{[
              { title: 'Nose', desc: 'Refining profile and function.', page: 'Nose', procedures: ['Open Rhinoplasty', 'Closed Rhinoplasty', 'Nasal Reconstruction', 'Revision Rhinoplasty', 'Ethnic Rhinoplasty'] },
              { title: 'Face', desc: 'Restoring youth and harmony.', page: 'Face', procedures: ['Facelift', 'Brow Lift', 'Facial Rejuvenation', 'Eyelid Surgery', 'Neck Lift'] },
              { title: 'Breast', desc: 'Enhancing shape and volume.', page: 'Breast', procedures: ['Breast Augmentation', 'Breast Lift', 'Breast Reconstruction', 'Breast Reduction', 'Breast Revision'] },
              { title: 'Body', desc: 'Sculpting your ideal contour.', page: 'Body', procedures: ['Liposuction', 'Tummy Tuck', 'Body Contouring', 'Brazilian Butt Lift', 'Arm Lift'] },
            ].map((service) => (
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
            <EditableImage 
              contentKey="intro_image" 
              defaultSrc="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkb2N0b3J8ZW58MXx8fHwxNzYzNTE0NTg5fDA&ixlib=rb-4.1.0&q=80&w=1080" 
              alt="Dr. Hanemann" 
              className="rounded-lg shadow-2xl relative z-10"
              locationLabel="Home - Introduction Section"
            />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-4 border-r-4 border-secondary z-0"></div>
          </div>
          <div>
            <h4 className="text-secondary font-bold uppercase tracking-widest mb-2">The Surgeon</h4>
            <h2 className="font-serif text-4xl lg:text-5xl text-primary mb-6">
              <EditableText contentKey="intro_heading" defaultValue="Meet Dr. Hanemann" />
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
                <EditableText contentKey="home_gallery_heading" defaultValue="Real Results" />
              </h2>
              <p className="text-gray-400">
                <EditableText contentKey="home_gallery_description" defaultValue="Browse our extensive gallery of patient transformations." />
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
    </div>
  );
}