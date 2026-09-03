import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { Facebook, Instagram, Phone, Menu, X, MapPin, Video } from 'lucide-react';
// Patient portal is currently hidden — `usePatientAuth` and react-router `Link` imports removed.

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenConsultation?: () => void;
}

export function Header({ currentPage, onNavigate, onOpenConsultation }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Removed 'Resources' from navigation tabs
  const navigationTabs = ['Home', 'About', 'Nose', 'Face', 'Breast', 'Body', 'Photo Gallery', 'Contact'];
  
  // Determine if we're on the home page (should be transparent at top)
  const isHomePage = currentPage === 'Home';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  // Header background class. Solid navy on the home page so the nav is its
  // own independent navy bar — the photo lives behind it but is fully covered
  // up there. On other pages and on scroll, fall back to the semi-transparent
  // backdrop-blur treatment.
  const headerBgClass = isHomePage && !scrolled
    ? 'bg-[#1a1f2e]'
    : 'bg-[#1a1f2e]/40 backdrop-blur-md shadow-lg';

  return (
    <>
      {/* Main Header - Fixed with Scroll Effect */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBgClass} border-b ${mobileMenuOpen ? 'border-transparent' : isHomePage && !scrolled ? 'border-white/20' : 'border-[#2d3548]'}`}
      >
        <div className="container mx-auto px-4 md:px-6 pt-2">
          {/* Top Row: Social | Logo | Portal + Phone */}
          <div className="flex items-start justify-between pb-1.5">
            {/* Left Side: Social Icons (Desktop) */}
            <div className="hidden lg:flex items-center gap-3 w-1/4 pt-1">
              <a href="https://www.instagram.com/hanemannplasticsurgery/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#c9b896] transition-colors" aria-label="Instagram">
                <Instagram size={14}/>
              </a>
              <a href="https://www.facebook.com/plasticBR" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#c9b896] transition-colors" aria-label="Facebook">
                <Facebook size={14}/>
              </a>
            </div>

            {/* Center: Logo */}
            <div className="flex-1 flex justify-center">
              <button 
                onClick={() => handleNavigate('Home')} 
                className="group hover:opacity-80 transition-opacity"
              >
                <img 
                  src="/images/logos/logo-main.png"
                  alt="Hanemann Plastic Surgery" 
                  className="h-20 md:h-28 w-auto transition-all duration-300"
                  onError={(e) => {
                    // Fallback to SVG if PNG doesn't exist
                    const img = e.target as HTMLImageElement;
                    if (img.src.endsWith('.png')) {
                      img.src = '/images/logos/logo-main.svg';
                    }
                  }}
                />
              </button>
            </div>

            {/* Right Side: Phone (Desktop) — Patient Portal link hidden */}
            <div className="hidden lg:flex items-center gap-3 w-1/4 justify-end pt-1">
              <a href="tel:2257662166" className="flex items-center gap-1.5 text-white hover:text-[#c9b896] transition-colors">
                <Phone size={14} className="text-[#c9b896]"/>
                <span className="text-xs">(225) 766-2166</span>
              </a>
            </div>

            {/* Phone number moved to hamburger menu on mobile */}

            {/* Mobile Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden text-white absolute right-4"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation Bar with CTAs */}
          <div className="hidden lg:block pb-3">
            <nav className="flex items-center justify-center gap-4 xl:gap-5">
              {navigationTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => onNavigate(tab)}
                  className={`text-[10px] xl:text-xs uppercase tracking-widest hover:text-[#c9b896] transition-colors relative group ${
                    currentPage === tab ? 'text-[#c9b896]' : 'text-white'
                  }`}
                >
                  {tab}
                  <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-[#c9b896] transform origin-left transition-transform duration-300 ${
                    currentPage === tab ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}></span>
                </button>
              ))}
              
              {/* Patient Forms PDF — real link (not a route), opens in a new tab */}
              <a
                href="/patient-forms.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] xl:text-xs uppercase tracking-widest text-white hover:text-[#c9b896] transition-colors relative group"
              >
                Patient Forms
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#c9b896] transform origin-left transition-transform duration-300 scale-x-0 group-hover:scale-x-100"></span>
              </a>

              <div className="h-4 w-px bg-white/20 mx-1"></div>

              <Button
                className="bg-[#c9b896] text-[#1a1f2e] px-3 py-1 rounded-none text-[10px] uppercase tracking-wider hover:bg-[#b8976a] transition-colors duration-300"
                onClick={() => onOpenConsultation ? onOpenConsultation() : onNavigate('Contact')}
              >
                Schedule a Consultation
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from going under fixed header - REMOVED for home page */}
      {!isHomePage && <div className="h-[65px] lg:h-[75px]"></div>}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#1a1f2e] pt-20 px-6 lg:hidden animate-fade-in overflow-y-auto">
          <nav className="flex flex-col gap-4 items-center text-center pb-8">
            {/* Logo removed — already visible in fixed header above */}
            
            {navigationTabs.map(tab => (
              <button
                key={tab}
                onClick={() => handleNavigate(tab)}
                className="text-base font-serif text-white hover:text-[#c9b896] transition-colors py-1"
              >
                {tab}
              </button>
            ))}
            
            {/* Patient Portal link hidden in mobile menu */}

            {/* Patient Forms PDF — staff drop the file at /public/patient-forms.pdf */}
            <a
              href="/patient-forms.pdf"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm text-[#c9b896] hover:text-[#b8976a] transition-colors mt-2"
            >
              Patient Forms (PDF)
            </a>

            <a
              href="tel:2257662166"
              className="flex items-center gap-2 text-sm text-white hover:text-[#c9b896] transition-colors"
            >
              <Phone size={16} className="text-[#c9b896]"/>
              (225) 766-2166
            </a>
            
            <Button
              className="bg-transparent border border-[#c9b896] text-[#c9b896] px-6 py-2 rounded-none text-sm uppercase tracking-wider hover:bg-[#c9b896] hover:text-[#1a1f2e] transition-colors mt-2"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('Photo Gallery');
              }}
            >
              View Photo Gallery
            </Button>

            <Button
              className="bg-[#c9b896] text-[#1a1f2e] px-6 py-2 rounded-none text-sm uppercase tracking-wider hover:bg-[#b8976a] transition-colors"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('Contact');
              }}
            >
              Contact
            </Button>
            
            {/* Social Icons in Mobile */}
            <div className="flex items-center gap-6 mt-8 pt-8 border-t border-[#2d3548]">
              <a href="https://www.instagram.com/hanemannplasticsurgery/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#c9b896] transition-colors" aria-label="Instagram"><Instagram size={20}/></a>
              <a href="https://www.facebook.com/plasticBR" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#c9b896] transition-colors" aria-label="Facebook"><Facebook size={20}/></a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}