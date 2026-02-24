import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { EditableText } from '../cms/EditableText';
import { EditableImage } from '../cms/EditableImage';
import { SEOHead } from '../seo/SEOHead';
import { Breadcrumbs } from '../seo/Breadcrumbs';
import { motion } from 'framer-motion';

interface ContactProps {
  onNavigate: (page: string) => void;
  onOpenConsultation?: () => void;
}

export function Contact({ onNavigate, onOpenConsultation }: ContactProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    interest: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc862019/inquiries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          interestedIn: formData.interest,
          message: formData.message
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          interest: '',
          message: ''
        });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <SEOHead
        title="Contact Us | Schedule Your Consultation in Baton Rouge, LA"
        description="Contact Dr. Hanemann's plastic surgery practice in Baton Rouge, LA. Call (225) 766-2166 or schedule your private consultation online. Serving Baton Rouge, Prairieville, Gonzales, and surrounding areas."
        keywords="contact plastic surgeon, schedule consultation Baton Rouge, Baton Rouge plastic surgery appointment, Dr. Hanemann contact, 5233 Dijon Drive"
        canonical="/contact"
      />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Contact' }
      ]} />
      {/* Page Hero */}
      

      {/* Contact Form & Info Section */}
      <section className="py-24 bg-[#1a1f2e] relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#b8976a]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <EditableText
                contentKey="contact_form_heading"
                defaultValue="Schedule a Consultation"
                as="h2"
                className="mb-8 text-[#faf9f7]"
              />
              
              {submitted && (
                <motion.div 
                  className="mb-6 p-4 bg-green-900/30 border border-green-700/50 rounded-xl flex items-center gap-3"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-300">Thank you! Your inquiry has been submitted. We'll be in touch soon.</p>
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="mt-2 rounded-xl bg-[#2d3548] border-[#3d4558] text-white focus:border-[#c9b896] transition-colors"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="mt-2 rounded-xl bg-[#2d3548] border-[#3d4558] text-white focus:border-[#c9b896] transition-colors"
                      placeholder="Smith"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-2 rounded-xl bg-[#2d3548] border-[#3d4558] text-white focus:border-[#c9b896] transition-colors"
                    placeholder="john.smith@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-2 rounded-xl bg-[#2d3548] border-[#3d4558] text-white focus:border-[#c9b896] transition-colors"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="interest" className="text-gray-300">Area of Interest</Label>
                  <Select 
                    value={formData.interest}
                    onValueChange={(value) => setFormData({ ...formData, interest: value })}
                  >
                    <SelectTrigger className="mt-2 rounded-xl bg-[#2d3548] border-[#3d4558] text-white focus:border-[#c9b896] transition-colors">
                      <SelectValue placeholder="Select a procedure" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2d3548] border-[#3d4558]">
                      <SelectItem value="nose" className="text-white hover:bg-[#c9b896]/20">Nose / Rhinoplasty</SelectItem>
                      <SelectItem value="face" className="text-white hover:bg-[#c9b896]/20">Face / Facelift</SelectItem>
                      <SelectItem value="breast" className="text-white hover:bg-[#c9b896]/20">Breast Procedures</SelectItem>
                      <SelectItem value="body" className="text-white hover:bg-[#c9b896]/20">Body Contouring</SelectItem>
                      <SelectItem value="other" className="text-white hover:bg-[#c9b896]/20">Other / Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message" className="text-gray-300">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="mt-2 rounded-xl min-h-32 bg-[#2d3548] border-[#3d4558] text-white focus:border-[#c9b896] transition-colors"
                    placeholder="Tell us about your goals and any questions you have..."
                  />
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full rounded-full bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] shadow-lg hover:shadow-[#c9b896]/20 transition-all duration-300"
                    disabled={submitting}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </motion.div>

                <p className="text-xs text-gray-400 text-center">
                  By submitting this form, you consent to be contacted by our team. 
                  We respect your privacy and will never share your information.
                </p>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <EditableText
                contentKey="contact_info_heading"
                defaultValue="Get In Touch"
                as="h2"
                className="mb-8 text-[#faf9f7]"
              />
              
              <div className="space-y-8 mb-12">
                {[
                  { icon: Phone, label: 'Phone', key: 'phone' },
                  { icon: Mail, label: 'Email', key: 'email' },
                  { icon: MapPin, label: 'Address', key: 'address' },
                  { icon: Clock, label: 'Office Hours', key: 'hours' }
                ].map((item, idx) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="border-[#2d3548] bg-[#1a1f2e]/50 backdrop-blur rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-[#c9b896]/10 transition-all duration-300 group relative overflow-hidden">
                      {/* Hover glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#c9b896]/0 to-[#c9b896]/0 group-hover:from-[#c9b896]/5 group-hover:to-transparent transition-all duration-500"></div>
                      
                      <CardContent className="p-6 flex items-start gap-4 relative z-10">
                        <motion.div 
                          className="w-12 h-12 bg-[#c9b896]/20 rounded-full flex items-center justify-center flex-shrink-0"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <item.icon className="w-5 h-5 text-[#c9b896]" />
                        </motion.div>
                        <div>
                          <h3 className="mb-2 text-[#faf9f7]">{item.label}</h3>
                          {item.key === 'phone' && (
                            <>
                              <EditableText
                                contentKey="contact_phone_number"
                                defaultValue="(225) 766-2166"
                                as="p"
                                className="text-gray-300 mb-1"
                              />
                              <EditableText
                                contentKey="contact_phone_description"
                                defaultValue="Call us to schedule your consultation"
                                as="p"
                                className="text-gray-400 text-sm"
                              />
                            </>
                          )}
                          {item.key === 'email' && (
                            <>
                              <EditableText
                                contentKey="contact_email_address"
                                defaultValue="info@hanemannplasticsurgery.com"
                                as="p"
                                className="text-gray-300 mb-1"
                              />
                              <EditableText
                                contentKey="contact_email_description"
                                defaultValue="We'll respond within 24 hours"
                                as="p"
                                className="text-gray-400 text-sm"
                              />
                            </>
                          )}
                          {item.key === 'address' && (
                            <>
                              <EditableText
                                contentKey="contact_address_line1"
                                defaultValue="5233 Dijon Drive"
                                as="p"
                                className="text-gray-300 mb-1"
                              />
                              <EditableText
                                contentKey="contact_address_line2"
                                defaultValue="Baton Rouge, LA 70808"
                                as="p"
                                className="text-gray-300"
                              />
                            </>
                          )}
                          {item.key === 'hours' && (
                            <>
                              <EditableText
                                contentKey="contact_hours_weekdays"
                                defaultValue="Monday - Friday: 9:00 AM - 5:00 PM"
                                as="p"
                                className="text-gray-300 mb-1"
                              />
                              <EditableText
                                contentKey="contact_hours_weekend"
                                defaultValue="Saturday - Sunday: Closed"
                                as="p"
                                className="text-gray-300"
                              />
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-24 bg-gradient-to-b from-[#1a1f2e] to-[#242938] border-t border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <EditableText
              contentKey="contact_map_heading"
              defaultValue="Visit Our Office"
              as="h2"
              className="mb-4 text-[#faf9f7]"
            />
            <EditableText
              contentKey="contact_map_description"
              defaultValue="Conveniently located in Baton Rouge"
              as="p"
              className="text-gray-400"
            />
            
            {/* Gold accent divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent mx-auto mt-6"></div>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <motion.div 
              className="aspect-video rounded-2xl overflow-hidden shadow-2xl group"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Hover glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#c9b896]/20 to-[#b8976a]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <EditableImage
                contentKey="contact_map_image"
                defaultSrc="https://images.unsplash.com/photo-1759347171940-d79bc7024948?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwbWFwJTIwbG9jYXRpb258ZW58MXx8fHwxNzYzNTMxNzkzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Location Map"
                className="w-full h-full object-cover relative z-10"
                locationLabel="Contact Page - Map Image"
              />
            </motion.div>
            <motion.div 
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <EditableText
                contentKey="contact_parking_info"
                defaultValue="Free parking available in the building garage. Valet service also available."
                as="p"
                className="text-gray-300 mb-4"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="rounded-full border-[#c9b896] text-[#c9b896] hover:bg-[#c9b896] hover:text-[#1a1f2e] transition-all duration-300">
                  Get Directions
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Emergency Contact Notice */}
      <section className="py-16 bg-[#1a1f2e] border-y border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <EditableText
              contentKey="contact_emergency_notice"
              defaultValue="For existing patients with post-operative concerns: Please call our emergency line at (555) 123-4567. For medical emergencies, call 911 or visit your nearest emergency room."
              as="p"
              className="text-gray-300"
              multiline
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}