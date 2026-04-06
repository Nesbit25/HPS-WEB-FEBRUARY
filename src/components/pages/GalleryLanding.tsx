import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';

interface GalleryLandingProps {
  onNavigate: (page: string) => void;
}

const GALLERY_CATEGORIES = [
  {
    key: 'Breast',
    title: 'Breast',
    subtitle: 'Augmentation, Lift, Reduction & More',
    image: '/images/gallery-breast.jpg',
    procedures: [
      { label: 'Breast Augmentation', slug: 'Breast Augmentation' },
      { label: 'Tuberous Breast', slug: 'Tuberous Breast' },
      { label: 'Breast Aug w/ Lift', slug: 'Breast Aug + Lift' },
      { label: 'Breast Lift (Mastopexy)', slug: 'Breast Lift' },
      { label: 'Explant / Mastopexy', slug: 'Explant / Mastopexy' },
      { label: 'Breast Reduction', slug: 'Breast Reduction' },
      { label: 'Asymmetrical Breast', slug: 'Asymmetrical Breast' },
      { label: 'Gynecomastia', slug: 'Gynecomastia' },
      { label: 'FTM Top Surgery', slug: 'FTM Top Surgery' },
    ],
  },
  {
    key: 'Body',
    title: 'Body',
    subtitle: 'Tummy Tuck, Liposuction, Contouring & More',
    image: '/images/gallery-body.jpg',
    procedures: [
      { label: 'Tummy Tuck (Abdominoplasty)', slug: 'Tummy Tuck' },
      { label: 'Arm Lift (Brachioplasty)', slug: 'Arm Lift' },
      { label: 'Thigh Lift', slug: 'Thigh Lift' },
      { label: 'Body Contouring', slug: 'Body Contouring' },
      { label: 'Body Liposuction', slug: 'Liposuction' },
    ],
  },
  {
    key: 'Face',
    title: 'Face',
    subtitle: 'Facelift, Eyelid Surgery, Chin & More',
    image: '/images/gallery-face.jpg',
    procedures: [
      { label: 'Eyelid Rejuvenation', slug: 'Eyelid Surgery' },
      { label: 'Facelift / Necklift', slug: 'Facelift / Neck Lift' },
      { label: 'Chin Augmentation', slug: 'Chin Augmentation' },
      { label: 'Otoplasty', slug: 'Otoplasty' },
      { label: 'Submental (Neck) Liposuction', slug: 'Liposuction' },
    ],
  },
  {
    key: 'Nose',
    title: 'Nose',
    subtitle: 'Rhinoplasty & Revision',
    image: '/images/gallery-nose.jpg',
    procedures: [
      { label: 'Rhinoplasty', slug: 'Rhinoplasty' },
    ],
  },
];

export function GalleryLanding({ onNavigate }: GalleryLandingProps) {
  const navigate = useNavigate();

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
          return (
            <div
              key={cat.key}
              className="relative group overflow-hidden"
            >
              {/* Full-bleed background image — static asset, instant load */}
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover object-center absolute inset-0 group-hover:scale-110 transition-transform duration-700"
              />

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1219] via-[#0f1219]/70 to-[#0f1219]/30 group-hover:via-[#0f1219]/60 group-hover:to-[#0f1219]/20 transition-all duration-500"></div>

              {/* Content — sits on top */}
              <div className="relative z-10 flex flex-col justify-end p-5 md:p-7 min-h-[420px] md:min-h-[600px]">
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
