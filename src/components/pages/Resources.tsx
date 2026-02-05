import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';
import { Breadcrumbs } from '../seo/Breadcrumbs';
import { EditableText } from '../cms/EditableText';
import { EditableImage } from '../cms/EditableImage';
import { getAllBlogPosts } from '../data/blogPosts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

interface ResourcesProps {
  onNavigate: (page: string) => void;
}

export function Resources({ onNavigate }: ResourcesProps) {
  const navigate = useNavigate();
  
  // Get all blog posts from centralized data
  const blogPosts = getAllBlogPosts();

  const categories = ['All', 'Face', 'Breast', 'Body', 'Non-Surgical', 'General'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredPosts = selectedCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <div>
      <SEOHead
        title="Patient Resources & Education | Hanemann Plastic Surgery Blog"
        description="Plastic surgery education and resources from Dr. Hanemann in Baton Rouge. Learn about procedures, recovery, and making informed decisions about your aesthetic goals."
        keywords="plastic surgery blog, cosmetic surgery education, Baton Rouge plastic surgery information, Dr. Hanemann articles, procedure guides"
        canonical="/resources"
      />
      
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Resources' }
      ]} />

      {/* Hero */}
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
              contentKey="resources_hero_heading"
              defaultValue="Patient Resources & Education"
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
              contentKey="resources_hero_description"
              defaultValue="Expert insights, procedure guides, and educational content to help you make informed decisions about your aesthetic journey"
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

      {/* Category Filter */}
      <section className="py-12 bg-[#1a1f2e] border-b border-[#2d3548]">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className={selectedCategory === category 
                    ? 'rounded-full bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] shadow-lg' 
                    : 'rounded-full border-[#c9b896] text-[#c9b896] hover:bg-[#c9b896] hover:text-[#1a1f2e]'}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-24 bg-[#1a1f2e] relative overflow-hidden">
        {/* Ambient background elements */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#b8976a]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card className="border-[#2d3548] bg-[#242938]/50 backdrop-blur rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#c9b896]/10 transition-all duration-300 group h-full">
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-[#c9b896] text-[#1a1f2e] px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                        {post.category}
                      </span>
                    </div>
                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f2e]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    
                    <h3 className="mb-3 text-[#faf9f7] group-hover:text-[#c9b896] transition-colors">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <Button 
                      variant="ghost" 
                      className="group/btn p-0 h-auto hover:bg-transparent text-[#c9b896] hover:text-[#b8976a]"
                      onClick={() => {
                        console.log('Navigate to:', post.href);
                        navigate(post.href);
                      }}
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Education Section */}
      <section className="py-24 bg-gradient-to-b from-[#1a1f2e] to-[#242938] border-t border-[#2d3548] relative overflow-hidden">
        {/* Gradient separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9b896]/30 to-transparent"></div>
        
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <EditableText
                contentKey="resources_education_heading"
                defaultValue="Education-First Approach"
                as="h2"
                className="mb-6 text-[#faf9f7]"
              />
              <EditableText
                contentKey="resources_education_body"
                defaultValue="At Hanemann Plastic Surgery, we believe informed patients make the best decisions. That's why Dr. Hanemann takes time during every consultation to educate you about your options, explain the pros and cons of different approaches, and set realistic expectations. Our goal is to empower you with knowledge so you feel confident in your aesthetic journey."
                as="p"
                className="text-gray-300 mb-6"
                multiline
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="rounded-full bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] shadow-lg hover:shadow-[#c9b896]/20 transition-all duration-300"
                  onClick={() => onNavigate('About')}
                >
                  Meet Dr. Hanemann
                </Button>
              </motion.div>
            </motion.div>
            <motion.div 
              className="aspect-[4/3] relative group"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Gold corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#c9b896]/30 to-transparent rounded-2xl"></div>
              </div>
              
              <EditableImage
                contentKey="resources_education_image"
                defaultSrc="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwY29uc3VsdGF0aW9uJTIwcGxhc3RpYyUyMHN1cmdlcnl8ZW58MXx8fHwxNzYzNTc4MzQyfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Dr. Hanemann Consultation"
                className="w-full h-full object-cover rounded-2xl shadow-2xl"
                locationLabel="Resources Page - Education Image"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-[#242938] to-[#1a1f2e] border-t border-[#2d3548] relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.h2 
            className="text-[#faf9f7] mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Have Questions?
          </motion.h2>
          <motion.p 
            className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Schedule a consultation to discuss your goals and get personalized answers from Dr. Hanemann
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="rounded-full px-10 bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] shadow-lg hover:shadow-[#c9b896]/20 transition-all duration-300"
                onClick={() => onNavigate('Contact')}
              >
                Schedule Consultation
              </Button>
            </motion.div>
            <motion.a 
              href="tel:+12257662166"
              className="flex items-center gap-2 text-[#c9b896] hover:text-[#b8976a] transition-colors px-6 py-3"
              whileHover={{ x: 4 }}
            >
              <span className="text-lg">or call (225) 766-2166</span>
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}