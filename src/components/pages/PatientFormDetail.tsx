import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SEOHead } from '../seo/SEOHead';
import { AlertCircle, ArrowLeft, Save, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { usePatientAuth } from '../../contexts/PatientAuthContext';

interface PatientFormDetailProps {
  onNavigate: (page: string) => void;
}

export function PatientFormDetail({ onNavigate }: PatientFormDetailProps) {
  const { id: formId } = useParams<{ id: string }>();
  const { user } = usePatientAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;
  
  const formConfigs: Record<string, any> = {
    'demographics': {
      title: 'Patient Demographics Form',
      description: 'Please provide your basic information to help us serve you better.',
      fields: [
        { type: 'section', label: 'Personal Information' },
        { type: 'text', name: 'firstName', label: 'First Name', required: true },
        { type: 'text', name: 'middleName', label: 'Middle Name' },
        { type: 'text', name: 'lastName', label: 'Last Name', required: true },
        { type: 'date', name: 'dob', label: 'Date of Birth', required: true },
        { type: 'text', name: 'ssn', label: 'Social Security Number (last 4 digits)', maxLength: 4 },
        { type: 'section', label: 'Contact Information' },
        { type: 'email', name: 'email', label: 'Email Address', required: true },
        { type: 'tel', name: 'phone', label: 'Primary Phone', required: true },
        { type: 'tel', name: 'phoneAlt', label: 'Alternative Phone' },
        { type: 'text', name: 'address', label: 'Street Address', required: true },
        { type: 'text', name: 'city', label: 'City', required: true },
        { type: 'text', name: 'state', label: 'State', required: true },
        { type: 'text', name: 'zip', label: 'ZIP Code', required: true },
        { type: 'section', label: 'Emergency Contact' },
        { type: 'text', name: 'emergencyName', label: 'Emergency Contact Name', required: true },
        { type: 'text', name: 'emergencyRelationship', label: 'Relationship', required: true },
        { type: 'tel', name: 'emergencyPhone', label: 'Emergency Contact Phone', required: true },
      ]
    },
    'cosmetic-packet': {
      title: 'Cosmetic Surgery Packet',
      description: 'Help us understand your medical history and aesthetic goals.',
      fields: [
        { type: 'section', label: 'Medical History' },
        { type: 'textarea', name: 'currentMedications', label: 'Current Medications (include dosage)', rows: 4 },
        { type: 'textarea', name: 'allergies', label: 'Known Allergies (medications, latex, etc.)', rows: 3 },
        { type: 'textarea', name: 'medicalConditions', label: 'Current Medical Conditions', rows: 4 },
        { type: 'textarea', name: 'previousSurgeries', label: 'Previous Surgeries (including dates)', rows: 4 },
        { type: 'radio', name: 'pregnant', label: 'Are you pregnant or breastfeeding?', options: ['No', 'Yes', 'Possibly'], required: true },
        { type: 'section', label: 'Surgical Goals' },
        { type: 'textarea', name: 'procedureInterest', label: 'Procedures You Are Interested In', rows: 3, required: true },
        { type: 'textarea', name: 'goals', label: 'What are your aesthetic goals?', rows: 5, required: true },
        { type: 'textarea', name: 'concerns', label: 'What concerns would you like to address?', rows: 4 },
        { type: 'text', name: 'desiredTimeline', label: 'Desired Surgery Timeline (e.g., 3-6 months)' },
      ]
    },
    'nicotine': {
      title: 'Nicotine Use Statement',
      description: 'Nicotine use can significantly impact surgical outcomes and healing.',
      fields: [
        { type: 'section', label: 'Tobacco & Nicotine Usage' },
        { type: 'radio', name: 'currentSmoker', label: 'Do you currently use any tobacco products?', options: ['No', 'Yes'], required: true },
        { type: 'radio', name: 'nicotineProducts', label: 'Do you use nicotine replacement products (patches, gum, vaping)?', options: ['No', 'Yes'], required: true },
        { type: 'text', name: 'productDetails', label: 'If yes, please specify product and frequency' },
        { type: 'radio', name: 'formerSmoker', label: 'Have you used tobacco/nicotine in the past?', options: ['No', 'Yes'], required: true },
        { type: 'text', name: 'quitDate', label: 'If former user, when did you quit?' },
        { type: 'section', label: 'Acknowledgment' },
        { type: 'checkbox', name: 'understand', label: 'I understand that nicotine use must cease at least 4 weeks before surgery and during recovery', required: true },
        { type: 'checkbox', name: 'disclose', label: 'I have truthfully disclosed all tobacco and nicotine usage', required: true },
      ]
    },
    'privacy-consent': {
      title: 'HIPAA Privacy & Consent for Treatment',
      description: 'Please review and consent to our privacy practices and treatment policies.',
      fields: [
        { type: 'section', label: 'Privacy Practices' },
        { type: 'info', content: 'We are committed to protecting your health information. Our Notice of Privacy Practices describes how medical information about you may be used and disclosed, and how you can access this information.' },
        { type: 'checkbox', name: 'receivedPrivacy', label: 'I have received and reviewed the Notice of Privacy Practices', required: true },
        { type: 'section', label: 'Consent for Treatment' },
        { type: 'checkbox', name: 'consentTreatment', label: 'I consent to medical treatment and surgical procedures as recommended by Dr. Hanemann', required: true },
        { type: 'checkbox', name: 'consentPhotos', label: 'I consent to medical photography for my records (before/after documentation)', required: true },
        { type: 'checkbox', name: 'financialResponsibility', label: 'I understand I am financially responsible for all services rendered', required: true },
        { type: 'section', label: 'Communication Preferences' },
        { type: 'checkbox', name: 'contactPhone', label: 'You may contact me by phone' },
        { type: 'checkbox', name: 'contactEmail', label: 'You may contact me by email' },
        { type: 'checkbox', name: 'contactText', label: 'You may contact me by text message' },
        { type: 'checkbox', name: 'appointmentReminders', label: 'I would like to receive appointment reminders' },
      ]
    },
    'medical-clearance': {
      title: 'Medical Clearance Form',
      description: 'To be completed by your primary care physician or specialist.',
      fields: [
        { type: 'section', label: 'Patient Information' },
        { type: 'text', name: 'patientName', label: 'Patient Full Name', required: true },
        { type: 'date', name: 'dob', label: 'Date of Birth', required: true },
        { type: 'text', name: 'plannedProcedure', label: 'Planned Surgical Procedure', required: true },
        { type: 'section', label: 'Physician Information' },
        { type: 'text', name: 'physicianName', label: 'Physician Name', required: true },
        { type: 'text', name: 'physicianPractice', label: 'Practice/Facility Name', required: true },
        { type: 'tel', name: 'physicianPhone', label: 'Phone Number', required: true },
        { type: 'section', label: 'Medical Clearance' },
        { type: 'textarea', name: 'medicalConditions', label: 'Current Medical Conditions', rows: 4 },
        { type: 'textarea', name: 'medications', label: 'Current Medications', rows: 4 },
        { type: 'radio', name: 'clearanceStatus', label: 'Patient is cleared for surgery under general anesthesia', options: ['Yes', 'No', 'Cleared with conditions'], required: true },
        { type: 'textarea', name: 'conditions', label: 'If cleared with conditions, please specify', rows: 3 },
        { type: 'textarea', name: 'recommendations', label: 'Additional recommendations or precautions', rows: 4 },
      ]
    },
    'photo-consent': {
      title: 'Surgical Photography Consent',
      description: 'Authorization for medical photography and image usage.',
      fields: [
        { type: 'section', label: 'Photography Purpose' },
        { type: 'info', content: 'Before and after photographs are an important part of your medical record and help document your surgical journey. These photos are taken in a professional, medical manner to capture only the areas being treated.' },
        { type: 'section', label: 'Consent for Photography' },
        { type: 'checkbox', name: 'consentPhotos', label: 'I consent to before and after photographs for my medical records', required: true },
        { type: 'checkbox', name: 'consentEducational', label: 'I consent to use of my photos for educational purposes (medical conferences, training)', required: false },
        { type: 'checkbox', name: 'consentMarketing', label: 'I consent to use of my photos for practice marketing (website, social media, brochures)', required: false },
        { type: 'section', label: 'Privacy & Usage' },
        { type: 'radio', name: 'identityPreference', label: 'Photo Usage Preference', options: ['Photos may include my face', 'Please exclude my face/identifying features', 'Photos for medical record only'], required: true },
        { type: 'info', content: 'All photographs remain the property of Hanemann Plastic Surgery and will be stored securely. You may revoke consent for marketing use at any time by written request.' },
        { type: 'section', label: 'Acknowledgment' },
        { type: 'checkbox', name: 'understand', label: 'I understand this consent and have had opportunity to ask questions', required: true },
      ]
    }
  };

  const currentForm = formConfigs[formId] || formConfigs['demographics'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Extract form data
      const formElement = e.target as HTMLFormElement;
      const formData = new FormData(formElement);
      const data: Record<string, any> = {
        formType: formId,
        formTitle: currentForm.title
      };
      
      // Add user ID if logged in
      if (user) {
        data.userId = user.id;
        // Auto-fill firstName and lastName from user profile if not in form
        if (!formData.has('firstName') && user.firstName) {
          data.firstName = user.firstName;
        }
        if (!formData.has('lastName') && user.lastName) {
          data.lastName = user.lastName;
        }
      }
      
      // Convert FormData to object
      formData.forEach((value, key) => {
        // Handle checkboxes - if they exist, they're checked
        if (value === 'on') {
          data[key] = true;
        } else {
          data[key] = value;
        }
      });
      
      console.log('Submitting form data:', data);
      
      // Submit to backend
      const response = await fetch(`${serverUrl}/patient-forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }
      
      const result = await response.json();
      console.log('Form submitted successfully:', result);
      
      alert('Form submitted successfully! Your information has been saved.');
      onNavigate('Patient Forms');
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: any, index: number) => {
    switch (field.type) {
      case 'section':
        return (
          <div key={index} className="col-span-2 mt-8 first:mt-0 mb-4 pb-3 border-b-2 border-[#c9b896]">
            <h3 className="font-serif text-2xl text-[#1a1f2e]">{field.label}</h3>
          </div>
        );
      
      case 'info':
        return (
          <div key={index} className="col-span-2 mb-4">
            <Alert className="border-[#c9b896]/30 bg-[#faf9f7]">
              <AlertCircle className="h-4 w-4 text-[#c9b896]" />
              <AlertDescription className="text-gray-700">
                {field.content}
              </AlertDescription>
            </Alert>
          </div>
        );
      
      case 'text':
      case 'email':
      case 'tel':
      case 'date':
        return (
          <div key={index} className={field.label?.includes('Street Address') ? 'col-span-2' : ''}>
            <Label htmlFor={field.name} className="text-[#1a1f2e] mb-2 block">
              {field.label}
              {field.required && <span className="text-red-600 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              required={field.required}
              maxLength={field.maxLength}
              className="rounded-none border-gray-300 focus:border-[#c9b896]"
            />
          </div>
        );
      
      case 'textarea':
        return (
          <div key={index} className="col-span-2">
            <Label htmlFor={field.name} className="text-[#1a1f2e] mb-2 block">
              {field.label}
              {field.required && <span className="text-red-600 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              name={field.name}
              required={field.required}
              rows={field.rows || 4}
              className="rounded-none border-gray-300 focus:border-[#c9b896]"
            />
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={index} className="col-span-2 flex items-start gap-3">
            <Checkbox 
              id={field.name} 
              name={field.name}
              required={field.required}
              className="mt-1"
            />
            <Label htmlFor={field.name} className="text-[#1a1f2e] cursor-pointer leading-relaxed">
              {field.label}
              {field.required && <span className="text-red-600 ml-1">*</span>}
            </Label>
          </div>
        );
      
      case 'radio':
        return (
          <div key={index} className="col-span-2">
            <Label className="text-[#1a1f2e] mb-3 block">
              {field.label}
              {field.required && <span className="text-red-600 ml-1">*</span>}
            </Label>
            <RadioGroup name={field.name} required={field.required}>
              <div className="space-y-2">
                {field.options?.map((option: string, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <RadioGroupItem value={option} id={`${field.name}-${i}`} />
                    <Label htmlFor={`${field.name}-${i}`} className="cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <SEOHead
        title={`${currentForm.title} | Hanemann Plastic Surgery`}
        description={currentForm.description}
        path={`/patient-forms/${formId}`}
      />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <section className="bg-[#1a1f2e] text-white py-12 border-b border-[#2d3548]">
          <div className="container mx-auto px-6">
            <Button
              onClick={() => onNavigate('Patient Forms')}
              variant="ghost"
              className="text-white hover:text-[#c9b896] mb-6 -ml-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Forms
            </Button>
            <div className="max-w-4xl">
              <h1 className="font-serif text-3xl md:text-4xl mb-3">
                {currentForm.title}
              </h1>
              <p className="text-white/80">
                {currentForm.description}
              </p>
            </div>
          </div>
        </section>

        {/* Warning Alert */}
        <section className="py-8 bg-[#faf9f7] border-b">
          <div className="container mx-auto px-6">
            <Alert className="max-w-4xl mx-auto border-amber-500 bg-amber-50">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <span className="font-semibold">Important:</span> This form must be completed and submitted in one session. 
                Information will not be saved if you leave this page. Please complete all fields before submitting.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Form */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="bg-white border-2 border-gray-200 p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-6">
                  {currentForm.fields.map((field: any, index: number) => renderField(field, index))}
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t-2 border-gray-200">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] px-12 py-6 text-base uppercase tracking-wider rounded-none flex-1"
                  >
                    <Save className="w-5 h-5 mr-3" />
                    {isSubmitting ? 'Submitting...' : 'Submit Form'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.print()}
                    className="border-2 border-[#1a1f2e] text-[#1a1f2e] hover:bg-[#1a1f2e] hover:text-white px-8 py-6 text-base uppercase tracking-wider rounded-none"
                  >
                    <Download className="w-5 h-5 mr-3" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* Help Section */}
        <section className="py-12 bg-[#faf9f7]">
          <div className="container mx-auto px-6 text-center max-w-2xl">
            <h3 className="font-serif text-2xl text-[#1a1f2e] mb-4">
              Need Assistance?
            </h3>
            <p className="text-gray-600 mb-6">
              If you have questions while completing this form, please contact our office.
            </p>
            <Button
              onClick={() => window.location.href = 'tel:+12257662166'}
              variant="outline"
              className="border-2 border-[#1a1f2e] text-[#1a1f2e] hover:bg-[#1a1f2e] hover:text-white px-10 py-3 text-sm uppercase tracking-wider rounded-none"
            >
              Call (225) 766-2166
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}