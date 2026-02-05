import React from 'react';
import { useEditMode } from '../../contexts/EditModeContext';
import { AccentLine, CircleAccent } from '../DecorativeElements';
import { Award, GraduationCap, Heart, Users, BookOpen } from 'lucide-react';
import { EditableText } from '../cms/EditableText';
import { EditableImage } from '../cms/EditableImage';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { SEOHead } from '../seo/SEOHead';
import { motion } from 'framer-motion';

interface AboutProps {
  onNavigate: (page: string) => void;
}

export function About({ onNavigate }: AboutProps) {
  const credentials = [
    { icon: Award, title: 'Double Board Certified', description: 'American Board of Plastic Surgery & Otolaryngology' },
    { icon: GraduationCap, title: 'Elite Training', description: 'LSU, UNC Chapel Hill, UAB Fellowship' },
    { icon: Users, title: 'Experience', description: 'In private practice since 2009' },
    { icon: BookOpen, title: 'Academic Leader', description: 'Faculty at LSU & Tulane Schools of Medicine' }
  ];

  const education = [
    { degree: 'Bachelor of Arts with High Honors', institution: 'The University of Texas at Austin' },
    { degree: 'Medical Doctorate (MD)', institution: 'Louisiana State University School of Medicine, New Orleans' },
    { degree: 'Residency: Otolaryngology – Head and Neck Surgery', institution: 'LSU School of Medicine, New Orleans' },
    { degree: 'Residency: Plastic Surgery', institution: 'University of North Carolina – Chapel Hill' },
    { degree: 'Fellowship: Aesthetic Surgery & Breast Reconstruction', institution: 'University of Alabama – Birmingham' }
  ];

  const affiliations = [
    'American Board of Plastic Surgery (Board Certified)',
    'American Board of Otolaryngology – Head and Neck Surgery (Board Certified)',
    'Louisiana Society of Plastic Surgeons (Past President)',
    'Capital Area Medical Society (Past President)',
    'Southeastern Society of Plastic and Reconstructive Surgeons (Board Member)',
    'Louisiana State Medical Society\'s Council on Legislation (Member)',
    'Faculty Member, Division of Plastic Surgery at LSU School of Medicine',
    'Faculty Member, Division of Plastic Surgery at Tulane School of Medicine'
  ];

  return (
    <div>
      <SEOHead
        title="About Dr. Michael Hanemann, MD | Board-Certified Plastic Surgeon"
        description="Meet Dr. Michael Hanemann, a double board-certified plastic surgeon in Baton Rouge with over 15 years of experience. Faculty at LSU & Tulane medical schools, specializing in facial aesthetics and body contouring."
        keywords="Dr. Hanemann, board certified plastic surgeon, Baton Rouge plastic surgeon, facial plastic surgery, double board certified, LSU plastic surgeon"
        canonical="/about"
      />
      {/* Page Hero */}
      <section className="relative bg-gradient-to-br from-[#242938] to-[#1a1f2e] py-32 border-b border-[#2d3548] overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#c9b896]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#b8976a]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <EditableText
              contentKey="about_hero_heading"
              defaultValue="About Dr. Hanemann"
              as="h1"
              className="mb-6 text-[#faf9f7]"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <EditableText
              contentKey="about_hero_description"
              defaultValue="Double board-certified plastic surgeon dedicated to delivering exceptional results through precision, artistry, and compassionate care"
              as="p"
              className="text-gray-300 max-w-3xl mx-auto text-lg"
            />
          </motion.div>
          
          {/* Gold accent divider */}
          <motion.div 
            className="w-24 h-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent mx-auto mt-8"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 96, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
        </div>
      </section>

      {/* Doctor Bio Section */}
      <section className="py-24 bg-[#1a1f2e] relative overflow-hidden">
        {/* Ambient background elements */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#b8976a]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div 
              className="aspect-[3/4] bg-gradient-to-br from-[#2d3548] to-[#1a1f2e] rounded-2xl overflow-hidden shadow-2xl relative group"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Gold corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#c9b896]/30 to-transparent"></div>
              </div>
              
              <EditableImage
                contentKey="about_doctor_portrait"
                defaultSrc="https://images.unsplash.com/photo-1755189118414-14c8dacdb082?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkb2N0b3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjM1MTE5NDl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Dr. Hanemann Portrait"
                className="w-full h-full object-cover"
                locationLabel="About Page - Doctor Portrait"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <EditableText
                contentKey="about_bio_heading"
                defaultValue="Meet Dr. Michael S. Hanemann Jr., MD"
                as="h2"
                className="mb-6 text-[#faf9f7]"
              />
              <div className="space-y-4 text-gray-300">
                <EditableText
                  contentKey="about_bio_paragraph_1"
                  defaultValue="Dr. Michael Hanemann is a double board certified plastic surgeon in Baton Rouge, Louisiana. He is board certified by the American Board of Plastic Surgery and the American Board of Otolaryngology–Head and Neck Surgery. Dr. Hanemann specializes in aesthetic (cosmetic) plastic surgery of the face, breasts, and body."
                  as="p"
                  multiline
                />
                <EditableText
                  contentKey="about_bio_paragraph_2"
                  defaultValue="Dr. Hanemann has been in private practice since 2009, bringing over 15 years of expertise to his patients. His dual board certifications provide him with unique insights into both facial aesthetics and comprehensive plastic surgery."
                  as="p"
                  multiline
                />
                <EditableText
                  contentKey="about_bio_paragraph_3"
                  defaultValue="Dr. Hanemann has published numerous peer reviewed journal articles and book chapters in the plastic surgery literature and has presented his research at regional, national, and international meetings."
                  as="p"
                  multiline
                />
                <EditableText
                  contentKey="about_bio_paragraph_4"
                  defaultValue="As a faculty member of the Division of Plastic Surgery at LSU and Tulane Schools of Medicine, Dr. Hanemann is actively involved in the training of plastic surgery residents in cosmetic surgery and breast reconstruction."
                  as="p"
                  multiline
                />
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="mt-8 rounded-full bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] shadow-lg hover:shadow-[#c9b896]/20 transition-all duration-300"
                  onClick={() => onNavigate('Contact')}
                >
                  Schedule a Consultation
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Credentials Section */}
      <section className="py-24 bg-gradient-to-b from-[#1a1f2e] to-[#242938] border-t border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator at top */}
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
              contentKey="about_credentials_heading"
              defaultValue="Credentials & Experience"
              as="h2"
              className="mb-4 text-[#faf9f7]"
            />
            <EditableText
              contentKey="about_credentials_description"
              defaultValue="Recognized expertise and commitment to excellence in plastic surgery"
              as="p"
              className="text-gray-400 max-w-2xl mx-auto"
            />
            
            {/* Gold accent divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent mx-auto mt-6"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {credentials.map((credential, idx) => (
              <motion.div
                key={credential.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card className="border-[#2d3548] bg-[#1a1f2e]/50 backdrop-blur rounded-2xl text-center hover:border-[#c9b896]/30 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#c9b896]/10 group relative overflow-hidden h-full">
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c9b896]/0 to-[#c9b896]/0 group-hover:from-[#c9b896]/5 group-hover:to-transparent transition-all duration-500"></div>
                  
                  <CardContent className="p-8 relative z-10">
                    <motion.div 
                      className="w-16 h-16 bg-[#c9b896] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <credential.icon className="w-8 h-8 text-[#1a1f2e]" />
                    </motion.div>
                    <EditableText
                      contentKey={`about_credential_${idx}_title`}
                      defaultValue={credential.title}
                      as="h3"
                      className="mb-2 text-[#faf9f7]"
                    />
                    <EditableText
                      contentKey={`about_credential_${idx}_description`}
                      defaultValue={credential.description}
                      as="p"
                      className="text-gray-400 text-sm"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Education & Training Section */}
      <section className="py-24 bg-[#1a1f2e] border-t border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <EditableText
              contentKey="about_education_heading"
              defaultValue="Education & Training"
              as="h2"
              className="mb-4 text-[#faf9f7]"
            />
            <EditableText
              contentKey="about_education_description"
              defaultValue="Trained at the nation's leading institutions"
              as="p"
              className="text-gray-400"
            />
            
            {/* Gold accent divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent mx-auto mt-6"></div>
          </motion.div>

          <div className="space-y-6">
            <motion.div 
              className="border-l-4 border-[#c9b896] pl-6 py-3 hover:bg-[#c9b896]/5 transition-colors duration-300 rounded-r"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <EditableText
                contentKey="about_education_high_school"
                defaultValue="Jesuit High School – New Orleans, LA (Summa Cum Laude)"
                as="p"
                className="mb-1 text-[#faf9f7]"
              />
            </motion.div>
            {education.map((item, index) => (
              <motion.div 
                key={index} 
                className="border-l-4 border-[#c9b896] pl-6 py-3 hover:bg-[#c9b896]/5 transition-colors duration-300 rounded-r"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <EditableText
                  contentKey={`about_education_${index}_degree`}
                  defaultValue={item.degree}
                  as="h3"
                  className="mb-1 text-[#faf9f7]"
                />
                <EditableText
                  contentKey={`about_education_${index}_institution`}
                  defaultValue={item.institution}
                  as="p"
                  className="text-gray-400"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Affiliations */}
      <section className="py-24 bg-gradient-to-b from-[#1a1f2e] to-[#242938] border-t border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        
        {/* Ambient glow */}
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <EditableText
              contentKey="about_affiliations_heading"
              defaultValue="Professional Affiliations & Leadership"
              as="h2"
              className="mb-4 text-[#faf9f7]"
            />
            <EditableText
              contentKey="about_affiliations_description"
              defaultValue="Active involvement in professional organizations and medical education"
              as="p"
              className="text-gray-400"
            />
            
            {/* Gold accent divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent mx-auto mt-6"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {affiliations.map((affiliation, index) => (
              <motion.div 
                key={index} 
                className="flex items-start gap-3 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="w-2 h-2 bg-[#c9b896] rounded-full mt-2 flex-shrink-0 group-hover:scale-150 transition-transform duration-300"></div>
                <EditableText
                  contentKey={`about_affiliation_${index}`}
                  defaultValue={affiliation}
                  as="p"
                  className="text-gray-300 group-hover:text-[#faf9f7] transition-colors duration-300"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* In-Office Operating Room */}
      <section className="py-24 bg-[#1a1f2e] border-t border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        
        {/* Ambient glows */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <EditableText
              contentKey="about_operating_room_heading"
              defaultValue="State-of-the-Art In-Office Operating Room"
              as="h2"
              className="mb-6 text-[#faf9f7]"
            />
            <EditableText
              contentKey="about_operating_room_description"
              defaultValue="With an in-Office Operating Room equipped with the latest equipment, we offer a variety of cosmetic surgical procedures that are private and safe. Our accredited facility provides the highest standards of patient care in a comfortable, confidential setting."
              as="p"
              className="text-gray-300 leading-relaxed max-w-3xl mx-auto"
              multiline
            />
            
            {/* Gold accent divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent mx-auto mt-6"></div>
          </motion.div>
          
          {/* Facility Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div 
              className="aspect-[4/3] relative group"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Hover glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#c9b896]/20 to-[#b8976a]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <EditableImage
                contentKey="about_facility_operating_room"
                defaultSrc="https://images.unsplash.com/photo-1669930605340-801a0be1f5a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvcGVyYXRpbmclMjByb29tfGVufDF8fHx8MTc2MzU3ODM0M3ww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="State-of-the-Art Operating Room"
                className="w-full h-full object-cover rounded-2xl shadow-2xl relative z-10"
                locationLabel="About Page - Operating Room"
              />
            </motion.div>
            <motion.div 
              className="aspect-[4/3] relative group"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Hover glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#c9b896]/20 to-[#b8976a]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <EditableImage
                contentKey="about_facility_waiting_room"
                defaultSrc="https://images.unsplash.com/photo-1732376800702-c555160a4f21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwd2FpdGluZyUyMHJvb218ZW58MXx8fHwxNzYzNTc4MzQzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Comfortable Waiting Room"
                className="w-full h-full object-cover rounded-2xl shadow-2xl relative z-10"
                locationLabel="About Page - Waiting Room"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 bg-gradient-to-b from-[#1a1f2e] to-[#242938] border-t border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <EditableText
              contentKey="about_philosophy_heading"
              defaultValue="Our Philosophy"
              as="h2"
              className="mb-4 text-[#faf9f7]"
            />
            <EditableText
              contentKey="about_philosophy_description"
              defaultValue="Commitment to excellence, safety, and patient satisfaction"
              as="p"
              className="text-gray-400"
            />
            
            {/* Gold accent divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent mx-auto mt-6"></div>
          </motion.div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -4 }}
            >
              <Card className="border-[#2d3548] bg-[#1a1f2e]/50 backdrop-blur rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-[#c9b896]/10 transition-all duration-300 group relative overflow-hidden">
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#c9b896]/0 to-[#c9b896]/0 group-hover:from-[#c9b896]/5 group-hover:to-transparent transition-all duration-500"></div>
                
                <CardContent className="p-8 relative z-10">
                  <EditableText
                    contentKey="about_philosophy_paragraph_1"
                    defaultValue="Recognizing that each patient's goal is unique, Dr. Hanemann offers creative solutions for his patients, utilizing the latest technology and procedures to achieve desired results."
                    as="p"
                    className="text-gray-300 leading-relaxed"
                    multiline
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -4 }}
            >
              <Card className="border-[#2d3548] bg-[#1a1f2e]/50 backdrop-blur rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-[#c9b896]/10 transition-all duration-300 group relative overflow-hidden">
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#c9b896]/0 to-[#c9b896]/0 group-hover:from-[#c9b896]/5 group-hover:to-transparent transition-all duration-500"></div>
                
                <CardContent className="p-8 relative z-10">
                  <EditableText
                    contentKey="about_philosophy_paragraph_2"
                    defaultValue="Improving patient appearance, self image and confidence are our measures of success and satisfaction. Your privacy and confidentiality are held in the highest regard."
                    as="p"
                    className="text-gray-300 leading-relaxed"
                    multiline
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-[#242938] to-[#1a1f2e] border-t border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        
        {/* Ambient glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c9b896]/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <EditableText
              contentKey="about_cta_heading"
              defaultValue="Experience the Difference"
              as="h2"
              className="mb-6 text-[#faf9f7]"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}