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