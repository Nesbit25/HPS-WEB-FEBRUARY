import React, { useState, useEffect, useRef } from 'react';
import { EditableText } from '../cms/EditableText';
import { EditableImage } from '../cms/EditableImage';
import { ArrowRight, Phone, Calendar, Award, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { SEOHead } from '../seo/SEOHead';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { unsplash_tool } from '../../utils/unsplash';

// Placeholder image - replace with actual hosted image URL
const noseServiceImage = 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80';

interface HomeLuxuryProps {
  onNavigate: (page: string) => void;
  onOpenConsultation?: () => void;
}

export function HomeLuxury({ onNavigate, onOpenConsultation }: HomeLuxuryProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  const procedureCategories = [
    {
      id: 'face',
      title: 'Face',
      procedures: ['Facelift', 'Brow Lift', 'Eyelid Surgery', 'Neck Lift'],
      gradient: 'from-black/60 via-black/40 to-transparent'
    },
    {
      id: 'breast',
      title: 'Breast',
      procedures: ['Augmentation', 'Lift', 'Reduction', 'Revision'],
      gradient: 'from-black/60 via-black/40 to-transparent'
    },
    {
      id: 'body',
      title: 'Body',
      procedures: ['Tummy Tuck', 'Liposuction', 'Body Lift', 'Mommy Makeover'],
      gradient: 'from-black/60 via-black/40 to-transparent'
    },
    {
      id: 'nose',
      title: 'Nose',
      procedures: ['Rhinoplasty', 'Revision Rhinoplasty', 'Septoplasty'],
      gradient: 'from-black/60 via-black/40 to-transparent'
    }
  ];

  // Infinite scroll logic
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    const cardWidth = 384; // md:w-96 = 384px
    const totalCards = procedureCategories.length;
    const totalWidth = cardWidth * totalCards;

    // Start at the beginning of the first set (after the cloned last set)
    container.scrollLeft = totalWidth;

    const handleScroll = () => {
      if (isAutoScrolling) return;

      const scrollLeft = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;

      // If scrolled to the end (reached second set end), jump back to first set end
      if (scrollLeft >= totalWidth * 2 - cardWidth) {
        setIsAutoScrolling(true);
        container.scrollLeft = totalWidth - cardWidth;
        setTimeout(() => setIsAutoScrolling(false), 50);
      }
      // If scrolled to the beginning (reached cloned set start), jump to first set start
      else if (scrollLeft <= cardWidth) {
        setIsAutoScrolling(true);
        container.scrollLeft = totalWidth + cardWidth;
        setTimeout(() => setIsAutoScrolling(false), 50);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isAutoScrolling, procedureCategories.length]);

  return (
    <>
      <SEOHead
        title="Hanemann Plastic Surgery | Baton Rouge, LA"
        description="Dr. Michael S. Hanemann Jr., M.D., Double Board Certified Plastic Surgeon in Baton Rouge, LA. Specializing in facial, breast, and body procedures with refined, natural results."
        path="/"
      />

      {/* Full-Height Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Image - Fixed */}
        <div className="absolute inset-0 bg-black">
          <EditableImage
            contentKey="home_hero_main"
            defaultSrc="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1920&q=90"
            alt="Luxury surgical suite"
            className="w-full h-full object-cover opacity-50"
            locationLabel="Hero Background"
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        
        {/* Left-to-Right Navy Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1f2e]/60 via-[#1a1f2e]/30 via-30% to-transparent to-50%" />

        {/* Content Overlay - Left Sidebar Layout */}
        <div className="absolute inset-0 flex items-center justify-start">
          <div className="w-full max-w-2xl pl-12 md:pl-20 lg:pl-32 pr-8">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6 text-white relative z-10"
            >
              {/* Doctor's Name */}
              <div className="space-y-2">
                <p className="text-sm md:text-base tracking-[0.3em] uppercase text-[#c9b896] font-light">
                  <EditableText 
                    contentKey="home_hero_doctor_name"
                    defaultValue="Dr. Michael S. Hanemann Jr., M.D."
                    as="span"
                  />
                </p>
                <p className="text-xs md:text-sm tracking-[0.2em] uppercase text-white/80">
                  <EditableText 
                    contentKey="home_hero_subtitle"
                    defaultValue="Double Board Certified Plastic Surgeon"
                    as="span"
                  />
                </p>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl tracking-tight leading-tight">
                <EditableText 
                  contentKey="home_hero_title"
                  defaultValue="Revealing Beauty"
                  as="span"
                />
              </h1>

              {/* Tagline */}
              <p className="text-lg md:text-xl tracking-wide text-white/90 max-w-xl">
                <EditableText 
                  contentKey="home_hero_tagline"
                  defaultValue="Natural. Refined. You."
                  as="span"
                />
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4 pt-8">
                <Button
                  onClick={() => onOpenConsultation?.()}
                  className="bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] px-10 py-5 text-sm uppercase tracking-wider rounded-none transition-all shadow-lg shadow-[#c9b896]/20 hover:shadow-xl hover:shadow-[#c9b896]/30"
                >
                  <Calendar className="w-5 h-5 mr-3" />
                  Schedule Consultation
                </Button>
                <Button
                  onClick={() => onNavigate('Gallery')}
                  variant="outline"
                  className="border-2 border-[#c9b896] text-[#c9b896] bg-transparent hover:bg-white hover:text-[#1a1f2e] hover:border-white px-10 py-5 text-sm uppercase tracking-wider rounded-none transition-all"
                >
                  View Results
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Credentials Bar */}
      <section className="relative bg-gradient-to-b from-[#242938] to-[#1a1f2e] text-white py-12 border-t border-[#2d3548]">
        {/* Bottom accent border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/40 to-transparent" />
        
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2 relative">
              <Award className="w-8 h-8 mx-auto text-[#c9b896]" />
              <p className="text-2xl font-serif text-[#c9b896]">Board Certified</p>
              <p className="text-sm text-white/70 uppercase tracking-wider">Plastic Surgery</p>
              {/* Vertical divider - hidden on mobile, shown on md+ */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-16 w-px bg-[#c9b896]/20" />
            </div>
            <div className="space-y-2 relative">
              <CheckCircle2 className="w-8 h-8 mx-auto text-[#c9b896]" />
              <p className="text-2xl font-serif text-[#c9b896]">15+ Years</p>
              <p className="text-sm text-white/70 uppercase tracking-wider">Experience</p>
              {/* Vertical divider */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-16 w-px bg-[#c9b896]/20" />
            </div>
            <div className="space-y-2 relative">
              <Award className="w-8 h-8 mx-auto text-[#c9b896]" />
              <p className="text-2xl font-serif text-[#c9b896]">4000</p>
              <p className="text-sm text-white/70 uppercase tracking-wider">Procedures</p>
              {/* Vertical divider */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-16 w-px bg-[#c9b896]/20" />
            </div>
            <div className="space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-[#c9b896]" />
              <p className="text-2xl font-serif text-[#c9b896]">5-Star</p>
              <p className="text-sm text-white/70 uppercase tracking-wider">Patient Reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-24 bg-[#1a1f2e] relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left Content Section */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-white mb-2">
                  <span className="text-3xl md:text-4xl tracking-wide uppercase">OUR MAIN</span>
                  <br />
                  <span className="font-serif text-5xl md:text-6xl italic">Services</span>
                </h2>
                
                <div className="w-16 h-0.5 bg-[#c9b896] my-8"></div>
                
                <p className="text-gray-300 leading-relaxed text-base mb-8">
                  <EditableText 
                    contentKey="home_services_description"
                    defaultValue="Whether you're looking to refine your facial features, contour your body, or restore symmetry and function after an injury or illness, our classic personalized approach and attention to detail ensure exceptional results tailored to your unique needs. You can trust Dr. Hanemann's skill and artistry to transform your vision into reality and rediscover your confidence and self-assurance."
                    as="span"
                    multiline
                  />
                </p>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => onNavigate('Procedures')}
                    className="bg-transparent border-2 border-[#c9b896] text-[#c9b896] hover:bg-[#c9b896] hover:text-[#1a1f2e] px-8 py-6 text-sm uppercase tracking-[0.2em] rounded-none transition-all duration-300"
                  >
                    View All Services
                  </Button>
                </motion.div>
              </motion.div>
            </div>

            {/* Right Carousel Section */}
            <div className="lg:col-span-3 relative h-[600px]">
              <div className="relative overflow-hidden h-full">
                {/* Carousel Container */}
                <div 
                  ref={carouselRef}
                  className="flex overflow-x-auto lg:overflow-x-hidden scrollbar-hide snap-x snap-mandatory h-full touch-pan-x" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {/* Render three sets for seamless infinite loop */}
                  {[...procedureCategories, ...procedureCategories, ...procedureCategories].map((category, index) => (
                    <motion.div
                      key={`${category.id}-${index}`}
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: (index % procedureCategories.length) * 0.1 }}
                      viewport={{ once: true }}
                      className="flex-shrink-0 w-80 md:w-96 snap-center group relative h-full"
                      whileHover={{ y: -8 }}
                    >
                      {/* Background Image */}
                      <div className="absolute inset-0 overflow-hidden">
                        <EditableImage
                          contentKey={`home_procedure_${category.id}`}
                          defaultSrc={category.id === 'nose' ? noseServiceImage : `https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80`}
                          alt={category.title}
                          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                          locationLabel={`${category.title} Category Image`}
                          cropAspectRatio={0.65}
                        />
                      </div>

                      {/* Clickable overlay for navigation - only active when not in edit mode */}
                      <div 
                        className="absolute inset-0 cursor-pointer" 
                        onClick={() => onNavigate(category.title)}
                      />

                      {/* Dark Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 group-hover:from-black/80 group-hover:via-black/50 group-hover:to-black/20 transition-all duration-500" />

                      {/* Category Title - Centered */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <h3 className="font-serif text-5xl md:text-6xl text-white italic group-hover:scale-110 transition-transform duration-500">
                          {category.title.toUpperCase()}
                        </h3>
                      </div>

                      {/* Hover Content - Bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="space-y-2 mb-4">
                          {category.procedures.map((proc, i) => (
                            <p key={i} className="text-sm text-white/90 tracking-wide">
                              • {proc}
                            </p>
                          ))}
                        </div>
                        <div className="flex items-center text-[#c9b896] mt-4">
                          <span className="text-sm uppercase tracking-wider mr-2">Explore</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      {/* Bottom Accent Line */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#c9b896] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    </motion.div>
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
          </div>
        </div>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#1a1f2e] text-white">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm tracking-[0.3em] uppercase text-[#c9b896] mb-4">
            Begin Your Journey
          </p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6">
            <EditableText 
              contentKey="home_cta_title"
              defaultValue="Schedule Your Consultation"
              as="span"
            />
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10">
            <EditableText 
              contentKey="home_cta_description"
              defaultValue="Take the first step toward achieving your aesthetic goals. Schedule a private consultation with Dr. Hanemann in Baton Rouge."
              as="span"
              multiline
            />
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => onOpenConsultation?.()}
              className="bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] px-12 py-6 text-base uppercase tracking-wider rounded-none"
            >
              <Calendar className="w-5 h-5 mr-3" />
              Book Consultation
            </Button>
            <Button
              onClick={() => window.location.href = 'tel:+12257662166'}
              variant="outline"
              className="border-2 border-[#c9b896] text-[#c9b896] bg-transparent hover:bg-white hover:text-[#1a1f2e] hover:border-white px-12 py-6 text-base uppercase tracking-wider rounded-none"
            >
              <Phone className="w-5 h-5 mr-3" />
              (225) 766-2166
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}