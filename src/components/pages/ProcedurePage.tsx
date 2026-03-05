import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Clock, Shield, CheckCircle } from 'lucide-react';
import { EditableImage } from '../cms/EditableImage';
import { BeforeAfterCardWithCard } from '../BeforeAfterCardWithCard';
import { GalleryLightbox } from '../GalleryLightbox';
import { SEOHead } from '../seo/SEOHead';
import { Breadcrumbs } from '../seo/Breadcrumbs';
import { FAQSection } from '../seo/FAQSection';
import { getProcedureSEO } from '../data/procedureSEO';
import { motion } from 'motion/react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface ProcedureData {
  title: string;
  subtitle: string;
  hero: string;
  overview: string;
  procedures: Array<{ name: string; description: string }>;
  benefits: string[];
  processSteps: Array<{ title: string; description: string }>;
  faqs: Array<{ question: string; answer: string }>;
  recoveryTime: string;
  anesthesia: string;
}

interface GalleryItem {
  id: number;
  category: string;
  title: string;
  procedure: string;
  journeyNote: string;
  beforeImage?: string;
  afterImage?: string;
}

interface ProcedurePageProps {
  data: ProcedureData;
  procedureType: 'nose' | 'face' | 'breast' | 'body';
  onNavigate: (page: string) => void;
}

export function ProcedurePage({ data, procedureType, onNavigate }: ProcedurePageProps) {
  // Get SEO-optimized data
  const seoData = getProcedureSEO(procedureType);
  
  const [featuredGallery, setFeaturedGallery] = useState<GalleryItem[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);
  
  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;
  
  // Map procedure type to flag name
  const flagMap = {
    'nose': 'showOnNose',
    'face': 'showOnFace',
    'breast': 'showOnBreast',
    'body': 'showOnBody'
  };
  
  const featureFlag = flagMap[procedureType];
  
  // Base gallery items (same as Gallery page)
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
  }, [procedureType]);

  // ─── Gallery constants (mirrors Gallery.tsx) ───────────────────────────────
  const GITHUB_RAW = 'https://raw.githubusercontent.com/Nesbit25/HPS-WEB-FEBRUARY/main';
  const CACHE_DURATION = 30 * 60 * 1000;

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
      console.log(`[${procedureType}] Loading featured gallery for flag: ${featureFlag}`);

      // 1. Try shared localStorage cache (populated by Gallery page)
      const cacheKey = 'gallery_items_cache';
      const tsKey = 'gallery_items_cache_timestamp';
      const cached = localStorage.getItem(cacheKey);
      const ts = localStorage.getItem(tsKey);

      if (cached && ts && Date.now() - parseInt(ts) < CACHE_DURATION) {
        const all: GalleryItem[] = JSON.parse(cached);
        const featured = all.filter((c: any) => c[featureFlag]);
        console.log(`[${procedureType}] Loaded ${featured.length} items from cache (flag: ${featureFlag})`);
        setFeaturedGallery(featured);
        return;
      }

      // 2. No valid cache — fetch from GitHub + DB in parallel
      console.log(`[${procedureType}] No cache — fetching from GitHub + DB...`);
      const [filesRes, casesRes] = await Promise.all([
        fetch(`${serverUrl}/gallery/github-files?t=${Date.now()}`),
        fetch(`${serverUrl}/gallery/cases`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } })
      ]);
      const filesData = await filesRes.json();
      const casesData = await casesRes.json();
      const dbCases: any[] = casesData.cases || [];

      let allItems: GalleryItem[];

      if (filesData.files?.length) {
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
        // GitHub unavailable — DB-only fallback
        allItems = dbCases.map((c: any) => ({
          ...c,
          beforeImage: normalizeImageUrl(c.beforeImage),
          afterImage: normalizeImageUrl(c.afterImage),
        }));
      }

      // Cache for other pages to reuse
      localStorage.setItem(cacheKey, JSON.stringify(allItems));
      localStorage.setItem(tsKey, Date.now().toString());

      const featured = allItems.filter((c: any) => c[featureFlag]);
      console.log(`[${procedureType}] Loaded ${featured.length} items from GitHub (flag: ${featureFlag})`);
      setFeaturedGallery(featured);
    } catch (error) {
      console.error(`[${procedureType}] Error loading featured gallery:`, error);
      setFeaturedGallery([]);
    }
  };
  
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
      {/* SEO Head - Using SEO-optimized data */}
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonical={seoData.canonical}
      />
      
      {/* Breadcrumbs - Using SEO data */}
      <Breadcrumbs items={seoData.breadcrumbs} />
      
      {/* Page Hero */}
      

      {/* Overview Section */}
      <section className="py-24 bg-[#1a1f2e] relative overflow-hidden">
        {/* Ambient background elements */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#b8976a]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="mb-6 text-[#faf9f7]">Overview</h2>
              <p className="text-gray-300 mb-6">{data.overview}</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <motion.div 
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -4 }}
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Clock className="w-5 h-5 text-[#c9b896] mt-1 flex-shrink-0" />
                  </motion.div>
                  <div>
                    <p className="mb-1 text-[#faf9f7]">Recovery Time</p>
                    <p className="text-gray-400">{data.recoveryTime}</p>
                  </div>
                </motion.div>
                <motion.div 
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Shield className="w-5 h-5 text-[#c9b896] mt-1 flex-shrink-0" />
                  </motion.div>
                  <div>
                    <p className="mb-1 text-[#faf9f7]">Anesthesia</p>
                    <p className="text-gray-400">{data.anesthesia}</p>
                  </div>
                </motion.div>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="rounded-full bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] shadow-lg hover:shadow-[#c9b896]/20 transition-all duration-300"
                  onClick={() => onNavigate('Contact')}
                >
                  Schedule a Consultation
                </Button>
              </motion.div>
            </motion.div>
            <motion.div 
              className="aspect-[4/5] relative shadow-2xl group"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Gold corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#c9b896]/30 to-transparent rounded-2xl"></div>
              </div>
              
              <EditableImage
                contentKey={`procedure_${procedureType}_hero`}
                defaultSrc={
                  procedureType === 'nose' ? 'https://images.unsplash.com/photo-1759813641406-980519f58b1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaGlub3BsYXN0eSUyMG5vc2UlMjBzdXJnZXJ5fGVufDF8fHx8MTc2MzU3ODM0MHww&ixlib=rb-4.1.0&q=80&w=1080' :
                  procedureType === 'face' ? 'https://images.unsplash.com/photo-1622399591207-269e63936861?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYWNlbGlmdCUyMGZhY2lhbCUyMHN1cmdlcnl8ZW58MXx8fHwxNzYzNTc4MzQxfDA&ixlib=rb-4.1.0&q=80&w=1080' :
                  procedureType === 'breast' ? 'https://images.unsplash.com/photo-1621021544363-02108c715c1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmVhc3QlMjBzdXJnZXJ5JTIwbWVkaWNhbHxlbnwxfHx8fDE3NjM1NzgzNDF8MA&ixlib=rb-4.1.0&q=80&w=1080' :
                  'https://images.unsplash.com/photo-1728106700436-463b132d0768?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib2R5JTIwY29udG91cmluZyUyMHN1cmdlcnl8ZW58MXx8fHwxNzYzNTc4MzQxfDA&ixlib=rb-4.1.0&q=80&w=1080'
                }
                alt={data.title}
                className="w-full h-full object-cover rounded-2xl"
                locationLabel={`${data.title} Page - Hero Image`}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Procedures Section */}
      <section className="py-24 bg-gradient-to-b from-[#1a1f2e] to-[#242938] border-t border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4 text-[#faf9f7]">Available Procedures</h2>
            <p className="text-gray-400">
              Customized treatments to address your specific concerns and goals
            </p>
            
            {/* Gold accent divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent mx-auto mt-6"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.procedures.map((procedure, index) => (
              <motion.div
                key={procedure.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="border-[#2d3548] bg-[#1a1f2e]/50 backdrop-blur rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-[#c9b896]/10 transition-all duration-300 group relative overflow-hidden h-full">
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c9b896]/0 to-[#c9b896]/0 group-hover:from-[#c9b896]/5 group-hover:to-transparent transition-all duration-500"></div>
                  
                  <CardContent className="p-8 relative z-10">
                    <h3 className="mb-4 text-[#faf9f7]">{procedure.name}</h3>
                    <p className="text-gray-300">{procedure.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-[#1a1f2e] border-t border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4 text-[#faf9f7]">Benefits</h2>
            <p className="text-gray-400">
              What you can expect from your procedure
            </p>
            
            {/* Gold accent divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent mx-auto mt-6"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.benefits.map((benefit, index) => (
              <motion.div 
                key={index} 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ x: 4 }}
              >
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle className="w-6 h-6 text-[#c9b896] flex-shrink-0 mt-1" />
                </motion.div>
                <p className="text-gray-300">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-gradient-to-b from-[#1a1f2e] to-[#242938] border-t border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4 text-[#faf9f7]">Your Journey</h2>
            <p className="text-gray-400">
              What to expect from consultation to recovery
            </p>
            
            {/* Gold accent divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent mx-auto mt-6"></div>
          </motion.div>

          <div className="space-y-8">
            {data.processSteps.map((step, index) => (
              <motion.div 
                key={index} 
                className="flex gap-6"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ x: 8 }}
              >
                <motion.div 
                  className="flex-shrink-0 w-12 h-12 bg-[#c9b896] text-[#1a1f2e] rounded-full flex items-center justify-center font-semibold shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {index + 1}
                </motion.div>
                <div className="flex-1">
                  <h3 className="mb-2 text-[#faf9f7]">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before & After Gallery */}
      <section className="py-24 bg-[#1a1f2e] border-t border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4 text-[#faf9f7]">Before & After Results</h2>
            <p className="text-gray-400">Real results from real patients</p>
            
            {/* Gold accent divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent mx-auto mt-6"></div>
          </motion.div>

          {featuredGallery.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
              {featuredGallery.map((item, index) => (
                <BeforeAfterCardWithCard
                  key={item.id}
                  beforeImage={item.beforeImage}
                  afterImage={item.afterImage}
                  title={item.title}
                  procedure={item.procedure}
                  onClick={() => handleOpenLightbox(index)}
                  interval={3000}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No featured results yet. Check back soon!</p>
            </div>
          )}

          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full border-[#c9b896] text-[#c9b896] hover:bg-[#c9b896] hover:text-[#1a1f2e]"
              onClick={() => onNavigate('Gallery')}
            >
              View Full Gallery
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section - Using SEO-optimized FAQSection with schema */}
      <FAQSection 
        procedureName={seoData.schema.name}
        faqs={seoData.faqs}
      />

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-[#242938] to-[#1a1f2e] border-t border-[#2d3548] relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.h2 
            className="mb-6 text-[#faf9f7]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Ready to Take the Next Step?
          </motion.h2>
          <motion.p 
            className="text-gray-300 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Schedule a consultation to discuss your goals and learn how we can help you achieve the results you desire
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              className="rounded-full px-12 bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] shadow-lg hover:shadow-[#c9b896]/20 transition-all duration-300"
              onClick={() => onNavigate('Contact')}
            >
              Schedule Your Consultation
            </Button>
          </motion.div>
        </div>
      </section>
      
      {/* Lightbox for Before & After Gallery */}
      <GalleryLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        currentItem={featuredGallery[currentLightboxIndex] || null}
        onNext={handleNextImage}
        onPrevious={handlePreviousImage}
        totalImages={featuredGallery.length}
        currentIndex={currentLightboxIndex}
      />
    </div>
  );
}