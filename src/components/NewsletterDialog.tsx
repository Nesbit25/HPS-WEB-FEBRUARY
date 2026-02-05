import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Mail, CheckCircle } from 'lucide-react';
import { AccentLine, CircleAccent } from './DecorativeElements';

interface NewsletterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewsletterDialog({ open, onOpenChange }: NewsletterDialogProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    interests: [] as string[]
  });

  const interestOptions = [
    'Facial Procedures',
    'Breast Procedures',
    'Body Contouring',
    'Non-Surgical Options',
    'Patient Stories',
    'Special Offers'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    setFormData({ firstName: '', email: '', interests: [] });
    onOpenChange(false);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <CircleAccent size="lg" className="absolute inset-0 m-auto animate-pulse-subtle" />
              <CheckCircle className="w-10 h-10 text-secondary" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center mb-2">Welcome to Our Newsletter!</DialogTitle>
              <AccentLine className="mb-4" />
              <DialogDescription className="text-center">
                Thank you for subscribing. You'll receive our latest updates, educational content, and exclusive offers.
              </DialogDescription>
            </DialogHeader>
            <Button 
              className="mt-8 rounded-full px-8 bg-primary hover:bg-primary/90"
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center relative">
              <CircleAccent size="md" className="absolute inset-0 m-auto" />
              <Mail className="w-8 h-8 text-secondary" />
            </div>
          </div>
          <DialogTitle className="text-center">Stay Informed</DialogTitle>
          <AccentLine className="mt-2" />
          <DialogDescription className="text-center mt-4">
            Subscribe to receive educational content, before & after galleries, special offers, and the latest from Hanemann Plastic Surgery.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="newsletter-firstName">First Name *</Label>
            <Input
              id="newsletter-firstName"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="rounded-xl"
              placeholder="John"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newsletter-email">Email Address *</Label>
            <Input
              id="newsletter-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="rounded-xl"
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-3">
            <Label>Content Interests (Optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              {interestOptions.map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox
                    id={`interest-${interest}`}
                    checked={formData.interests.includes(interest)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ ...formData, interests: [...formData.interests, interest] });
                      } else {
                        setFormData({ ...formData, interests: formData.interests.filter(i => i !== interest) });
                      }
                    }}
                  />
                  <label htmlFor={`interest-${interest}`} className="text-sm cursor-pointer">
                    {interest}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/20 rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">
              We respect your privacy. Your information will never be shared with third parties. You can unsubscribe at any time.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-secondary hover:bg-secondary/90 text-primary"
          >
            Subscribe to Newsletter
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
