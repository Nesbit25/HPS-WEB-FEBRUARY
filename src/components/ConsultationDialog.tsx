import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { AccentLine, CircleAccent } from './DecorativeElements';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsultationDialog({ open, onOpenChange }: ConsultationDialogProps) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [date, setDate] = useState<Date>();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContact: '',
    procedureInterest: '',
    additionalProcedures: [] as string[],
    hearAboutUs: '',
    consultationType: '',
    message: ''
  });

  const procedures = [
    'Rhinoplasty',
    'Facelift',
    'Eyelid Surgery',
    'Neck Lift',
    'Breast Augmentation',
    'Breast Lift',
    'Breast Reduction',
    'Tummy Tuck',
    'Liposuction',
    'Body Contouring',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;
      
      // Build complete message with all consultation details
      const fullMessage = `
CONSULTATION REQUEST

Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone}
Preferred Contact: ${formData.preferredContact}

Primary Procedure: ${formData.procedureInterest}
${formData.additionalProcedures.length > 0 ? `Additional Procedures: ${formData.additionalProcedures.join(', ')}` : ''}

Consultation Type: ${formData.consultationType}
${date ? `Preferred Date: ${format(date, 'PPP')}` : ''}
How They Heard About Us: ${formData.hearAboutUs}

${formData.message ? `Additional Information:\n${formData.message}` : ''}
      `.trim();
      
      const response = await fetch(`${serverUrl}/inquiries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          interestedIn: formData.procedureInterest,
          message: fullMessage
        })
      });

      if (response.ok) {
        console.log('✅ Consultation request submitted successfully');
        setSubmitted(true);
      } else {
        console.error('Failed to submit consultation request');
        alert('There was an error submitting your request. Please try again or call us directly.');
      }
    } catch (error) {
      console.error('Error submitting consultation form:', error);
      alert('There was an error submitting your request. Please try again or call us directly.');
    }
  };

  const handleNext = () => {
    // Validate step before proceeding
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.preferredContact) {
        alert('Please fill in all required fields before continuing.');
        return;
      }
    } else if (step === 2) {
      if (!formData.procedureInterest || !formData.hearAboutUs) {
        alert('Please select your procedure interest and how you heard about us.');
        return;
      }
    } else if (step === 3) {
      if (!formData.consultationType) {
        alert('Please select a consultation type.');
        return;
      }
    }
    
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const resetForm = () => {
    setStep(1);
    setSubmitted(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      preferredContact: '',
      procedureInterest: '',
      additionalProcedures: [],
      hearAboutUs: '',
      consultationType: '',
      message: ''
    });
    setDate(undefined);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Prevent accidental closure - only allow intentional close actions
  const handleOpenChange = (newOpen: boolean) => {
    // If trying to close (newOpen = false), only allow if form is submitted or user hasn't started
    if (!newOpen) {
      // Allow closing if submitted
      if (submitted) {
        handleClose();
        return;
      }
      
      // If user has started filling the form, confirm before closing
      const hasStartedForm = formData.firstName || formData.lastName || formData.email || 
                            formData.phone || formData.procedureInterest || formData.consultationType;
      
      if (hasStartedForm) {
        const confirmClose = window.confirm('Are you sure you want to close? Your progress will be lost.');
        if (confirmClose) {
          handleClose();
        }
        // If they don't confirm, do nothing (keep dialog open)
        return;
      }
      
      // If form is empty, allow closing
      handleClose();
    } else {
      // Allow opening
      onOpenChange(newOpen);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md bg-[#2d3548] border-[#c9b896]/20">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-[#c9b896]/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <CircleAccent size="lg" className="absolute inset-0 m-auto animate-pulse-subtle" />
              <CheckCircle className="w-10 h-10 text-[#c9b896]" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center mb-2 text-white">Thank You!</DialogTitle>
              <AccentLine className="mb-4" />
              <DialogDescription className="text-center text-gray-300">
                Your consultation request has been received. Our team will contact you within 24 hours to confirm your appointment.
              </DialogDescription>
            </DialogHeader>
            <Button 
              className="mt-8 rounded-full px-8 bg-[#c9b896] hover:bg-[#b8976a] text-[#1a1f2e]"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#2d3548] border-[#c9b896]/20">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <CircleAccent size="sm" />
          </div>
          <DialogTitle className="text-center text-white">Schedule Your Consultation</DialogTitle>
          <AccentLine className="mt-2" />
          <DialogDescription className="text-center mt-4 text-gray-300">
            Step {step} of 3 - {step === 1 ? 'Personal Information' : step === 2 ? 'Procedure Interests' : 'Preferences & Message'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white">First Name *</Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="rounded-xl bg-white/95 border-[#c9b896]/30 text-[#1a1f2e] placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white">Last Name *</Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="rounded-xl bg-white/95 border-[#c9b896]/30 text-[#1a1f2e] placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-xl bg-white/95 border-[#c9b896]/30 text-[#1a1f2e] placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-xl bg-white/95 border-[#c9b896]/30 text-[#1a1f2e] placeholder:text-gray-400"
                  placeholder="(225) 766-2166"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Preferred Contact Method *</Label>
                <Select value={formData.preferredContact} onValueChange={(value) => setFormData({ ...formData, preferredContact: value })}>
                  <SelectTrigger className="rounded-xl bg-white/95 border-[#c9b896]/30 text-[#1a1f2e]">
                    <SelectValue placeholder="Select contact method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="text">Text Message</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Procedure Interests */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Primary Procedure Interest *</Label>
                <Select value={formData.procedureInterest} onValueChange={(value) => setFormData({ ...formData, procedureInterest: value })}>
                  <SelectTrigger className="rounded-xl bg-white/95 border-[#c9b896]/30 text-[#1a1f2e]">
                    <SelectValue placeholder="Select a procedure" />
                  </SelectTrigger>
                  <SelectContent>
                    {procedures.map((proc) => (
                      <SelectItem key={proc} value={proc}>{proc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Additional Procedures (Optional)</Label>
                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 border border-[#c9b896]/30 rounded-xl bg-white/5">
                  {procedures.filter(p => p !== formData.procedureInterest).map((proc) => (
                    <div key={proc} className="flex items-center space-x-2">
                      <Checkbox
                        id={proc}
                        checked={formData.additionalProcedures.includes(proc)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, additionalProcedures: [...formData.additionalProcedures, proc] });
                          } else {
                            setFormData({ ...formData, additionalProcedures: formData.additionalProcedures.filter(p => p !== proc) });
                          }
                        }}
                      />
                      <label htmlFor={proc} className="text-sm cursor-pointer text-white">{proc}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">How did you hear about us? *</Label>
                <Select value={formData.hearAboutUs} onValueChange={(value) => setFormData({ ...formData, hearAboutUs: value })}>
                  <SelectTrigger className="rounded-xl bg-white/95 border-[#c9b896]/30 text-[#1a1f2e]">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Search</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="referral">Patient Referral</SelectItem>
                    <SelectItem value="physician">Physician Referral</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Preferences & Message */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Consultation Type *</Label>
                <Select value={formData.consultationType} onValueChange={(value) => setFormData({ ...formData, consultationType: value })}>
                  <SelectTrigger className="rounded-xl bg-white/95 border-[#c9b896]/30 text-[#1a1f2e]">
                    <SelectValue placeholder="Select consultation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">In-Person Consultation</SelectItem>
                    <SelectItem value="virtual">Virtual Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Preferred Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left rounded-xl bg-white/95 border-[#c9b896]/30 text-[#1a1f2e] hover:bg-white hover:text-[#1a1f2e]"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-white">Additional Information (Optional)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="rounded-xl min-h-32 bg-white/95 border-[#c9b896]/30 text-[#1a1f2e] placeholder:text-gray-400"
                  placeholder="Tell us more about your goals, questions, or concerns..."
                />
              </div>

              <div className="bg-[#c9b896]/10 rounded-xl p-4 border border-[#c9b896]/30">
                <p className="text-sm text-gray-300">
                  By submitting this form, you consent to be contacted by Hanemann Plastic Surgery regarding your consultation request. Your information will be kept confidential.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="rounded-full bg-white/10 border-[#c9b896]/30 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"
            >
              Back
            </Button>
            
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="rounded-full bg-[#c9b896] hover:bg-[#b8976a] text-[#1a1f2e]"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                className="rounded-full bg-[#c9b896] hover:bg-[#b8976a] text-[#1a1f2e]"
              >
                Submit Request
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}