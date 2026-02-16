import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { Facebook, Instagram, Twitter, Phone, Menu, X, MapPin, User, Video } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { Link } from 'react-router';

// Logo paths - static files from public folder
// Main logo (SVG preferred, PNG fallback)
const logoPath = '/images/logos/logo-main.png';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenConsultation?: () => void;
}

export function Header({ currentPage, onNavigate, onOpenConsultation }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = usePatientAuth();
  // Removed 'Resources' from navigation tabs
  const navigationTabs = ['Home', 'About', 'Nose', 'Face', 'Breast', 'Body', 'Gallery', 'Patient Forms', 'Contact'];
  
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

  // Header background class based on scroll state and page
  const headerBgClass = isHomePage && !scrolled
    ? 'bg-transparent'
    : 'bg-[#1a1f2e]/40 backdrop-blur-md shadow-lg';

  return (
    <>
      {/* Main Header - Fixed with Scroll Effect */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBgClass} border-b ${isHomePage && !scrolled ? 'border-white/20' : 'border-[#2d3548]'}`}
      >
        <div className="container mx-auto px-4 md:px-6 pt-2">
          {/* Top Row: Social | Logo | Portal + Phone */}
          <div className="flex items-start justify-between pb-1.5">
            {/* Left Side: Social Icons (Desktop) */}
            <div className="hidden lg:flex items-center gap-3 w-1/4 pt-1">
              <a href="#" className="text-white hover:text-[#c9b896] transition-colors" aria-label="Instagram">
                <Instagram size={14}/>
              </a>
              <a href="#" className="text-white hover:text-[#c9b896] transition-colors" aria-label="Facebook">
                <Facebook size={14}/>
              </a>
              <a href="#" className="text-white hover:text-[#c9b896] transition-colors" aria-label="Twitter">
                <Twitter size={14}/>
              </a>
            </div>

            {/* Center: Logo */}
            <div className="flex-1 flex justify-center">
              <button 
                onClick={() => handleNavigate('Home')} 
                className="group hover:opacity-80 transition-opacity"
              >
                <ImageWithFallback 
                  src={logoPath} 
                  fallback={logoPath} 
                  alt="Hanemann Plastic Surgery" 
                  className="h-20 md:h-28 w-auto transition-all duration-300"
                />
              </button>
            </div>

            {/* Right Side: Patient Portal & Phone (Desktop) */}
            <div className="hidden lg:flex items-center gap-3 w-1/4 justify-end pt-1">
              <Link 
                to={user ? '/patient/dashboard' : '/patient/login'} 
                className="flex items-center gap-1 text-xs text-white hover:text-[#c9b896] transition-colors"
              >
                <User size={14} />
                <span>{user ? `${user.firstName}'s Portal` : 'Patient Portal'}</span>
              </Link>
              
              <div className="h-4 w-px bg-white/20"></div>
              
              <a href="tel:2257662166" className="flex items-center gap-1.5 text-white hover:text-[#c9b896] transition-colors">
                <Phone size={14} className="text-[#c9b896]"/> 
                <span className="text-xs">(225) 766-2166</span>
              </a>
            </div>

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
            {/* Logo in mobile menu - SMALLER */}
            <img 
              src={logoPath} 
              alt="MH" 
              className="h-32 mb-2 opacity-80"
            />
            
            {navigationTabs.map(tab => (
              <button
                key={tab}
                onClick={() => handleNavigate(tab)}
                className="text-base font-serif text-white hover:text-[#c9b896] transition-colors py-1"
              >
                {tab}
              </button>
            ))}
            
            <Link 
              to={user ? '/patient/dashboard' : '/patient/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm text-[#c9b896] hover:text-[#b8976a] transition-colors mt-2"
            >
              <User size={16} />
              {user ? `${user.firstName}'s Portal` : 'Patient Portal'}
            </Link>

            <a 
              href="tel:2257662166" 
              className="flex items-center gap-2 text-sm text-white hover:text-[#c9b896] transition-colors"
            >
              <Phone size={16} className="text-[#c9b896]"/> 
              (225) 766-2166
            </a>
            
            <Button 
              className="bg-[#c9b896] text-[#1a1f2e] px-6 py-2 rounded-none text-sm uppercase tracking-wider hover:bg-[#b8976a] transition-colors mt-2"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('Contact');
              }}
            >
              Contact
            </Button>
            
            {/* Social Icons in Mobile */}
            <div className="flex items-center gap-6 mt-8 pt-8 border-t border-[#2d3548]">
              <a href="#" className="text-white hover:text-[#c9b896] transition-colors" aria-label="Instagram">
                <Instagram size={20}/>
              </a>
              <a href="#" className="text-white hover:text-[#c9b896] transition-colors" aria-label="Facebook">
                <Facebook size={20}/>
              </a>
              <a href="#" className="text-white hover:text-[#c9b896] transition-colors" aria-label="Twitter">
                <Twitter size={20}/>
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}