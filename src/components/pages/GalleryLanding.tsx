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
      { label: 'Liposuction (Face)', slug: 'Liposuction' },
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
      <section className="relative bg-[#1a1f2e] pt-32 pb-10 md:pt-40 md:pb-12 overflow-hidden">
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

      {/* Tile Collage — 4 cards edge-to-edge, no gaps */}
      <section className="grid grid-cols-2 md:grid-cols-4">
        {GALLERY_CATEGORIES.map((cat) => {
          // Only resolve image src after custom images have been checked;
          // this prevents the stock photo from flashing before the real one loads
          const resolvedSrc = imagesLoaded
            ? (categoryImages[cat.key] || cat.fallbackImage)
            : undefined;

          return (
            <div
              key={cat.key}
              className="relative group overflow-hidden bg-[#2a2f3a]"
            >
              {/* Full-bleed background image — only rendered after Supabase check */}
              {resolvedSrc && (
                <img
                  src={resolvedSrc}
                  alt={cat.title}
                  className="w-full h-full object-cover object-center absolute inset-0 group-hover:scale-110 transition-transform duration-700 opacity-0"
                  onLoad={(e) => { e.currentTarget.classList.remove('opacity-0'); e.currentTarget.classList.add('opacity-100'); }}
                  style={{ transition: 'opacity 0.5s' }}
                />
              )}

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1219] via-[#0f1219]/70 to-[#0f1219]/30 group-hover:via-[#0f1219]/60 group-hover:to-[#0f1219]/20 transition-all duration-500"></div>

              {/* Content — sits on top */}
              <div className="relative z-10 flex flex-col justify-end p-5 md:p-7 min-h-[320px] md:min-h-[480px]">
                {/* Category title */}
                <h2 className="text-white text-xl md:text-2xl font-light tracking-wide mb-1">{cat.title}</h2>
                <p className="text-gray-400 text-[10px] md:text-xs mb-4 hidden md:block">{cat.subtitle}</p>

                {/* Procedure list — matches service card style */}
                <div className="space-y-1 md:space-y-1.5 mb-4">
                  {cat.procedures.map((proc) => (
                    <button
                      key={proc.slug}
                      onClick={() => handleProcedureClick(cat.key, proc.slug)}
                      className="block text-left hover:translate-x-1 transition-transform duration-200 group/proc"
                    >
                      <span className="text-white/80 text-[11px] md:text-sm tracking-wide group-hover/proc:text-[#c9b896] transition-colors duration-200">• {proc.label}</span>
                    </button>
                  ))}
                </div>

                {/* View All */}
                <button
                  onClick={() => handleViewAll(cat.key)}
                  className="inline-flex items-center gap-1.5 self-start text-[#c9b896] text-[10px] md:text-xs uppercase tracking-widest hover:gap-3 transition-all duration-300"
                >
                  View All
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
