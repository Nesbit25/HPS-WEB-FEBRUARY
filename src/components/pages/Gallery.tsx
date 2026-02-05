import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { GalleryLightbox } from '../GalleryLightbox';
import { GeometricPattern, CircleAccent, AccentLine } from '../DecorativeElements';
import { EditableText } from '../cms/EditableText';
import { useAuth } from '../../contexts/AuthContext';
import { useEditMode } from '../../contexts/EditModeContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { SimpleGalleryEditor } from '../cms/SimpleGalleryEditor';
import { NewGalleryCaseEditor } from '../cms/NewGalleryCaseEditor';
import { BulkGalleryUploader } from '../cms/BulkGalleryUploader';
import { GalleryOrientationManager } from '../cms/GalleryOrientationManager';
import { Edit2, Plus, Upload as UploadIcon, Image as ImageIcon } from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface GalleryProps {
  onNavigate: (page: string) => void;
}

interface GalleryOrientation {
  name: string;
  beforeImage?: string;
  afterImage?: string;
}

interface GalleryItem {
  id: number;
  slug?: string; // Case slug from filename (e.g., "pt_1_rhino")
  category: string;
  title: string;
  procedure: string;
  journeyNote: string;
  beforeImage?: string;
  afterImage?: string;
  orientations?: GalleryOrientation[]; // New: support multiple orientations
  createdBy?: string; // Only exists on custom cases from database
  createdAt?: string;
  featuredOnHome?: boolean;
  showOnNose?: boolean;
  showOnBreast?: boolean;
  showOnBody?: boolean;
  showOnFace?: boolean;
}

export function Gallery({ onNavigate }: GalleryProps) {
  const { isAdmin, accessToken } = useAuth();
  const { isEditMode } = useEditMode();
  const categories = ['All', 'Nose', 'Face', 'Breast', 'Body'];
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: number; type: 'before' | 'after'; orientationIndex?: number } | null>(null);
  const [newCaseEditorOpen, setNewCaseEditorOpen] = useState(false);
  const [bulkUploaderOpen, setBulkUploaderOpen] = useState(false);
  const [orientationManagerOpen, setOrientationManagerOpen] = useState(false);
  const [orientationManagerCaseId, setOrientationManagerCaseId] = useState<number | null>(null);
  const [orientationManagerCaseTitle, setOrientationManagerCaseTitle] = useState<string>('');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImages, setActiveImages] = useState<{ [key: number]: { orientationIndex: number; type: 'before' | 'after' } }>({});

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;
  
  // GitHub configuration
  const GITHUB_USERNAME = 'Nesbit25';
  const GITHUB_REPO = 'HPS-WEB-FEBRUARY';
  const GITHUB_FOLDER = 'gallery';

  // Load images from GitHub on mount
  useEffect(() => {
    loadGalleryImages();
  }, []);

  const loadGalleryImages = async () => {
    setLoading(true);
    try {
      console.log('[Gallery] Loading gallery images from GitHub...');
      
      // Check localStorage cache first
      const cacheKey = 'gallery_items_cache';
      const cacheTimestampKey = 'gallery_items_cache_timestamp';
      const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
      
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
      
      if (cachedData && cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp);
        if (age < CACHE_DURATION) {
          console.log('[Gallery] 🚀 Loading from cache (age:', Math.round(age / 1000), 'seconds)');
          const cachedItems = JSON.parse(cachedData);
          setGalleryItems(cachedItems);
          setLoading(false);
          return;
        }
      }
      
      // No valid cache, fetch fresh data from GitHub
      await fetchAndUpdateGallery();
      
    } catch (error) {
      console.error('[Gallery] Error loading images:', error);
      setLoading(false);
    }
  };
  
  // Helper: Generate numeric ID from string
  const stringToId = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  const fetchAndUpdateGallery = async () => {
    try {
      // 1. Fetch file list from GitHub API
      console.log('[Gallery] Fetching file list from GitHub...');
      const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`;
      
      const response = await fetch(githubApiUrl);
      
      // Handle 404 - folder doesn't exist yet (no images uploaded)
      if (response.status === 404) {
        console.log('[Gallery] Gallery folder not found in GitHub - no images uploaded yet');
        setGalleryItems([]);
        setLoading(false);
        
        // Update cache with empty array
        localStorage.setItem('gallery_items_cache', JSON.stringify([]));
        localStorage.setItem('gallery_items_cache_timestamp', Date.now().toString());
        return;
      }
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const files = await response.json();
      console.log('[Gallery] Found', files.length, 'files in GitHub repo');
      
      // 2. Filter to only image files
      const imageFiles = files.filter(file => 
        file.type === 'file' && 
        (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg'))
      );
      
      console.log('[Gallery] Filtered to', imageFiles.length, 'image files');
      
      // 3. Parse filenames and build gallery structure
      // Regex: ^(.*)_p(\d+)_img(\d+)\.(png|jpg|jpeg)$
      const filenameRegex = /^(.*)_p(\d+)_img(\d+)\.(png|jpg|jpeg)$/;
      
      const casesMap = new Map();
      
      imageFiles.forEach(file => {
        const match = file.name.match(filenameRegex);
        
        if (!match) {
          console.warn('[Gallery] Skipping file with invalid format:', file.name);
          return;
        }
        
        const [, caseSlug, pageStr, indexStr, extension] = match;
        const page = parseInt(pageStr);
        const index = parseInt(indexStr);
        
        // Calculate position: Math.ceil(index / 2)
        const position = Math.ceil(index / 2);
        
        // Determine type: odd = before, even = after
        const type = (index % 2 !== 0) ? 'before' : 'after';
        
        // Construct raw GitHub URL
        const imageUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/${GITHUB_FOLDER}/${file.name}`;
        
        console.log(`[Gallery] Parsed: ${file.name} -> case=${caseSlug}, position=${position}, type=${type}`);
        
        // Get or create case
        if (!casesMap.has(caseSlug)) {
          // Generate readable title from slug
          const title = caseSlug
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          casesMap.set(caseSlug, {
            slug: caseSlug,
            title: title,
            category: 'Face', // Default, can be changed by admin
            procedure: '',
            journeyNote: '',
            orientations: [],
            createdAt: new Date().toISOString()
          });
        }
        
        const caseData = casesMap.get(caseSlug);
        
        // Find or create orientation for this position
        let orientation = caseData.orientations.find(o => o.name === position.toString());
        if (!orientation) {
          orientation = {
            name: position.toString(),
            beforeImage: null,
            afterImage: null
          };
          caseData.orientations.push(orientation);
        }
        
        // Set the image
        if (type === 'before') {
          orientation.beforeImage = imageUrl;
        } else {
          orientation.afterImage = imageUrl;
        }
      });
      
      // 4. Convert map to array and sort orientations
      const galleryItems = Array.from(casesMap.values()).map(caseData => {
        // Sort orientations by position number
        caseData.orientations.sort((a, b) => parseInt(a.name) - parseInt(b.name));
        
        // Set base before/after images from first orientation
        const firstOrientation = caseData.orientations[0] || {};
        caseData.beforeImage = firstOrientation.beforeImage || null;
        caseData.afterImage = firstOrientation.afterImage || null;
        
        // Convert slug to numeric ID for compatibility
        caseData.id = stringToId(caseData.slug);
        
        return caseData;
      });
      
      console.log('[Gallery] Built', galleryItems.length, 'cases from GitHub');
      console.log('[Gallery] Gallery items:', galleryItems);
      
      // 5. Fetch case metadata from database (category, featured flags)
      try {
        const casesResponse = await fetch(`${serverUrl}/gallery/cases`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        
        if (casesResponse.ok) {
          const casesData = await casesResponse.json();
          const dbCases = casesData.cases || [];
          
          // Merge database metadata with GitHub images
          galleryItems.forEach(item => {
            const dbCase = dbCases.find(c => c.slug === item.slug);
            if (dbCase) {
              item.category = dbCase.category || item.category;
              item.procedure = dbCase.procedure || item.procedure;
              item.journeyNote = dbCase.journeyNote || item.journeyNote;
              item.featuredOnHome = dbCase.featuredOnHome || false;
              item.showOnNose = dbCase.showOnNose || false;
              item.showOnFace = dbCase.showOnFace || false;
              item.showOnBreast = dbCase.showOnBreast || false;
              item.showOnBody = dbCase.showOnBody || false;
              item.createdBy = dbCase.createdBy;
              item.createdAt = dbCase.createdAt;
            }
          });
        }
      } catch (error) {
        console.warn('[Gallery] Could not fetch case metadata from database:', error);
      }
      
      // 6. Cache the results
      localStorage.setItem('gallery_items_cache', JSON.stringify(galleryItems));
      localStorage.setItem('gallery_items_cache_timestamp', Date.now().toString());
      
      setGalleryItems(galleryItems);
      setLoading(false);
    } catch (error) {
      console.error('[Gallery] Error fetching gallery:', error);
      throw error;
    }
  };

  const filteredItems = selectedCategory === 'All' 
    ? galleryItems.filter(item => {
        // Admins in edit mode can see all items, including those without images
        if (isAdmin && isEditMode) {
          return true;
        }
        // Public users only see items with images
        return item.beforeImage || item.afterImage;
      })
    : galleryItems.filter(item => {
        // Category filter
        if (item.category !== selectedCategory) {
          return false;
        }
        // Admins in edit mode can see all items, including those without images
        if (isAdmin && isEditMode) {
          return true;
        }
        // Public users only see items with images
        return item.beforeImage || item.afterImage;
      });

  // Auto-cycle between before/after images AND orientations
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImages(prev => {
        const newState = { ...prev };
        filteredItems.forEach(item => {
          const currentState = prev[item.id] || { orientationIndex: 0, type: 'before' };
          const orientationCount = item.orientations?.length || 1;
          
          // Toggle between before and after first
          if (currentState.type === 'before') {
            newState[item.id] = { ...currentState, type: 'after' };
          } else {
            // After switching to "after", move to next orientation
            const nextOrientationIndex = (currentState.orientationIndex + 1) % orientationCount;
            newState[item.id] = { 
              orientationIndex: nextOrientationIndex, 
              type: 'before' 
            };
          }
        });
        return newState;
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [filteredItems]);

  const handleOpenLightbox = (index: number) => {
    setCurrentLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleNextImage = () => {
    setCurrentLightboxIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const handlePreviousImage = () => {
    setCurrentLightboxIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  };

  const handleOpenEditor = (id: number, type: 'before' | 'after', orientationIndex?: number) => {
    setEditingItem({ id, type, orientationIndex });
    setEditorOpen(true);
  };

  const handleImageSaved = () => {
    // Clear the cache so fresh data is fetched
    localStorage.removeItem('gallery_items_cache');
    localStorage.removeItem('gallery_items_cache_timestamp');
    
    // Reload gallery images
    loadGalleryImages();
    setEditorOpen(false);
    setEditingItem(null);
  };

  const handleBulkUploadComplete = () => {
    // Clear the cache so fresh data is fetched
    localStorage.removeItem('gallery_items_cache');
    localStorage.removeItem('gallery_items_cache_timestamp');
    
    // Reload gallery images
    loadGalleryImages();
  };

  const handleDebugGallery = async () => {
    try {
      const response = await fetch(`${serverUrl}/gallery/debug`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      
      const message = data.keys.length === 0 
        ? '❌ No gallery images found in database!\n\nThe gallery_ keys are empty.'
        : `📊 Gallery Database Contents:\n\n${data.keys.map(k => {
            const valueStr = typeof k.value === 'object' 
              ? JSON.stringify(k.value, null, 2) 
              : k.value;
            return `Key: ${k.key}\nValue: ${valueStr}\n`;
          }).join('\n---\n')}\n\nTotal: ${data.keys.length} images`;
      
      alert(message);
      console.log('Full debug data:', data);
    } catch (error) {
      alert(`Error loading debug info: ${error.message}`);
    }
  };

  const handleFixCaseId = async () => {
    const correctId = prompt('Enter the CORRECT case ID (the one in gallery_case_XXXX):');
    const wrongId = prompt('Enter the WRONG ID (the one used in image keys like gallery_XXXX_before):');
    
    if (!correctId || !wrongId) {
      alert('Both IDs are required!');
      return;
    }

    if (!confirm(`This will migrate all images from case ${wrongId} to case ${correctId}.\n\nContinue?`)) {
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/gallery/fix-case-id`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correctCaseId: parseInt(correctId),
          wrongCaseId: parseInt(wrongId)
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.message}\n\nMigrated keys:\n${data.migratedKeys.map(k => `${k.from} → ${k.to}`).join('\n')}`);
        
        // Clear cache and reload
        localStorage.removeItem('gallery_items_cache');
        localStorage.removeItem('gallery_items_cache_timestamp');
        loadGalleryImages();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Error fixing case ID: ${error.message}`);
    }
  };

  const handleTestImageLoad = async () => {
    try {
      // Test loading gallery_1_before
      const response = await fetch(`${serverUrl}/content/gallery_1_before`, {
        headers: {
          'Authorization': `Bearer ${accessToken || 'none'}`
        }
      });
      const data = await response.json();
      
      console.log('Test fetch result:', data);
      
      const imageUrl = data.content?.value;
      const message = `📷 Testing Image Load:\n\nKey: gallery_1_before\nFull Response: ${JSON.stringify(data, null, 2)}\n\nExtracted URL: ${imageUrl}\n\nURL Type: ${typeof imageUrl}`;
      
      alert(message);
      
      // Try to load the image
      if (imageUrl && typeof imageUrl === 'string') {
        const img = new Image();
        img.onload = () => alert('✅ Image loaded successfully!');
        img.onerror = (e) => alert(`❌ Image failed to load: ${e}`);
        img.src = imageUrl;
      }
    } catch (error) {
      alert(`Error testing image: ${error.message}`);
    }
  };

  const handleDeleteCase = async (id: number) => {
    try {
      const response = await fetch(`${serverUrl}/gallery/case/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Case deleted successfully!');
        
        // Clear the cache so fresh data is fetched
        localStorage.removeItem('gallery_items_cache');
        localStorage.removeItem('gallery_items_cache_timestamp');
        
        loadGalleryImages();
      } else {
        alert(`Failed to delete case: ${data.message}`);
      }
    } catch (error) {
      alert(`Error deleting case: ${error.message}`);
    }
  };

  const handleToggleFlag = async (id: number, flagName: string, currentValue: boolean) => {
    try {
      // Check if we have a valid access token
      if (!accessToken) {
        alert('Error: You must be logged in to toggle flags. Please log in and try again.');
        console.error('[Gallery Toggle] No access token available');
        return;
      }
      
      // If we're turning ON a flag, check limits
      if (!currentValue) {
        const limits = {
          'featuredOnHome': 9,
          'showOnNose': 3,
          'showOnFace': 3,
          'showOnBreast': 3,
          'showOnBody': 3
        };
        
        const currentCount = galleryItems.filter(item => item[flagName]).length;
        const limit = limits[flagName];
        
        if (currentCount >= limit) {
          const pageName = flagName === 'featuredOnHome' ? 'Home page' : 
                          flagName === 'showOnNose' ? 'Nose page' :
                          flagName === 'showOnFace' ? 'Face page' :
                          flagName === 'showOnBreast' ? 'Breast page' : 'Body page';
          alert(`Limit reached: You can only feature ${limit} cases on the ${pageName}. Please uncheck another case first.`);
          return;
        }
      }
      
      console.log(`[Gallery Toggle] Toggling flag ${flagName} for case ${id}, current value: ${currentValue}`);
      console.log(`[Gallery Toggle] Making request to: ${serverUrl}/gallery/case/${id}/toggle`);
      console.log(`[Gallery Toggle] Request body:`, { flag: flagName, value: !currentValue });
      console.log(`[Gallery Toggle] Access token available: ${accessToken ? 'Yes' : 'No'}`);
      
      const response = await fetch(`${serverUrl}/gallery/case/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ flag: flagName, value: !currentValue })
      });
      
      console.log(`[Gallery Toggle] Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Gallery Toggle] Server error response:', errorText);
        
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          alert('Your session has expired. Please log out and log back in to continue.\n\nClick OK to return to the admin login page.');
          // Optionally redirect to login
          window.location.reload();
          return;
        }
        
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      console.log('[Gallery Toggle] Server response:', data);
      
      if (data.success) {
        loadGalleryImages();
      } else {
        alert(`Failed to toggle flag: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[Gallery Toggle] Error:', error);
      console.error('[Gallery Toggle] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Unknown error';
      if (error.message === 'Failed to fetch') {
        errorMessage = 'Network error: Unable to reach the server. Please check your internet connection and try again.';
      }
      
      alert(`Error toggling flag: ${errorMessage}\n\nCheck the browser console for more details.`);
    }
  };

  const handleWipeAllGallery = async () => {
    if (!confirm('⚠️ WARNING: This will DELETE ALL gallery cases and images from the database.\n\nThis action cannot be undone.\n\nAre you absolutely sure you want to wipe the entire gallery?')) {
      return;
    }

    if (!confirm('This is your FINAL confirmation.\n\nClick OK to permanently delete all gallery data, or Cancel to abort.')) {
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/gallery/wipe-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to wipe gallery');
      }

      const data = await response.json();
      
      alert(`✅ Gallery wiped successfully!\n\nDeleted ${data.deletedKeys?.length || 0} items:\n${data.deletedKeys?.join('\n') || 'No items'}\n\nThe gallery is now empty and ready for your new photos.`);
      
      // Clear cache and reload
      localStorage.removeItem('gallery_items_cache');
      localStorage.removeItem('gallery_items_cache_timestamp');
      loadGalleryImages();
    } catch (error) {
      console.error('[Gallery Wipe] Error:', error);
      alert(`Error wiping gallery: ${error.message}`);
    }
  };

  const handleClearAllCases = async () => {
    if (!confirm('⚠️ WARNING: This will DELETE ALL gallery cases and images from the database.\n\nThis action cannot be undone.\n\nAre you absolutely sure you want to clear all cases?')) {
      return;
    }

    if (!confirm('This is your FINAL confirmation.\n\nClick OK to permanently delete all gallery data, or Cancel to abort.')) {
      return;
    }

    setClearing(true);

    try {
      const response = await fetch(`${serverUrl}/gallery/cases/all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear gallery');
      }

      const data = await response.json();
      
      alert(`✅ Gallery cleared successfully!\n\nDeleted ${data.deletedCases || 0} cases and ${data.deletedImages || 0} images.\n\nThe gallery is now empty and ready for your new photos.`);
      
      // Clear cache and reload
      localStorage.removeItem('gallery_items_cache');
      localStorage.removeItem('gallery_items_cache_timestamp');
      loadGalleryImages();
    } catch (error) {
      console.error('[Gallery Clear] Error:', error);
      alert(`Error clearing gallery: ${error.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div>
      <SEOHead
        title="Before & After Gallery | Real Patient Transformations"
        description="View real before and after photos of plastic surgery results by Dr. Hanemann. Browse transformations across rhinoplasty, facelifts, breast augmentation, body contouring, and more."
        keywords="before after photos, plastic surgery results, rhinoplasty before after, facelift results, breast augmentation photos, liposuction results, Dr. Hanemann gallery"
        canonical="/gallery"
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
              contentKey="gallery_hero_heading"
              defaultValue="Before & After Gallery"
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
              contentKey="gallery_hero_description"
              defaultValue="Real results from real patients. View our comprehensive gallery of transformations across all procedures"
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

      {/* Gallery Filters */}
      <section className="py-16 bg-[#1a1f2e] border-b border-[#2d3548]">
        <div className="container mx-auto px-6">
          {/* Debug button for admins */}
          {isAdmin && isEditMode && (
            <div className="mb-6 text-center space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setNewCaseEditorOpen(true)}
                className="rounded-full bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Case
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDebugGallery}
                className="rounded-full border-[#c9b896] text-[#c9b896] hover:bg-[#c9b896] hover:text-[#1a1f2e]"
              >
                🔍 Debug Gallery Database
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFixCaseId}
                className="rounded-full border-[#c9b896] text-[#c9b896] hover:bg-[#c9b896] hover:text-[#1a1f2e]"
              >
                🛠️ Fix Case ID
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestImageLoad}
                className="rounded-full border-[#c9b896] text-[#c9b896] hover:bg-[#c9b896] hover:text-[#1a1f2e]"
              >
                📸 Test Image Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkUploaderOpen(true)}
                className="rounded-full border-[#c9b896] text-[#c9b896] hover:bg-[#c9b896] hover:text-[#1a1f2e]"
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAllCases}
                disabled={clearing}
                className="rounded-full shadow-lg"
              >
                {clearing ? 'Clearing...' : '🗑️ Clear All Cases'}
              </Button>
            </div>
          )}
          
          <Tabs defaultValue="All" className="w-full">
            <TabsList className="w-full justify-center bg-[#242938]/50 p-1 rounded-full max-w-2xl mx-auto border border-[#2d3548]">
              {categories.map((category, index) => {
                const count = category === 'All' 
                  ? galleryItems.filter(item => item.beforeImage || item.afterImage).length
                  : galleryItems.filter(item => 
                      item.category === category && 
                      (item.beforeImage || item.afterImage)
                    ).length;
                
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <TabsTrigger
                      value={category}
                      onClick={() => setSelectedCategory(category)}
                      className="rounded-full data-[state=active]:bg-[#c9b896] data-[state=active]:text-[#1a1f2e] data-[state=active]:shadow-lg text-gray-300"
                    >
                      {category} <span className="ml-1 text-xs opacity-60">({count})</span>
                    </TabsTrigger>
                  </motion.div>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-24 bg-[#1a1f2e] relative overflow-hidden">
        {/* Ambient background elements */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#b8976a]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ y: -8 }}
              >
                {/* Edit buttons (only visible to admins in edit mode) - ALWAYS VISIBLE FOR NOW */}
                {isAdmin && isEditMode && (
                  <div className="absolute top-2 left-2 z-50 flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      className="rounded-full bg-secondary hover:bg-secondary/90 text-white shadow-2xl border-2 border-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditor(item.id, 'before');
                      }}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Before
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full bg-secondary hover:bg-secondary/90 text-white shadow-2xl border-2 border-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditor(item.id, 'after');
                      }}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      After
                    </Button>
                    {/* Add Orientations button */}
                    <Button
                      size="sm"
                      className="rounded-full bg-[#c9b896] hover:bg-[#b8976a] text-[#1a1f2e] shadow-2xl border-2 border-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrientationManagerCaseId(item.id);
                        setOrientationManagerCaseTitle(item.title);
                        setOrientationManagerOpen(true);
                      }}
                    >
                      <ImageIcon className="w-3 h-3 mr-1" />
                      Add Views
                    </Button>
                    {/* Only show delete for custom cases (those with createdBy field) */}
                    {item.createdBy && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full shadow-2xl border-2 border-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCase(item.id);
                        }}
                      >
                        🗑️
                      </Button>
                    )}
                  </div>
                )}

                <Card 
                  className="border-[#2d3548] bg-[#242938]/50 backdrop-blur rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#c9b896]/10 transition-all duration-500 cursor-pointer group"
                  onClick={() => handleOpenLightbox(index)}
                >
                  <div className="aspect-square bg-gradient-to-br from-muted to-secondary/20 flex items-center justify-center relative overflow-hidden">
                    {/* Gold accent corner */}
                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden rounded-tr-2xl z-10">
                      <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-secondary/30 to-transparent"></div>
                      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-secondary/30 to-transparent"></div>
                    </div>
                    
                    {/* Dissolving Before/After Images */}
                    {item.beforeImage || item.afterImage ? (() => {
                      const state = activeImages[item.id] || { orientationIndex: 0, type: 'before' };
                      const currentOrientation = item.orientations?.[state.orientationIndex] || { beforeImage: item.beforeImage, afterImage: item.afterImage };
                      const displayBeforeImage = currentOrientation.beforeImage || item.beforeImage;
                      const displayAfterImage = currentOrientation.afterImage || item.afterImage;
                      
                      return (
                        <div className="w-full h-full relative">
                          {/* Before Image */}
                          {displayBeforeImage && (
                            <img 
                              src={displayBeforeImage} 
                              alt="Before" 
                              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                              style={{ 
                                opacity: state.type === 'after' ? 0 : 1 
                              }}
                            />
                          )}
                          {/* After Image */}
                          {displayAfterImage && (
                            <img 
                              src={displayAfterImage} 
                              alt="After" 
                              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                              style={{ 
                                opacity: state.type === 'after' ? 1 : 0 
                              }}
                            />
                          )}
                          
                          {/* Label overlay */}
                          <div className="absolute bottom-4 right-4 z-20">
                            <div className="bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full border border-secondary/20">
                              <span className="text-xs text-secondary">
                                {state.type === 'after' ? 'After' : 'Before'}
                                {item.orientations && item.orientations.length > 1 && (
                                  <span className="ml-1 opacity-60">
                                    · View {state.orientationIndex + 1}/{item.orientations.length}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })() : (
                      <span className="text-muted-foreground">{item.title}</span>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="p-4 bg-card relative">
                    <div className="flex items-center justify-between">
                      {/* Category display/editor for admins */}
                      {isAdmin && isEditMode ? (
                        <Select
                          value={item.category}
                          onValueChange={async (newCategory) => {
                            try {
                              console.log(`Changing category for case ${item.id} from ${item.category} to ${newCategory}`);
                              
                              const response = await fetch(`${serverUrl}/gallery/case/${item.id}/category`, {
                                method: 'PATCH',
                                headers: {
                                  'Authorization': `Bearer ${accessToken}`,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ category: newCategory })
                              });
                              
                              if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.error || 'Failed to update category');
                              }
                              
                              console.log('Category updated successfully');
                              
                              // Immediately update local state for instant feedback
                              setGalleryItems(prevItems => 
                                prevItems.map(i => 
                                  i.id === item.id ? { ...i, category: newCategory } : i
                                )
                              );
                              
                              // Clear cache and reload in background
                              localStorage.removeItem('gallery_items_cache');
                              localStorage.removeItem('gallery_items_cache_timestamp');
                              loadGalleryImages();
                            } catch (error) {
                              console.error('Error updating category:', error);
                              alert(`Error updating category: ${error.message}`);
                            }
                          }}
                        >
                          <SelectTrigger 
                            className="h-7 w-auto text-sm border-none bg-transparent text-secondary hover:bg-secondary/10 focus:ring-1 focus:ring-secondary px-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent onClick={(e) => e.stopPropagation()}>
                            <SelectItem value="Nose">Nose</SelectItem>
                            <SelectItem value="Face">Face</SelectItem>
                            <SelectItem value="Breast">Breast</SelectItem>
                            <SelectItem value="Body">Body</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-secondary text-sm">{item.category}</span>
                      )}
                      <span className="text-xs text-muted-foreground group-hover:text-secondary transition-colors">View Details →</span>
                    </div>
                    <AccentLine className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Feature toggles for admins */}
                    {isAdmin && isEditMode && (
                      <div className="mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs text-muted-foreground mb-2">Show on:</p>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant={item.featuredOnHome ? "default" : "outline"}
                            className="text-xs h-6 px-2 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFlag(item.id, 'featuredOnHome', item.featuredOnHome || false);
                            }}
                          >
                            {item.featuredOnHome ? '✓' : ''} Home
                          </Button>
                          <Button
                            size="sm"
                            variant={item.showOnNose ? "default" : "outline"}
                            className="text-xs h-6 px-2 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFlag(item.id, 'showOnNose', item.showOnNose || false);
                            }}
                          >
                            {item.showOnNose ? '✓' : ''} Nose
                          </Button>
                          <Button
                            size="sm"
                            variant={item.showOnFace ? "default" : "outline"}
                            className="text-xs h-6 px-2 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFlag(item.id, 'showOnFace', item.showOnFace || false);
                            }}
                          >
                            {item.showOnFace ? '✓' : ''} Face
                          </Button>
                          <Button
                            size="sm"
                            variant={item.showOnBreast ? "default" : "outline"}
                            className="text-xs h-6 px-2 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFlag(item.id, 'showOnBreast', item.showOnBreast || false);
                            }}
                          >
                            {item.showOnBreast ? '✓' : ''} Breast
                          </Button>
                          <Button
                            size="sm"
                            variant={item.showOnBody ? "default" : "outline"}
                            className="text-xs h-6 px-2 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFlag(item.id, 'showOnBody', item.showOnBody || false);
                            }}
                          >
                            {item.showOnBody ? '✓' : ''} Body
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
            
            {/* Add New Case Card (only for admins in edit mode) */}
            {isAdmin && isEditMode && (
              <div className="relative">
                <Card 
                  className="border-2 border-dashed border-secondary/40 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-secondary/20 transition-all duration-500 cursor-pointer hover:-translate-y-2 group hover:border-secondary"
                  onClick={() => setNewCaseEditorOpen(true)}
                >
                  <div className="aspect-square bg-gradient-to-br from-muted to-secondary/10 flex items-center justify-center relative overflow-hidden">
                    {/* Gold accent corner */}
                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden rounded-tr-2xl z-10">
                      <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-secondary/30 to-transparent"></div>
                      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-secondary/30 to-transparent"></div>
                    </div>
                    
                    {/* Plus Icon */}
                    <div className="flex flex-col items-center justify-center">
                      <Plus className="w-24 h-24 text-secondary/40 group-hover:text-secondary transition-colors duration-300 group-hover:scale-110" />
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="p-4 bg-card relative">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">Add New Case</span>
                      <span className="text-xs text-muted-foreground group-hover:text-secondary transition-colors">Click to Create →</span>
                    </div>
                    <AccentLine className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </Card>
              </div>
            )}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <CircleAccent size="sm" className="mx-auto mb-4" />
              <p className="text-muted-foreground">No results found for this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Patient Privacy Notice */}
      <section className="py-16 bg-gradient-to-b from-[#1a1f2e] to-[#242938] border-t border-[#2d3548]">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <EditableText
            contentKey="gallery_privacy_notice"
            defaultValue="All images are published with patient consent. Individual results may vary. During your consultation, Dr. Hanemann will discuss realistic expectations for your specific case."
            as="p"
            className="text-gray-300"
            multiline
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-[#242938] to-[#1a1f2e] border-t border-[#2d3548] relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c9b896]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <EditableText
              contentKey="gallery_cta_heading"
              defaultValue="Envision Your Transformation"
              as="h2"
              className="mb-6 text-[#faf9f7]"
            />
          </motion.div>
          <motion.p 
            className="text-gray-300 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <EditableText
              contentKey="gallery_cta_description"
              defaultValue="Schedule a consultation to discuss how we can help you achieve results you'll love"
              as="span"
            />
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              className="rounded-full px-12 bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] shadow-lg hover:shadow-[#c9b896]/20 transition-all duration-300"
              onClick={() => onNavigate('Contact')}
            >
              Schedule a Consultation
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <GalleryLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        currentItem={filteredItems[currentLightboxIndex]}
        currentIndex={currentLightboxIndex}
        totalImages={filteredItems.length}
        onNext={handleNextImage}
        onPrevious={handlePreviousImage}
        onEditImage={(caseId, imageType, orientationIndex) => {
          // Close lightbox and open editor
          setLightboxOpen(false);
          setEditingItem({ id: caseId, type: imageType, orientationIndex });
          setEditorOpen(true);
        }}
      />

      {/* Image Editor */}
      {editingItem && accessToken && (
        <SimpleGalleryEditor
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          imageType={editingItem.type}
          galleryItemId={editingItem.id}
          currentImageUrl={(() => {
            const item = galleryItems.find(i => i.id === editingItem.id);
            if (!item) return undefined;
            
            // If orientationIndex is specified, use that orientation's image
            if (editingItem.orientationIndex !== undefined && item.orientations) {
              const orientation = item.orientations[editingItem.orientationIndex];
              return editingItem.type === 'before' 
                ? orientation?.beforeImage 
                : orientation?.afterImage;
            }
            
            // Otherwise use the base before/after image (position 1)
            return editingItem.type === 'before'
              ? item.beforeImage
              : item.afterImage;
          })()}
          onSaved={handleImageSaved}
          accessToken={accessToken}
        />
      )}

      {/* New Case Editor */}
      {newCaseEditorOpen && accessToken && (
        <NewGalleryCaseEditor
          isOpen={newCaseEditorOpen}
          onClose={() => setNewCaseEditorOpen(false)}
          onSaved={loadGalleryImages}
          accessToken={accessToken}
        />
      )}

      {/* Bulk Gallery Uploader */}
      {bulkUploaderOpen && accessToken && (
        <BulkGalleryUploader
          isOpen={bulkUploaderOpen}
          onClose={() => setBulkUploaderOpen(false)}
          onSaved={handleBulkUploadComplete}
          accessToken={accessToken}
        />
      )}

      {/* Gallery Orientation Manager */}
      {orientationManagerOpen && accessToken && (
        <GalleryOrientationManager
          isOpen={orientationManagerOpen}
          onClose={() => setOrientationManagerOpen(false)}
          caseId={orientationManagerCaseId}
          caseTitle={orientationManagerCaseTitle}
          onSaved={loadGalleryImages}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}
