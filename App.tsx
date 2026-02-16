import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PatientAuthProvider, usePatientAuth } from './contexts/PatientAuthContext';
import { EditModeProvider } from './contexts/EditModeContext';
import { HelmetProvider } from 'react-helmet-async';
import { useAnalytics } from './hooks/useAnalytics';
import { AdminEditPanel } from './components/cms/AdminEditPanel';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './components/pages/Home';
import { HomeLuxury } from './components/pages/HomeLuxury';
import { About } from './components/pages/About';
import { ProcedurePage } from './components/pages/ProcedurePage';
import { Gallery } from './components/pages/Gallery';
import { Resources } from './components/pages/Resources';
import { BlogPost } from './components/pages/BlogPost';
import { Contact } from './components/pages/Contact';
import { PatientForms } from './components/pages/PatientForms';
import { PatientFormDetail } from './components/pages/PatientFormDetail';
import { AdminLogin } from './components/pages/AdminLogin';
import { AdminDashboard } from './components/pages/AdminDashboard';
import { PatientAuth } from './components/patient/PatientAuth';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { ConsultationDialog } from './components/ConsultationDialog';
import { NewsletterDialog } from './components/NewsletterDialog';
import { QuickContactDialog } from './components/QuickContactDialog';
import { noseData, faceData, breastData, bodyData } from './components/data/procedureData';
import { getBlogPostBySlug } from './components/data/blogPosts';
import { Button } from './components/ui/button';
import { StructuredData } from './components/seo/StructuredData';
import { HeroImagePreview } from './components/HeroImagePreview';

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <PatientAuthProvider>
            <EditModeProvider>
              <AppContent />
            </EditModeProvider>
          </PatientAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

function AppContent() {
  const { isAdmin, user, accessToken, logout } = useAuth();
  const { user: patientUser } = usePatientAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [quickContactOpen, setQuickContactOpen] = useState(false);
  const [heroPositionRequest, setHeroPositionRequest] = useState<'desktop' | 'mobile' | null>(null);
  const [heroUploadRequest, setHeroUploadRequest] = useState<'desktop' | 'mobile' | null>(null);
  
  // Initialize analytics tracking (will use patient user ID if available)
  const { trackClick } = useAnalytics(patientUser?.id);
  
  const handleNavigate = (page: string) => {
    const routeMap: Record<string, string> = {
      'Home': '/',
      'About': '/about',
      'Nose': '/procedures/rhinoplasty',
      'Face': '/procedures/face',
      'Breast': '/procedures/breast',
      'Body': '/procedures/body',
      'Gallery': '/gallery',
      'Resources': '/resources',
      'Patient Forms': '/patient-forms',
      'BlogPost': '/blog/:slug',
      'Contact': '/contact',
      'AdminLogin': '/admin/login',
      'AdminDashboard': '/admin/dashboard'
    };
    
    // Handle PatientForm detail pages
    if (page.startsWith('PatientForm-')) {
      const formId = page.replace('PatientForm-', '');
      navigate(`/patient-forms/${formId}`);
      return;
    }
    
    const route = routeMap[page] || '/';
    navigate(route);
  };

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Determine current page from route
  const getCurrentPageName = () => {
    const path = location.pathname;
    if (path === '/') return 'Home';
    if (path === '/about') return 'About';
    if (path === '/procedures/rhinoplasty') return 'Nose';
    if (path === '/procedures/face') return 'Face';
    if (path === '/procedures/breast') return 'Breast';
    if (path === '/procedures/body') return 'Body';
    if (path === '/gallery') return 'Gallery';
    if (path === '/resources') return 'Resources';
    if (path === '/patient-forms') return 'Patient Forms';
    if (path.startsWith('/patient-forms/')) return 'Patient Forms';
    if (path.startsWith('/blog/')) return 'BlogPost';
    if (path === '/contact') return 'Contact';
    if (path === '/admin/login') return 'AdminLogin';
    if (path === '/admin/dashboard') return 'AdminDashboard';
    return 'Home';
  };

  const currentPage = getCurrentPageName();
  const isAdminPage = currentPage === 'AdminLogin' || currentPage === 'AdminDashboard';

  return (
    <div className="bg-background min-h-screen overflow-x-hidden">
      {/* Global Structured Data */}
      <StructuredData />

      {/* Show header/footer only on public pages */}
      {!isAdminPage && (
        <Header 
          currentPage={currentPage} 
          onNavigate={handleNavigate}
          onOpenConsultation={() => setConsultationOpen(true)}
        />
      )}
      
      {/* Add top padding to account for fixed header */}
      <main className={!isAdminPage ? '' : ''}>
        <Routes>
          <Route path="/" element={
            <Home 
              onNavigate={handleNavigate}
              onOpenConsultation={() => setConsultationOpen(true)}
              heroPositionRequest={heroPositionRequest}
              onHeroPositionHandled={() => setHeroPositionRequest(null)}
              heroUploadRequest={heroUploadRequest}
              onHeroUploadHandled={() => setHeroUploadRequest(null)}
            />
          } />
          <Route path="/about" element={<About onNavigate={handleNavigate} />} />
          <Route path="/procedures/rhinoplasty" element={
            <ProcedurePage data={noseData} procedureType="nose" onNavigate={handleNavigate} />
          } />
          <Route path="/procedures/face" element={
            <ProcedurePage data={faceData} procedureType="face" onNavigate={handleNavigate} />
          } />
          <Route path="/procedures/breast" element={
            <ProcedurePage data={breastData} procedureType="breast" onNavigate={handleNavigate} />
          } />
          <Route path="/procedures/body" element={
            <ProcedurePage data={bodyData} procedureType="body" onNavigate={handleNavigate} />
          } />
          <Route path="/gallery" element={<Gallery onNavigate={handleNavigate} />} />
          <Route path="/resources" element={<Resources onNavigate={handleNavigate} />} />
          <Route path="/blog/:slug" element={<BlogPost onNavigate={handleNavigate} />} />
          <Route path="/contact" element={
            <Contact onNavigate={handleNavigate} onOpenConsultation={() => setConsultationOpen(true)} />
          } />
          <Route path="/patient-forms" element={<PatientForms onNavigate={handleNavigate} />} />
          <Route path="/patient-forms/:id" element={<PatientFormDetail onNavigate={handleNavigate} />} />
          
          {/* Patient Portal Routes */}
          <Route path="/patient/login" element={
            <PatientAuth onSuccess={() => navigate('/patient/dashboard')} />
          } />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          
          {/* Hero Image Preview - Temporary */}
          <Route path="/preview-hero" element={<HeroImagePreview />} />
          
          <Route path="/admin/login" element={
            <AdminLogin 
              onLoginSuccess={(token, user) => {
                navigate('/admin/dashboard');
              }}
              onBackToWebsite={() => navigate('/')}
            />
          } />
          <Route path="/admin/dashboard" element={
            accessToken ? (
              <AdminDashboard 
                accessToken={accessToken} 
                user={user}
                onLogout={() => {
                  logout();
                  navigate('/');
                }}
                onBackToWebsite={() => navigate('/')}
              />
            ) : (
              <AdminLogin 
                onLoginSuccess={(token, user) => {
                  navigate('/admin/dashboard');
                }}
                onBackToWebsite={() => navigate('/')}
              />
            )
          } />
          {/* Fallback route */}
          <Route path="*" element={
            <Home 
              onNavigate={handleNavigate}
              onOpenConsultation={() => setConsultationOpen(true)}
              onOpenNewsletter={() => setNewsletterOpen(true)}
            />
          } />
        </Routes>
      </main>

      {/* Show footer only on public pages */}
      {!isAdminPage && (
        <Footer 
          onNavigate={handleNavigate}
          onOpenQuickContact={() => setQuickContactOpen(true)}
        />
      )}

      {/* Floating Schedule a Consultation Button - hide on admin pages */}
      {!isAdminPage && (
        <div className="fixed bottom-8 right-8 z-30 group">
          <Button
            size="lg"
            className="rounded-full shadow-2xl shadow-secondary/30 bg-primary hover:bg-primary/90 px-8 hover:shadow-secondary/50 hover:scale-105 transition-all duration-500 relative overflow-hidden animate-pulse-subtle"
            onClick={() => setConsultationOpen(true)}
          >
            {/* Gold ring accent */}
            <span className="absolute inset-0 rounded-full border-2 border-secondary/30 group-hover:border-secondary/60 transition-colors"></span>
            
            {/* Shine effect on hover */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-card/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full rounded-full" style={{ transitionDuration: '1s' }}></span>
            
            <span className="relative z-10">Schedule a Consultation</span>
          </Button>
        </div>
      )}

      {/* Dialog Components */}
      <ConsultationDialog open={consultationOpen} onOpenChange={setConsultationOpen} />
      <NewsletterDialog open={newsletterOpen} onOpenChange={setNewsletterOpen} />
      <QuickContactDialog open={quickContactOpen} onOpenChange={setQuickContactOpen} />

      {/* Admin Edit Panel - shows on public pages only when admin is logged in */}
      {!isAdminPage && (
        <AdminEditPanel 
          onNavigateToPortal={() => navigate('/admin/dashboard')}
          onNavigateHome={() => navigate('/')}
          onAdjustHeroPosition={(type) => {
            setHeroPositionRequest(type);
            // Navigate to home if not already there
            if (currentPage !== 'Home') {
              navigate('/');
            }
          }}
          onUploadHeroImage={(type) => {
            setHeroUploadRequest(type);
            // Navigate to home if not already there
            if (currentPage !== 'Home') {
              navigate('/');
            }
          }}
        />
      )}
    </div>
  );
}
