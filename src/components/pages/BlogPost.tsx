import React from 'react';
import { useParams } from 'react-router';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Calendar, Clock, ArrowLeft, ArrowRight, User } from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';
import { Breadcrumbs } from '../seo/Breadcrumbs';
import { getBlogPostBySlug, BlogPostData } from '../data/blogPosts';

interface BlogPostProps {
  onNavigate: (page: string, slug?: string) => void;
}

export function BlogPost({ onNavigate }: BlogPostProps) {
  const { slug } = useParams<{ slug: string }>();
  
  // Get blog post data from slug
  const post = slug ? getBlogPostBySlug(slug) : undefined;
  
  // If post not found, redirect to resources
  if (!post) {
    return (
      <div className="py-24 text-center">
        <h1 className="mb-6">Blog Post Not Found</h1>
        <Button onClick={() => onNavigate('Resources')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Resources
        </Button>
      </div>
    );
  }

  // Generate Article Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.image,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      '@type': 'Person',
      name: post.author,
      jobTitle: post.authorTitle
    },
    publisher: {
      '@type': 'MedicalBusiness',
      name: 'Hanemann Plastic Surgery',
      logo: {
        '@type': 'ImageObject',
        url: 'https://hanemannplasticsurgery.com/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://hanemannplasticsurgery.com/resources/${post.slug}`
    }
  };

  // Generate FAQPage Schema if FAQs exist
  const faqSchema = post.faq ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faq.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null;

  return (
    <div>
      {/* SEO Head */}
      <SEOHead
        title={post.seoTitle}
        description={post.description}
        keywords={post.keywords}
        canonical={`/resources/${post.slug}`}
      />

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Resources', href: '/resources' },
          { label: post.title }
        ]}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-muted to-secondary/20 py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <Button
            variant="ghost"
            className="mb-6 -ml-4"
            onClick={() => onNavigate('Resources')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Button>

          <div className="mb-6">
            <span className="bg-secondary text-card px-4 py-1.5 rounded-full text-sm">
              {post.category}
            </span>
          </div>

          <h1 className="mb-6">{post.title}</h1>

          <div className="flex items-center gap-6 text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{post.readTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>{post.author}</span>
            </div>
          </div>

          <p className="text-foreground text-lg">
            {post.excerpt}
          </p>
        </div>
      </section>

      {/* Featured Image */}
      <section className="py-12 bg-card">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="aspect-[16/9] relative rounded-2xl overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-16 bg-muted/20">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* Introduction */}
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-foreground text-lg leading-relaxed">
              {post.content.introduction}
            </p>
          </div>

          {/* Main Sections */}
          {post.content.sections.map((section, index) => (
            <div key={index} className="mb-12">
              <h2 className="mb-6">{section.heading}</h2>
              
              <p className="text-foreground leading-relaxed mb-6">
                {section.content}
              </p>

              {section.list && (
                <ul className="space-y-3 mb-6">
                  {section.list.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-secondary mt-1.5 flex-shrink-0">•</span>
                      <span className="text-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Conclusion */}
          <div className="prose prose-lg max-w-none mb-12 p-8 bg-card rounded-2xl border border-border">
            <p className="text-foreground text-lg leading-relaxed mb-0">
              {post.content.conclusion}
            </p>
          </div>
        </div>
      </article>

      {/* FAQ Section (if exists) */}
      {post.faq && post.faq.length > 0 && (
        <section className="py-16 bg-card">
          <div className="container mx-auto px-6 max-w-3xl">
            <h2 className="mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              {post.faq.map((faq, index) => (
                <Card key={index} className="border-border rounded-2xl">
                  <CardContent className="p-6">
                    <h3 className="mb-3 text-primary">{faq.question}</h3>
                    <p className="text-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Procedures */}
      {post.relatedProcedures && post.relatedProcedures.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-6 max-w-3xl">
            <h3 className="mb-6">Related Procedures</h3>
            <div className="flex flex-wrap gap-4">
              {post.relatedProcedures.map((procedure, index) => {
                // Extract procedure name from path
                const procedureName = procedure.split('/').pop() || '';
                const displayName = procedureName.charAt(0).toUpperCase() + procedureName.slice(1);
                
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      if (procedure.includes('/procedures/')) {
                        const type = procedure.split('/procedures/')[1];
                        onNavigate(type.charAt(0).toUpperCase() + type.slice(1));
                      }
                    }}
                  >
                    {displayName} Procedures
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary/80">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-card mb-6">Ready to Learn More?</h2>
          <p className="text-card/90 text-lg mb-10">
            Schedule a consultation with Dr. Hanemann to discuss your goals and get personalized recommendations for your aesthetic journey in Baton Rouge.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full px-10 bg-card text-primary hover:bg-card/90"
              onClick={() => onNavigate('Contact')}
            >
              Schedule Consultation
            </Button>
            <a
              href="tel:+12257662166"
              className="flex items-center gap-2 text-card hover:text-card/80 transition-colors px-6 py-3"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = 'tel:+12257662166';
                // Track phone call in GA4
                if (window.gtag) {
                  window.gtag('event', 'phone_call', {
                    event_category: 'engagement',
                    event_label: 'Blog Post CTA',
                    value: 1
                  });
                }
              }}
            >
              <span className="text-lg">or call (225) 766-2166</span>
            </a>
          </div>
        </div>
      </section>

      {/* Back to Resources */}
      <section className="py-12 bg-card">
        <div className="container mx-auto px-6 text-center">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full"
            onClick={() => onNavigate('Resources')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Resources
          </Button>
        </div>
      </section>
    </div>
  );
}