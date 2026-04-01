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
    image: 'https://images.unsplash.com/photo-1768609957045-591c79431f48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd29tYW4lMjBzaWxob3VldHRlJTIwYmVhdXR5JTIwbHV4dXJ5fGVufDF8fHx8MTc3MTk3NzQ1OHww&ixlib=rb-4.1.0&q=80&w=800',
    procedures: [
      { label: 'Breast Augmentation', slug: 'Breast Augmentation' },
      { label: 'Breast Augmentation + Lift', slug: 'Breast Aug + Lift' },
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
    image: 'https://images.unsplash.com/photo-1646932520067-81bdc09af07a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXQlMjB3b21hbiUyMGJvZHklMjBjb250b3VyJTIwZWxlZ2FudCUyMGx1eHVyeXxlbnwxfHx8fDE3NzE5Nzc0NTh8MA&ixlib=rb-4.1.0&q=80&w=800',
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
    image: 'https://images.unsplash.com/photo-1764265923632-b2126ec0dedc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd29tYW4lMjBmYWNlJTIwcG9ydHJhaXQlMjBsdXh1cnklMjBiZWF1dHl8ZW58MXx8fHwxNzcxOTc3NDU3fDA&ixlib=rb-4.1.0&q=80&w=800',
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
    image: 'https://images.unsplash.com/photo-1760341682514-41b5199c6205?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dGlmdWwlMjB3b21hbiUyMHByb2ZpbGUlMjBwb3J0cmFpdCUyMGVsZWdhbnR8ZW58MXx8fHwxNzcxOTc3NDU3fDA&ixlib=rb-4.1.0&q=80&w=800',
    procedures: [
      { label: 'Rhinoplasty', slug: 'Rhinoplasty' },
    ],
  },
];

export function GalleryLanding({ onNavigate }: GalleryLandingProps) {
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);

  const handleCategoryClick = (categoryKey: string) => {
    // Toggle the expanded procedures list
    setExpandedCategory(prev => prev === categoryKey ? null : categoryKey);
  };

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
      <section className="relative bg-[#1a1f2e] pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1219] to-[#1a1f2e] pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#c9b896]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <p className="text-[#c9b896] text-xs uppercase tracking-[0.3em] mb-4">Real Patients. Real Results.</p>
          <h1 className="text-white text-3xl md:text-5xl font-light tracking-wide mb-4">Before &amp; After Gallery</h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Select a category below to explore Dr. Hanemann&rsquo;s work — then narrow down by specific procedure.
          </p>
        </div>
      </section>

      {/* Category Cards */}
      <section className="bg-[#1a1f2e] pb-20 md:pb-28">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {GALLERY_CATEGORIES.map((cat) => {
              const isExpanded = expandedCategory === cat.key;

              return (
                <div key={cat.key} className="flex flex-col">
                  {/* Main Card */}
                  <button
                    onClick={() => handleCategoryClick(cat.key)}
                    className="group relative overflow-hidden rounded-2xl border border-[#2d3548] hover:border-[#c9b896]/50 transition-all duration-500 text-left focus:outline-none focus:ring-2 focus:ring-[#c9b896]/50"
                  >
                    {/* Background image */}
                    <div className="relative h-56 md:h-64 overflow-hidden">
                      <img
                        src={cat.image}
                        alt={cat.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f2e] via-[#1a1f2e]/60 to-transparent"></div>
                    </div>

                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <div className="flex items-end justify-between">
                        <div>
                          <h2 className="text-white text-2xl md:text-3xl font-light tracking-wide mb-1">{cat.title}</h2>
                          <p className="text-gray-400 text-xs md:text-sm">{cat.subtitle}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-full bg-[#c9b896]/10 border border-[#c9b896]/30 flex items-center justify-center group-hover:bg-[#c9b896] transition-all duration-300 flex-shrink-0 ${isExpanded ? 'rotate-90 bg-[#c9b896]' : ''}`}>
                          <ChevronRight className={`w-5 h-5 transition-colors duration-300 ${isExpanded ? 'text-[#1a1f2e]' : 'text-[#c9b896] group-hover:text-[#1a1f2e]'}`} />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Procedure List */}
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      isExpanded ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="bg-[#242938] rounded-xl border border-[#2d3548] p-4 md:p-5">
                      {/* View All button */}
                      <button
                        onClick={() => handleViewAll(cat.key)}
                        className="w-full flex items-center justify-between py-3 px-4 mb-2 rounded-lg bg-[#c9b896]/10 hover:bg-[#c9b896]/20 border border-[#c9b896]/20 hover:border-[#c9b896]/40 transition-all duration-300 group/all"
                      >
                        <span className="text-[#c9b896] text-sm font-semibold uppercase tracking-wider">View All {cat.title}</span>
                        <ArrowRight className="w-4 h-4 text-[#c9b896] group-hover/all:translate-x-1 transition-transform duration-300" />
                      </button>

                      {/* Individual procedures */}
                      <div className="space-y-1">
                        {cat.procedures.map((proc) => (
                          <button
                            key={proc.slug}
                            onClick={() => handleProcedureClick(cat.key, proc.slug)}
                            className="w-full flex items-center justify-between py-2.5 px-4 rounded-lg hover:bg-white/5 transition-colors duration-200 group/proc"
                          >
                            <span className="text-gray-300 text-sm group-hover/proc:text-[#c9b896] transition-colors duration-200">{proc.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover/proc:text-[#c9b896] group-hover/proc:translate-x-0.5 transition-all duration-200" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
