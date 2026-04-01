import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface GalleryLandingProps {
  onNavigate: (page: string) => void;
}

const GALLERY_CATEGORIES = [
  {
    key: 'Breast',
    title: 'Breast',
    subtitle: 'Augmentation, Lift, Reduction & More',
    // Fallback — overridden by Supabase image if available
    fallbackImage: 'https://images.unsplash.com/photo-1768609957045-591c79431f48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    procedures: [
      { label: 'Breast Augmentation', slug: 'Breast Augmentation' },
      { label: 'Breast Aug + Lift', slug: 'Breast Aug + Lift' },
      { label: 'Breast Lift', slug: 'Breast Lift' },
      { label: 'Breast Reduction', slug: 'Breast Reduction' },
      { label: 'Tuberous Breast', slug: 'Tuberous Breast' },
      { label: 'Explant / Mastopexy', slug: 'Explant / Mastopexy' },
      { label: 'Asymmetrical Breast', slug: 'Asymmetrical Breast' },
      { label: 'Gynecomastia', slug: 'Gynecomastia' },
      { label: 'FTM Top Surgery', slug: 'FTM Top Surgery' },
    ],
  },
  {
    key: 'Body',
    title: 'Body',
    subtitle: 'Tummy Tuck, Liposuction, Contouring & More',
    fallbackImage: 'https://images.unsplash.com/photo-1646932520067-81bdc09af07a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    procedures: [
      { label: 'Tummy Tuck', slug: 'Tummy Tuck' },
      { label: 'Liposuction', slug: 'Liposuction' },
      { label: 'Body Contouring', slug: 'Body Contouring' },
      { label: 'Arm Lift', slug: 'Arm Lift' },
      { label: 'Thigh Lift', slug: 'Thigh Lift' },
    ],
  },
  {
    key: 'Face',
    title: 'Face',
    subtitle: 'Facelift, Eyelid Surgery, Chin & More',
    fallbackImage: 'https://images.unsplash.com/photo-1764265923632-b2126ec0dedc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    procedures: [
      { label: 'Facelift / Neck Lift', slug: 'Facelift / Neck Lift' },
      { label: 'Eyelid Surgery', slug: 'Eyelid Surgery' },
      { label: 'Chin Augmentation', slug: 'Chin Augmentation' },
      { label: 'Otoplasty', slug: 'Otoplasty' },
      { label: 'Liposuction (Face)', slug: 'Liposuction (Face)' },
    ],
  },
  {
    key: 'Nose',
    title: 'Nose',
    subtitle: 'Rhinoplasty & Revision',
    fallbackImage: 'https://images.unsplash.com/photo-1760341682514-41b5199c6205?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    procedures: [
      { label: 'Rhinoplasty', slug: 'Rhinoplasty' },
    ],
  },
];

export function GalleryLanding({ onNavigate }: GalleryLandingProps) {
  const navigate = useNavigate();
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  // Load the same service card images from Supabase that Home.tsx uses
  useEffect(() => {
    const loadImages = async () => {
      try {
        const results = await Promise.allSettled(
          GALLERY_CATEGORIES.map(async (cat) => {
            const contentKey = `service_card_${cat.key.toLowerCase()}`;
            const response = await fetch(`${serverUrl}/content/${contentKey}`, {
              headers: { 'Authorization': `Bearer ${publicAnonKey}` }
            });
            const data = await response.json();
            return { key: cat.key, url: data.content?.value };
          })
        );

        const imageUrls: Record<string, string> = {};
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.url) {
            imageUrls[result.value.key] = result.value.url;
          }
        }
        setCategoryImages(imageUrls);
      } catch (e) {
        console.error('[GalleryLanding] Error loading images:', e);
      }
      setImagesLoaded(true);
    };

    loadImages();
  }, []);

  const handleViewAll = (categoryKey: string) => {
    navigate(`/gallery/${categoryKey}`);
  };

  const handleProcedureClick = (categoryKey: string, procedureSlug: string) => {
    navigate(`/gallery/${categoryKey}/${encodeURIComponent(procedureSlug)}`);
  };

  return (
    <>
      <SEOHead
        title="Before & After Gallery | Hanemann Plastic Surgery"
        description="Browse real patient before and after photos by Dr. Hanemann. View results for breast, body, face, and nose procedures."
        path="/gallery"
      />

      {/* Hero */}
      <section className="relative bg-[#1a1f2e] pt-32 pb-12 md:pt-40 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1219] to-[#1a1f2e] pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#c9b896]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <p className="text-[#c9b896] text-xs uppercase tracking-[0.3em] mb-4">Real Patients. Real Results.</p>
          <h1 className="text-white text-3xl md:text-5xl font-light tracking-wide mb-4">Before &amp; After Gallery</h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Select a category to explore Dr. Hanemann&rsquo;s work, or jump directly to a specific procedure.
          </p>
        </div>
      </section>

      {/* Category Sections — each with image + always-visible procedure list */}
      <section className="bg-[#1a1f2e] pb-20 md:pb-28">
        <div className="container mx-auto px-6 max-w-5xl space-y-8 md:space-y-10">
          {GALLERY_CATEGORIES.map((cat, idx) => {
            const imageSrc = categoryImages[cat.key] || cat.fallbackImage;
            // Alternate layout: image left / right on desktop
            const isReversed = idx % 2 === 1;

            return (
              <div
                key={cat.key}
                className={`flex flex-col ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'} rounded-2xl overflow-hidden border border-[#2d3548] hover:border-[#c9b896]/30 transition-all duration-500 bg-[#242938]`}
              >
                {/* Image Side */}
                <div className="relative w-full md:w-1/2 h-56 md:h-auto min-h-[280px] overflow-hidden group cursor-pointer" onClick={() => handleViewAll(cat.key)}>
                  <img
                    src={imageSrc}
                    alt={cat.title}
                    className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ${
                      imagesLoaded ? 'opacity-100' : 'opacity-0'
                    } transition-opacity duration-500`}
                    onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                  />
                  {/* Gradient fade into content side */}
                  <div className={`absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r ${isReversed ? 'md:bg-gradient-to-l' : ''} from-transparent via-transparent to-[#242938]/80 md:to-[#242938]`}></div>
                  {/* Mobile: title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:hidden bg-gradient-to-t from-[#242938] to-transparent">
                    <h2 className="text-white text-2xl font-light tracking-wide">{cat.title}</h2>
                    <p className="text-gray-400 text-xs mt-1">{cat.subtitle}</p>
                  </div>
                </div>

                {/* Procedures Side */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                  {/* Desktop title */}
                  <div className="hidden md:block mb-6">
                    <h2 className="text-white text-2xl md:text-3xl font-light tracking-wide mb-1">{cat.title}</h2>
                    <p className="text-gray-400 text-sm">{cat.subtitle}</p>
                  </div>

                  {/* Procedure links — always visible */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {cat.procedures.map((proc) => (
                      <button
                        key={proc.slug}
                        onClick={() => handleProcedureClick(cat.key, proc.slug)}
                        className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-white/5 border border-white/10 hover:border-[#c9b896]/50 hover:bg-[#c9b896]/10 transition-all duration-300 group/proc"
                      >
                        <span className="text-gray-300 text-sm group-hover/proc:text-[#c9b896] transition-colors duration-200">{proc.label}</span>
                        <ArrowRight className="w-3 h-3 text-gray-500 opacity-0 -translate-x-1 group-hover/proc:opacity-100 group-hover/proc:translate-x-0 group-hover/proc:text-[#c9b896] transition-all duration-300" />
                      </button>
                    ))}
                  </div>

                  {/* View All CTA */}
                  <button
                    onClick={() => handleViewAll(cat.key)}
                    className="inline-flex items-center gap-2 self-start bg-[#c9b896]/10 hover:bg-[#c9b896]/20 border border-[#c9b896]/25 hover:border-[#c9b896]/50 text-[#c9b896] text-xs uppercase tracking-widest px-5 py-2.5 rounded-full transition-all duration-300 group/all"
                  >
                    View All {cat.title}
                    <ArrowRight className="w-3.5 h-3.5 group-hover/all:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
