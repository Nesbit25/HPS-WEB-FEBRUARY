import React from 'react';
import { SEOHead } from '../seo/SEOHead';
import { FileText, Download, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { motion } from 'framer-motion';

interface PatientFormsProps {
  onNavigate: (page: string) => void;
}

export function PatientForms({ onNavigate }: PatientFormsProps) {
  const forms = [
    {
      id: 'demographics',
      title: 'Patient Demographics Form',
      description: 'Basic personal and contact information, insurance details, and emergency contacts.',
      estimatedTime: '5-7 minutes',
      required: true
    },
    {
      id: 'cosmetic-packet',
      title: 'Cosmetic Surgery Packet',
      description: 'Medical history, current medications, allergies, and surgical goals.',
      estimatedTime: '10-15 minutes',
      required: true
    },
    {
      id: 'nicotine',
      title: 'Nicotine Use Statement',
      description: 'Declaration of nicotine and tobacco product usage (required for all surgical procedures).',
      estimatedTime: '2 minutes',
      required: true
    },
    {
      id: 'privacy-consent',
      title: 'HIPAA Privacy & Consent',
      description: 'Privacy practices, consent for treatment, and authorization forms.',
      estimatedTime: '5 minutes',
      required: true
    },
    {
      id: 'medical-clearance',
      title: 'Medical Clearance Form',
      description: 'To be completed by your primary care physician if you have existing medical conditions.',
      estimatedTime: '3 minutes',
      required: false
    },
    {
      id: 'photo-consent',
      title: 'Surgical Photography Consent',
      description: 'Authorization for before/after medical photography for your records.',
      estimatedTime: '2 minutes',
      required: false
    }
  ];

  return (
    <>
      <SEOHead
        title="Patient Forms | Hanemann Plastic Surgery"
        description="Complete your patient intake forms online before your consultation at Hanemann Plastic Surgery in Baton Rouge, LA. Download or fill out forms digitally."
        path="/patient-forms"
      />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-[#1a1f2e] text-white py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl">
              <p className="text-sm tracking-[0.3em] uppercase text-[#c9b896] mb-4">
                Prepare for Your Visit
              </p>
              <h1 className="font-serif text-4xl md:text-5xl mb-6">
                Patient Forms
              </h1>
              <p className="text-lg text-white/80 leading-relaxed">
                Save time during your visit by completing these forms in advance. All forms are secure and confidential.
              </p>
            </div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="py-12 bg-[#faf9f7]">
          <div className="container mx-auto px-6">
            <Alert className="max-w-4xl mx-auto border-[#c9b896] bg-white">
              <AlertCircle className="h-5 w-5 text-[#c9b896]" />
              <AlertDescription className="text-[#1a1f2e]">
                <span className="font-semibold">Important:</span> Forms must be completed and submitted in one session. 
                Information will not be saved if you leave the page. Please set aside adequate time to complete all required forms.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Forms List */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-4">
                {forms.map((form) => (
                  <Card 
                    key={form.id} 
                    className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-[#c9b896] cursor-pointer group"
                    onClick={() => onNavigate(`PatientForm-${form.id}`)}
                  >
                    <div className="flex items-start gap-6">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-lg bg-[#faf9f7] flex items-center justify-center group-hover:bg-[#c9b896]/10 transition-colors">
                          <FileText className="w-7 h-7 text-[#c9b896]" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-serif text-xl text-[#1a1f2e] group-hover:text-[#c9b896] transition-colors">
                            {form.title}
                            {form.required && (
                              <span className="ml-2 text-xs uppercase tracking-wider text-red-600 font-sans">
                                Required
                              </span>
                            )}
                          </h3>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#c9b896] group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                        
                        <p className="text-gray-600 mb-3 leading-relaxed">
                          {form.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
                            </svg>
                            {form.estimatedTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4 ml-20">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(`PatientForm-${form.id}`);
                        }}
                        className="bg-[#1a1f2e] text-white hover:bg-[#2d3548] px-6 py-2 text-sm uppercase tracking-wider rounded-none"
                      >
                        Fill Out Online
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download PDF functionality would go here
                          console.log(`Download PDF: ${form.id}`);
                        }}
                        variant="outline"
                        className="border-[#1a1f2e] text-[#1a1f2e] hover:bg-[#1a1f2e] hover:text-white px-6 py-2 text-sm uppercase tracking-wider rounded-none"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Additional Information */}
        <section className="py-16 bg-[#faf9f7]">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <Card className="p-8 border-none shadow-md">
                <h3 className="font-serif text-2xl text-[#1a1f2e] mb-4">
                  First-Time Patients
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  If this is your first visit, please complete all required forms at least 24 hours before your scheduled appointment. This helps us prepare for your consultation.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-[#c9b896] mt-1">•</span>
                    <span>Bring a valid photo ID</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#c9b896] mt-1">•</span>
                    <span>Bring insurance card (if applicable)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#c9b896] mt-1">•</span>
                    <span>List of current medications</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 border-none shadow-md">
                <h3 className="font-serif text-2xl text-[#1a1f2e] mb-4">
                  Questions or Assistance?
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  If you need help completing forms or have questions about what to bring to your appointment, our patient coordinators are here to help.
                </p>
                <Button
                  onClick={() => window.location.href = 'tel:+12257662166'}
                  className="bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] px-8 py-3 text-sm uppercase tracking-wider rounded-none w-full"
                >
                  Call (225) 766-2166
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* Help Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <h3 className="font-serif text-3xl text-[#1a1f2e] mb-6">
              Need to Reschedule?
            </h3>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              We understand that schedules change. Please contact our office at least 48 hours in advance if you need to reschedule your appointment.
            </p>
            <Button
              onClick={() => onNavigate('Contact')}
              variant="outline"
              className="border-2 border-[#1a1f2e] text-[#1a1f2e] hover:bg-[#1a1f2e] hover:text-white px-10 py-3 text-sm uppercase tracking-wider rounded-none"
            >
              Contact Our Office
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}