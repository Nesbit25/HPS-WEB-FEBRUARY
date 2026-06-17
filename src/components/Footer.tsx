import { Instagram, Facebook } from 'lucide-react';
import { EditableText } from './cms/EditableText';

interface FooterProps {
  onNavigate: (page: string) => void;
  onOpenQuickContact?: () => void;
}

export function Footer({ onNavigate, onOpenQuickContact }: FooterProps) {
  const hours = [
    { day: 'Monday',    hours: '8:00 AM – 4:00 PM' },
    { day: 'Tuesday',   hours: '8:00 AM – 4:00 PM' },
    { day: 'Wednesday', hours: '8:00 AM – 4:00 PM' },
    { day: 'Thursday',  hours: '8:00 AM – 4:00 PM' },
    { day: 'Friday',    hours: '8:00 AM – 4:00 PM' },
    { day: 'Saturday',  hours: 'Closed' },
    { day: 'Sunday',    hours: 'Closed' },
  ];

  const procedures = [
    { label: 'Breast', page: 'Breast' },
    { label: 'Body Contouring', page: 'Body' },
    { label: 'Face & Neck', page: 'Face' },
    { label: 'Nose (Rhinoplasty)', page: 'Nose' },
  ];

  const quickLinks = [
    { label: 'About Dr. Hanemann', page: 'About' },
    { label: 'Photo Gallery', page: 'Photo Gallery' },
    { label: 'Contact Us', page: 'Contact' },
    // Patient Forms link removed — was pointing to the now-hidden patient portal
    // and silently redirecting to the homepage. A proper Patient Forms PDF
    // download will be added separately (see PDF Manager task).
  ];

  return (
    <footer className="bg-[#1a1f2e] text-white border-t border-[#2d3548] relative overflow-hidden">
      {/* Gold gradient top edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/50 to-transparent"></div>
      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#c9b896]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main grid */}
      <div className="container mx-auto px-6 pt-16 pb-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">

          {/* Column 1: Brand */}
          <div className="flex flex-col items-center md:items-start">
            <img
              src="/images/logos/logo-main.png"
              alt="Hanemann Plastic Surgery"
              className="h-28 md:h-32 w-auto mb-5"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.src.endsWith('.png')) img.src = '/images/logos/logo-main.svg';
              }}
            />
            <p className="text-gray-400 text-sm leading-relaxed mb-6 text-center md:text-left">
              Dedicated to restoring form and function with an artistic touch. The highest standard of aesthetic care in Baton Rouge.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/hanemannplasticsurgery/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#c9b896] hover:border-[#c9b896] hover:text-[#1a1f2e] transition-all duration-300"
              >
                <Instagram size={15} />
              </a>
              <a
                href="https://www.facebook.com/plasticBR"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#c9b896] hover:border-[#c9b896] hover:text-[#1a1f2e] transition-all duration-300"
              >
                <Facebook size={15} />
              </a>
            </div>
          </div>

          {/* Column 2: Procedures + Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c9b896] mb-5">Procedures</h3>
            <ul className="space-y-3 mb-6">
              {procedures.map(({ label, page }) => (
                <li key={page}>
                  <button
                    onClick={() => onNavigate(page)}
                    className="text-sm text-gray-400 hover:text-[#c9b896] transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-3 h-px bg-[#c9b896]/40 group-hover:w-4 group-hover:bg-[#c9b896] transition-all duration-200 inline-block"></span>
                    {label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-white/5 pt-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c9b896] mb-4">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map(({ label, page }) => (
                  <li key={page}>
                    <button
                      onClick={() => onNavigate(page)}
                      className="text-sm text-gray-400 hover:text-[#c9b896] transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-3 h-px bg-[#c9b896]/40 group-hover:w-4 group-hover:bg-[#c9b896] transition-all duration-200 inline-block"></span>
                      {label}
                    </button>
                  </li>
                ))}
                {/* Patient Forms PDF — staff drop the file at /public/patient-forms.pdf
                    or replace via the PDF Manager (link target can be updated). */}
                <li>
                  <a
                    href="/patient-forms.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-[#c9b896] transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-3 h-px bg-[#c9b896]/40 group-hover:w-4 group-hover:bg-[#c9b896] transition-all duration-200 inline-block"></span>
                    Patient Forms (PDF)
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c9b896] mb-5">Contact</h3>
            <div className="space-y-4 text-sm text-gray-400">
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#c9b896] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <a
                  href="https://maps.google.com/?q=5233+Dijon+Drive,+Baton+Rouge,+LA+70808"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#c9b896] transition-colors leading-relaxed"
                >
                  <EditableText
                    contentKey="footer_address"
                    defaultValue={"5233 Dijon Drive\nBaton Rouge, LA 70808"}
                    multiline
                    className="whitespace-pre-line block"
                  />
                </a>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#c9b896] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <a href="mailto:drh@hanemannplasticsurgery.com" className="hover:text-[#c9b896] transition-colors break-all">
                  drh@hanemannplasticsurgery.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#c9b896] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <a href="tel:2257662166" className="hover:text-[#c9b896] transition-colors">
                  <EditableText contentKey="footer_phone" defaultValue="(225) 766-2166" />
                </a>
              </div>
              <a
                href="https://maps.google.com/?q=5233+Dijon+Drive,+Baton+Rouge,+LA+70808"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#c9b896]/70 hover:text-[#c9b896] transition-colors border border-[#c9b896]/20 hover:border-[#c9b896]/50 rounded-full px-3 py-1.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Get Directions
              </a>
            </div>
          </div>

          {/* Column 4: Hours */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c9b896] mb-5">Office Hours</h3>
            <ul className="space-y-2.5 text-sm">
              {hours.map(({ day, hours: time }) => (
                <li key={day} className="flex justify-between gap-3">
                  <span className="text-gray-300">{day}</span>
                  <span className={`text-right whitespace-nowrap ${time === 'Closed' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {time}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onNavigate('Contact')}
              className="mt-8 w-full py-3 border border-[#c9b896]/40 text-[#c9b896] text-xs uppercase tracking-widest hover:bg-[#c9b896] hover:text-[#1a1f2e] transition-all duration-300 rounded-full"
            >
              Book a Consultation
            </button>
          </div>

        </div>
      </div>

      {/* Areas We Serve */}
      <div className="border-t border-white/10 pt-10 pb-10">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c9b896] mb-4">Areas We Serve</h3>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Proudly serving patients throughout Louisiana and beyond — from Baton Rouge and surrounding communities to out-of-state patients seeking exceptional care.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            {[
              'Baton Rouge', 'Alexandria', 'Pineville', 'Marksville', 'New Roads',
              'Lake Charles', 'Prairieville', 'Gonzales', 'Denham Springs',
              'Zachary', 'Central', 'Walker', 'Livingston Parish', 'Ascension Parish', 'East Baton Rouge Parish'
            ].map(area => (
              <span
                key={area}
                className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:border-[#c9b896]/40 hover:text-[#c9b896] transition-colors cursor-default"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10 py-6 text-center">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} Hanemann Plastic Surgery. All rights reserved.
          {' | '}
          {/* Discreet but real, crawlable link to the article library — keeps the
              recovered blog content out of the spotlight yet reachable by both
              visitors and search engines (a genuine <a href>, not hidden). */}
          <a
            href="/resources"
            onClick={(e) => { e.preventDefault(); onNavigate('Resources'); }}
            className="hover:text-[#c9b896] transition-colors text-gray-600/50"
          >
            Resources
          </a>
          {' | '}
          <button
            onClick={() => onNavigate('AdminLogin')}
            className="hover:text-[#c9b896] transition-colors text-gray-600/50"
          >
            Admin
          </button>
        </p>
      </div>
    </footer>
  );
}
