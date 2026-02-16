import { Instagram, Facebook, Twitter } from 'lucide-react';
import { Button } from './ui/button';
import { EditableText } from './cms/EditableText';

// Logo path - same as header
const logoFull = '/images/logos/logo-main.png';

interface FooterProps {
  onNavigate: (page: string) => void;
  onOpenQuickContact?: () => void;
}

export function Footer({ onNavigate, onOpenQuickContact }: FooterProps) {
  const procedureLinks = [
    { label: 'Rhinoplasty', page: 'Nose' },
    { label: 'Facelift', page: 'Face' },
    { label: 'Breast Augmentation', page: 'Breast' },
    { label: 'Liposuction', page: 'Body' },
    { label: 'Eyelid Surgery', page: 'Face' },
  ];

  return (
    <footer className="bg-[#1a1f2e] text-white pt-20 pb-10 border-t border-[#2d3548]">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        {/* Column 1: Brand */}
        <div className="md:col-span-1 flex flex-col items-center md:items-start">
          <img 
            src={logoFull} 
            alt="Hanemann Plastic Surgery" 
            className="h-48 mb-6 logo-footer"
          />
          <p className="text-gray-400 text-sm leading-relaxed mb-6 text-center md:text-left">
            Dedicated to restoring form and function with an artistic touch. Experience the highest standard of aesthetic care.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#c9b896] hover:text-[#1a1f2e] transition-colors">
              <Instagram size={18}/>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#c9b896] hover:text-[#1a1f2e] transition-colors">
              <Facebook size={18}/>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#c9b896] hover:text-[#1a1f2e] transition-colors">
              <Twitter size={18}/>
            </a>
          </div>
        </div>

        {/* Column 2: Procedures */}
        <div>
          <h3 className="text-lg font-serif mb-6 text-white">Procedures</h3>
          <ul className="space-y-3 text-sm text-gray-400">
            {procedureLinks.map((link) => (
              <li key={link.label}>
                <button 
                  onClick={() => onNavigate(link.page)} 
                  className="hover:text-[#c9b896] transition-colors text-left"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div>
          <h3 className="text-lg font-serif mb-6 text-white">Contact</h3>
          <div className="space-y-4 text-sm text-gray-400">
            <div>
              <EditableText 
                contentKey="footer_address" 
                defaultContent="5233 Dijon Drive&#10;Baton Rouge, LA 70808"
                multiline 
                className="whitespace-pre-line block"
              />
            </div>
            <div>
              <EditableText 
                contentKey="footer_phone" 
                defaultContent="(225) 766-2166"
              />
            </div>
            <p>info@hanemannplastic.com</p>
          </div>
        </div>

        {/* Column 4: Hours */}
        <div>
          <h3 className="text-lg font-serif mb-6 text-white">Hours</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex justify-between">
              <span>Mon - Fri</span> 
              <span>9:00 AM - 5:00 PM</span>
            </li>
            <li className="flex justify-between">
              <span>Sat</span> 
              <span>By Appointment</span>
            </li>
            <li className="flex justify-between">
              <span>Sun</span> 
              <span>Closed</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Areas We Serve Section */}
      <div className="border-t border-white/10 pt-12 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-lg mb-4 text-[#c9b896]">Areas We Serve</h3>
          <p className="text-gray-300 text-sm mb-6">
            Proudly serving patients throughout the Baton Rouge metropolitan area and surrounding Louisiana communities
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {[
              'Baton Rouge',
              'Prairieville',
              'Gonzales',
              'Denham Springs',
              'Zachary',
              'Baker',
              'Central',
              'Walker',
              'Livingston Parish',
              'Ascension Parish',
              'East Baton Rouge Parish'
            ].map(area => (
              <span 
                key={area}
                className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-300 hover:border-[#c9b896]/50 hover:text-[#c9b896] transition-colors"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10 pt-8 text-center text-xs text-gray-500">
        <p className="text-sm text-gray-400 mt-4">
          © {new Date().getFullYear()} Hanemann Plastic Surgery. All rights reserved. | {' '}
          <button 
            onClick={() => onNavigate('AdminLogin')} 
            className="hover:text-[#c9b896] transition-colors text-gray-500/50"
          >
            Admin
          </button>
        </p>
      </div>
    </footer>
  );
}