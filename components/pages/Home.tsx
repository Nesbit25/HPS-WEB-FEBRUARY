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

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  // Service card data
  const serviceCards = [
    { title: 'Nose', desc: 'Refining profile and function.', page: 'Nose', img: '/images/services/nose.png', procedures: ['Rhinoplasty', 'Revision Rhinoplasty', 'Ethnic Rhinoplasty'] },
    { title: 'Face', desc: 'Restoring youth and harmony.', page: 'Face', img: '/images/services/face.png', procedures: ['Facelift', 'Browlift', 'Eyelid Surgery', 'Neck Lift', 'Otoplasty', 'Neck and Jawline Shaping with Liposuction'] },
    { title: 'Breast', desc: 'Enhancing shape and volume.', page: 'Breast', img: '/images/services/breast.png', procedures: ['Augmentation', 'Lift/Reduction', 'Lift/Augmentation', 'Lift/Auto-Augmentation', 'Revision', 'Fatgrafting'] },
    { title: 'Body', desc: 'Sculpting your ideal contour.', page: 'Body', img: '/images/services/Body.jpeg', procedures: ['Abdominoplasty (Tummy Tuck)', 'Liposuction', 'Body Lift', 'Mommy Makeover', 'Brachioplasty (Arm Lift)', 'Thigh Lift'] },
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
  };