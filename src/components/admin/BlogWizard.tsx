import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ArrowRight, ArrowLeft, Check, Sparkles, Plus, Trash2, Eye } from 'lucide-react';

interface BlogWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (postData: any) => Promise<void>;
  existingPost?: any;
}

export function BlogWizard({ isOpen, onClose, existingPost, onSave }: BlogWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [author, setAuthor] = useState('Dr. Michael Hanemann');
  const [authorTitle, setAuthorTitle] = useState('Board-Certified Plastic Surgeon');
  const [excerpt, setExcerpt] = useState('');
  const [image, setImage] = useState('');
  
  const [introduction, setIntroduction] = useState('');
  const [sections, setSections] = useState<Array<{ heading: string; content: string; list: string[] }>>([]);
  const [conclusion, setConclusion] = useState('');
  
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [relatedProcedures, setRelatedProcedures] = useState<string[]>([]);
  
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Current section/FAQ being edited
  const [currentSection, setCurrentSection] = useState({ heading: '', content: '', list: [] as string[] });
  const [currentFAQ, setCurrentFAQ] = useState({ question: '', answer: '' });

  // Auto-generated SEO fields
  const [generatedSEO, setGeneratedSEO] = useState({
    seoTitle: '',
    description: '',
    keywords: ''
  });

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title || '');
      setCategory(existingPost.category || 'General');
      setAuthor(existingPost.author || 'Dr. Michael Hanemann');
      setAuthorTitle(existingPost.authorTitle || 'Board-Certified Plastic Surgeon');
      setExcerpt(existingPost.excerpt || '');
      setImage(existingPost.image || '');
      setIntroduction(existingPost.content?.introduction || '');
      setSections(existingPost.content?.sections || []);
      setConclusion(existingPost.content?.conclusion || '');
      setFaqs(existingPost.faq || []);
      setRelatedProcedures(existingPost.relatedProcedures || []);
      setStatus(existingPost.status || 'draft');
    }
  }, [existingPost]);

  // Auto-generate SEO fields
  const generateSEO = () => {
    // Generate SEO Title (50-60 chars)
    let seoTitle = title;
    if (seoTitle.length < 50) {
      // Add location keyword
      seoTitle = `${title} | Baton Rouge Plastic Surgery`;
    }
    if (seoTitle.length > 60) {
      seoTitle = seoTitle.substring(0, 57) + '...';
    }

    // Generate Meta Description (120-155 chars)
    let description = excerpt;
    if (!description || description.length < 120) {
      // Create from introduction
      const intro = introduction.substring(0, 140);
      description = `${intro}... Learn more from Dr. Hanemann in Baton Rouge, LA.`;
    }
    if (description.length > 155) {
      description = description.substring(0, 152) + '...';
    }

    // Generate Keywords
    const keywords = extractKeywords();

    setGeneratedSEO({ seoTitle, description, keywords });
  };

  // Extract keywords from content
  const extractKeywords = (): string => {
    const allText = `${title} ${introduction} ${sections.map(s => s.heading + ' ' + s.content).join(' ')} ${conclusion}`.toLowerCase();
    
    // Common medical/procedure terms to look for
    const medicalTerms = [
      'rhinoplasty', 'facelift', 'breast augmentation', 'breast lift', 'liposuction',
      'tummy tuck', 'abdominoplasty', 'bbl', 'brazilian butt lift', 'eyelid surgery',
      'blepharoplasty', 'botox', 'fillers', 'coolsculpting', 'mommy makeover',
      'plastic surgery', 'cosmetic surgery', 'reconstruction', 'surgeon',
      'recovery', 'procedure', 'consultation', 'results', 'candidates'
    ];

    const foundTerms = medicalTerms.filter(term => allText.includes(term));
    
    // Always include location
    const locationKeywords = ['Baton Rouge', 'Louisiana', 'Baton Rouge plastic surgeon'];
    
    // Combine and limit to top keywords
    const allKeywords = [...new Set([...foundTerms, ...locationKeywords])];
    
    return allKeywords.slice(0, 8).join(', ');
  };

  const handleNext = () => {
    if (currentStep === 4) {
      generateSEO();
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSavePost = async () => {
    if (!title || !excerpt || !introduction) {
      alert('Please fill in at least the title, excerpt, and introduction');
      return;
    }

    setLoading(true);

    const postData = {
      title,
      seoTitle: generatedSEO.seoTitle,
      excerpt,
      description: generatedSEO.description,
      keywords: generatedSEO.keywords,
      category,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      readTime: calculateReadTime(),
      image,
      author,
      authorTitle,
      content: {
        introduction,
        sections,
        conclusion
      },
      relatedProcedures,
      faq: faqs,
      status,
      ...(existingPost && { slug: existingPost.slug })
    };

    try {
      await onSave(postData);
      handleClose();
    } catch (error) {
      console.error('Error saving post:', error);
    }

    setLoading(false);
  };

  const calculateReadTime = (): string => {
    const allText = `${introduction} ${sections.map(s => s.content).join(' ')} ${conclusion}`;
    const wordCount = allText.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200); // Average reading speed
    return `${minutes} min read`;
  };

  const handleClose = () => {
    setCurrentStep(1);
    setTitle('');
    setCategory('General');
    setExcerpt('');
    setImage('');
    setIntroduction('');
    setSections([]);
    setConclusion('');
    setFaqs([]);
    setRelatedProcedures([]);
    setStatus('draft');
    onClose();
  };

  const addSection = () => {
    if (!currentSection.heading || !currentSection.content) {
      alert('Please fill in section heading and content');
      return;
    }
    setSections([...sections, { ...currentSection }]);
    setCurrentSection({ heading: '', content: '', list: [] });
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const addFAQ = () => {
    if (!currentFAQ.question || !currentFAQ.answer) {
      alert('Please fill in both question and answer');
      return;
    }
    setFaqs([...faqs, { ...currentFAQ }]);
    setCurrentFAQ({ question: '', answer: '' });
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const steps = [
    { number: 1, title: 'Basic Info', icon: '📝' },
    { number: 2, title: 'Write Content', icon: '✍️' },
    { number: 3, title: 'Add FAQs', icon: '❓' },
    { number: 4, title: 'Images & Links', icon: '🖼️' },
    { number: 5, title: 'Review & Publish', icon: '🚀' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {existingPost ? 'Edit Blog Article' : 'Create New Blog Article'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {existingPost ? 'Edit your existing blog article' : 'Create a new blog article to share your expertise with patients'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${
                  currentStep >= step.number 
                    ? 'bg-secondary text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step.number ? <Check className="w-6 h-6" /> : step.icon}
                </div>
                <p className={`text-xs mt-2 ${currentStep >= step.number ? 'text-secondary' : 'text-muted-foreground'}`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${currentStep > step.number ? 'bg-secondary' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="px-4">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <h3>Let's start with the basics</h3>
                <p className="text-sm text-muted-foreground">Tell us about your article</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Article Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., What to Expect from Rhinoplasty Surgery"
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep it clear and conversational - this is what patients will see first
                  </p>
                </div>

                <div>
                  <Label>Brief Summary (Excerpt) *</Label>
                  <Textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Write 2-3 sentences that summarize what patients will learn from this article..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This appears on the blog listing page
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Face">Face Procedures</SelectItem>
                        <SelectItem value="Breast">Breast Procedures</SelectItem>
                        <SelectItem value="Body">Body Procedures</SelectItem>
                        <SelectItem value="Non-Surgical">Non-Surgical Treatments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Author Name</Label>
                    <Input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Dr. Michael Hanemann"
                    />
                  </div>
                </div>

                <div>
                  <Label>Author Title</Label>
                  <Input
                    value={authorTitle}
                    onChange={(e) => setAuthorTitle(e.target.value)}
                    placeholder="Board-Certified Plastic Surgeon"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Write Content */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <h3>Write your article content</h3>
                <p className="text-sm text-muted-foreground">Share your expertise with patients</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Opening Paragraph *</Label>
                  <Textarea
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                    placeholder="Start with a warm introduction that connects with the patient's concerns and sets up what they'll learn..."
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Tip: Address common patient concerns or questions right away
                  </p>
                </div>

                {/* Content Sections */}
                <div className="border-t pt-6">
                  <Label className="text-lg mb-3 block">Main Content Sections</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Break your article into clear sections with headings. Each section should cover one main topic.
                  </p>

                  {sections.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {sections.map((section, index) => (
                        <div key={index} className="p-4 bg-secondary/10 rounded-lg relative border border-secondary/20">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() => removeSection(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <h4 className="mb-2">✓ {section.heading}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{section.content}</p>
                          {section.list.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              + {section.list.length} bullet points
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4 p-6 border-2 border-dashed rounded-lg">
                    <Input
                      value={currentSection.heading}
                      onChange={(e) => setCurrentSection({ ...currentSection, heading: e.target.value })}
                      placeholder="Section Heading (e.g., 'Who Is a Good Candidate?')"
                    />
                    <Textarea
                      value={currentSection.content}
                      onChange={(e) => setCurrentSection({ ...currentSection, content: e.target.value })}
                      placeholder="Write your section content here... Explain the topic clearly and answer common patient questions."
                      rows={5}
                    />
                    <div>
                      <Label className="text-sm mb-2 block">Add Bullet Points (Optional)</Label>
                      <Textarea
                        value={currentSection.list.join('\n')}
                        onChange={(e) => setCurrentSection({ 
                          ...currentSection, 
                          list: e.target.value.split('\n').filter(l => l.trim()) 
                        })}
                        placeholder="One bullet point per line:&#10;- First important point&#10;- Second important point&#10;- Third important point"
                        rows={4}
                      />
                    </div>
                    <Button onClick={addSection} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add This Section
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Label>Closing Paragraph *</Label>
                  <Textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder="Wrap up your article with key takeaways and encourage patients to schedule a consultation..."
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Tip: End with a clear call-to-action (e.g., schedule a consultation)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: FAQs */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <h3>Add Frequently Asked Questions</h3>
                <p className="text-sm text-muted-foreground">Optional, but great for SEO and patient education</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {faqs.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {faqs.map((faq, index) => (
                      <div key={index} className="p-4 bg-secondary/10 rounded-lg relative border border-secondary/20">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => removeFAQ(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <h4 className="text-sm mb-2">Q: {faq.question}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4 p-6 border-2 border-dashed rounded-lg">
                  <Input
                    value={currentFAQ.question}
                    onChange={(e) => setCurrentFAQ({ ...currentFAQ, question: e.target.value })}
                    placeholder="Question: e.g., 'How long is recovery after rhinoplasty?'"
                  />
                  <Textarea
                    value={currentFAQ.answer}
                    onChange={(e) => setCurrentFAQ({ ...currentFAQ, answer: e.target.value })}
                    placeholder="Answer: Provide a clear, detailed answer to the question..."
                    rows={4}
                  />
                  <Button onClick={addFAQ} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add FAQ
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  💡 Tip: Think about questions patients ask during consultations
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Images & Related Content */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <h3>Add Visual Content & Related Links</h3>
                <p className="text-sm text-muted-foreground">Make your article more engaging</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Featured Image URL</Label>
                  <Input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use Unsplash or another image source. Leave blank for default image.
                  </p>
                  {image && (
                    <div className="mt-3">
                      <img src={image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    </div>
                  )}
                </div>

                <div>
                  <Label>Related Procedure Pages (Optional)</Label>
                  <Textarea
                    value={relatedProcedures.join('\n')}
                    onChange={(e) => setRelatedProcedures(e.target.value.split('\n').filter(p => p.trim()))}
                    placeholder="Link to related procedures on your website:&#10;/procedures/body&#10;/procedures/breast&#10;/procedures/face"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    One URL per line - these will appear as "Related Procedures" on the blog post
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review & Publish */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <h3>Review & Publish</h3>
                <p className="text-sm text-muted-foreground">We've automatically optimized your article for search engines</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Auto-generated SEO Preview */}
                <div className="p-6 bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-lg border border-secondary/20">
                  <div className="flex items-start gap-3 mb-4">
                    <Sparkles className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-sm mb-1">SEO Auto-Generated ✨</h4>
                      <p className="text-xs text-muted-foreground">
                        These optimizations help patients find your article on Google
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">SEO Title (shown in Google results)</Label>
                      <p className="text-sm bg-background p-3 rounded mt-1 border">{generatedSEO.seoTitle}</p>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Meta Description (shown in Google results)</Label>
                      <p className="text-sm bg-background p-3 rounded mt-1 border">{generatedSEO.description}</p>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Keywords (helps with search rankings)</Label>
                      <p className="text-sm bg-background p-3 rounded mt-1 border">{generatedSEO.keywords}</p>
                    </div>
                  </div>
                </div>

                {/* Article Summary */}
                <div className="space-y-3">
                  <h4 className="text-sm">Article Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-muted rounded">
                      <p className="text-xs text-muted-foreground mb-1">Title</p>
                      <p className="line-clamp-1">{title}</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-xs text-muted-foreground mb-1">Category</p>
                      <p>{category}</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-xs text-muted-foreground mb-1">Content Sections</p>
                      <p>{sections.length} sections</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-xs text-muted-foreground mb-1">FAQs</p>
                      <p>{faqs.length} questions</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-xs text-muted-foreground mb-1">Reading Time</p>
                      <p>{calculateReadTime()}</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-xs text-muted-foreground mb-1">Author</p>
                      <p className="line-clamp-1">{author}</p>
                    </div>
                  </div>
                </div>

                {/* Publishing Options */}
                <div>
                  <Label>Publishing Status</Label>
                  <Select value={status} onValueChange={(value: 'draft' | 'published') => setStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Save as Draft (not visible to public)</SelectItem>
                      <SelectItem value="published">Publish Live (visible on website)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 px-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </div>

          {currentStep < 5 ? (
            <Button onClick={handleNext}>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSavePost} disabled={loading} size="lg">
              <Check className="w-4 h-4 mr-2" />
              {status === 'published' ? 'Publish Article' : 'Save Draft'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}