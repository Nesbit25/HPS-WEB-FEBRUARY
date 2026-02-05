import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { MessageCircle, CheckCircle } from 'lucide-react';
import { AccentLine, CircleAccent } from './DecorativeElements';

interface QuickContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickContactDialog({ open, onOpenChange }: QuickContactDialogProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    setFormData({ name: '', email: '', phone: '', message: '' });
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
              <DialogTitle className="text-center mb-2">Message Sent!</DialogTitle>
              <AccentLine className="mb-4" />
              <DialogDescription className="text-center">
                Thank you for reaching out. We'll respond to your inquiry within 24 hours.
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
              <MessageCircle className="w-8 h-8 text-secondary" />
            </div>
          </div>
          <DialogTitle className="text-center">Quick Contact</DialogTitle>
          <AccentLine className="mt-2" />
          <DialogDescription className="text-center mt-4">
            Have a question? Send us a quick message and we'll get back to you promptly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="quick-name">Name *</Label>
            <Input
              id="quick-name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="rounded-xl"
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-email">Email *</Label>
            <Input
              id="quick-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="rounded-xl"
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-phone">Phone (Optional)</Label>
            <Input
              id="quick-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="rounded-xl"
              placeholder="(225) 766-2166"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-message">Message *</Label>
            <Textarea
              id="quick-message"
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="rounded-xl min-h-32"
              placeholder="How can we help you?"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-primary hover:bg-primary/90"
          >
            Send Message
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
