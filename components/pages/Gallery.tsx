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
import { getOptimizedSupabaseUrl } from '../../hooks/useImagePreload';

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
  const categories = ['All', 'Face', 'Nose', 'Breast', 'Body'];
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
  const [diagnoseOpen, setDiagnoseOpen] = useState(false);
  const [diagnoseData, setDiagnoseData] = useState<any>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  // Kept for onLoad handler compatibility — card display uses fixed aspect-[3/4] instead
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<number, string>>({});


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
          const cachedItems = JSON.parse(cachedData);
          // Validate cache — if any item still has raw.githubusercontent.com URLs
          // the cache pre-dates the private-repo URL fix; bust it and re-fetch.
          const hasBadUrls = cachedItems.some((item: any) =>
            [item.beforeImage, item.afterImage,
              ...(item.orientations || []).flatMap((o: any) => [o.beforeImage, o.afterImage])]
              .filter(Boolean)
              .some((u: string) =>
                // Any URL that isn't already a raw GitHub URL is stale
                u.startsWith('gallery-img:') ||          // KV markers
                u.startsWith('/gallery/') ||              // old Vercel static paths
                u.includes('/gallery/img/')               // old Supabase proxy URLs
              )
          );
          if (hasBadUrls) {
            console.log('[Gallery] ⚠️  Cache has stale raw GitHub URLs — busting and re-fetching...');
            localStorage.removeItem('gallery_items_cache');
            localStorage.removeItem('gallery_items_cache_timestamp');
            // fall through to fresh fetch below
          } else {
            console.log('[Gallery] 🚀 Loading from cache (age:', Math.round(age / 1000), 'seconds)');
            setGalleryItems(cachedItems);
            setLoading(false);
            return;
          }
        }
      }
      
      // No valid cache — fetch fresh data from GitHub, then auto-sync KV in background
      await fetchAndUpdateGallery();
      // Fire-and-forget: update KV store with any new GitHub cases (non-blocking)
      triggerAutoSync();
      
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

  // Helper: Load cases from database only (fallback when GitHub fails)
  const loadCasesFromDatabaseOnly = async () => {
    try {
      console.log('[Gallery] Loading cases from database only...');
      
      const response = await fetch(`${serverUrl}/gallery/cases`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Database fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      const dbCases = data.cases || [];
      
      console.log('[Gallery] ✅ Loaded', dbCases.length, 'cases from database');
      
      // Convert database cases to gallery items format
      const galleryItems = dbCases.map(dbCase => ({
        id: dbCase.id,
        slug: dbCase.slug,
        title: dbCase.title || dbCase.slug,
        category: dbCase.category || 'Face',
        procedure: dbCase.procedure || '',
        journeyNote: dbCase.journeyNote || '',
        beforeImage: normalizeImageUrl(dbCase.beforeImage),
        afterImage: normalizeImageUrl(dbCase.afterImage),
        orientations: (dbCase.orientations || []).map((o: any) => ({
          ...o,
          beforeImage: normalizeImageUrl(o.beforeImage),
          afterImage: normalizeImageUrl(o.afterImage),
        })),
        featuredOnHome: dbCase.featuredOnHome || false,
        showOnNose: dbCase.showOnNose || false,
        showOnFace: dbCase.showOnFace || false,
        showOnBreast: dbCase.showOnBreast || false,
        showOnBody: dbCase.showOnBody || false,
        createdBy: dbCase.createdBy,
        createdAt: dbCase.createdAt
      }));
      
      console.log('[Gallery] Mapped to', galleryItems.length, 'gallery items');
      console.log('[Gallery] Sample case images:', galleryItems[0]?.beforeImage, galleryItems[0]?.afterImage);
      console.log('[Gallery] Sample orientations:', galleryItems[0]?.orientations);
      
      setGalleryItems(galleryItems);
      setLoading(false);
      
      // Cache the results
      localStorage.setItem('gallery_items_cache', JSON.stringify(galleryItems));
      localStorage.setItem('gallery_items_cache_timestamp', Date.now().toString());
      
    } catch (error) {
      console.error('[Gallery] Error loading from database:', error);
      setGalleryItems([]);
      setLoading(false);
    }
  };
  
  // Resolve any image URL/marker to a raw.githubusercontent.com URL.
  // The repo is public — raw GitHub URLs work directly in the browser, no proxy needed.
  // Handles all historical formats stored in KV or localStorage cache:
  //   raw.githubusercontent.com/...  ← current format (public repo, works directly)
  //   gallery-img:{rel}              ← KV marker format
  //   .../gallery/img/{rel}          ← old Supabase proxy URL
  //   /gallery/{rel}                 ← previous Vercel static path (404d)
  const GITHUB_RAW = 'https://raw.githubusercontent.com/Nesbit25/HPS-WEB-FEBRUARY/main';

  const normalizeImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    // Already a raw GitHub URL — good
    if (url.includes('raw.githubusercontent.com')) return url;
    // KV marker format: "gallery-img:{rel}"
    if (url.startsWith('gallery-img:')) {
      return `${GITHUB_RAW}/gallery/${url.slice('gallery-img:'.length)}`;
    }
    // Old Supabase proxy URL: .../gallery/img/{rel}
    if (url.includes('/gallery/img/')) {
      const match = url.match(/\/gallery\/img\/(.+)$/);
      if (match) return `${GITHUB_RAW}/gallery/${match[1]}`;
    }
    // /gallery/... Vercel static path
    if (url.startsWith('/gallery/')) {
      return `${GITHUB_RAW}/gallery/${url.slice('/gallery/'.length)}`;
    }
    return url;
  };

  // Fire-and-forget: tells the server to create KV records for any new GitHub cases.
  // Completely non-blocking — gallery renders from GitHub files regardless.
  const triggerAutoSync = () => {
    fetch(`${serverUrl}/gallery/auto-sync`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.skipped) {
          console.log('[Gallery] Auto-sync skipped (cooldown active)');
        } else {
          console.log(`[Gallery] Auto-sync complete — created: ${data.casesCreated}, skipped: ${data.casesSkipped}`);
        }
      })
      .catch(err => console.warn('[Gallery] Auto-sync failed (non-critical):', err));
  };

  const fetchAndUpdateGallery = async () => {
    try {
      // 1. Fetch file list from GitHub via SERVER (authenticated)
      console.log('[Gallery] ========== START GALLERY LOAD ==========');
      console.log('[Gallery] Fetching file list from GitHub via server...');
      
      const response = await fetch(`${serverUrl}/gallery/github-files?t=${Date.now()}`);
      console.log('[Gallery] Server response status:', response.status);
      
      const data = await response.json();
      
      // Handle 404 - folder doesn't exist yet (no images uploaded)
      if (response.status === 404 || !data.exists) {
        console.log('[Gallery] ❌ Gallery folder not found in GitHub');
        console.log('[Gallery] Falling back to database-only load...');
        await loadCasesFromDatabaseOnly();
        return;
      }
      
      if (!response.ok || !data.files) {
        console.error('[Gallery] ❌ Server error:', data.error);
        console.log('[Gallery] Falling back to database-only load...');
        await loadCasesFromDatabaseOnly();
        return;
      }
      
      const files = data.files;
      console.log('[Gallery] ✅ Found', files.length, 'files in GitHub repo');
      
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
        
        const galleryRelPath = (file as any).path
          ? (file as any).path.replace(/^(?:public\/)?gallery\//, '')
          : file.name;
        const repoPath = (file as any).path || `gallery/${file.name}`;
        // Repo is now public — build raw.githubusercontent.com URLs directly.
        // No proxy, no Supabase involved. Browser fetches straight from GitHub CDN.
        const imageUrl = `https://raw.githubusercontent.com/Nesbit25/HPS-WEB-FEBRUARY/main/${repoPath}`;
        
        console.log(`[Gallery] Parsed: ${file.name} -> case=${caseSlug}, position=${position}, type=${type}`);
        
        // Get or create case
        if (!casesMap.has(caseSlug)) {
          // Generate readable title from slug
          const title = caseSlug
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          // Category comes from the directory structure (Face|Breast|Body) — not a default guess
          const category = (file as any).category || 'Face';

          casesMap.set(caseSlug, {
            slug: caseSlug,
            title,
            category,
            procedure: category,
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
      console.log('[Gallery] Gallery items sample:', galleryItems.slice(0, 3));
      
      // 5. Fetch case metadata from database (category, featured flags)
      try {
        console.log('[Gallery] Fetching case metadata from database...');
        const casesResponse = await fetch(`${serverUrl}/gallery/cases`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        
        console.log('[Gallery] Database response status:', casesResponse.status);
        
        if (casesResponse.ok) {
          const casesData = await casesResponse.json();
          const dbCases = casesData.cases || [];
          
          console.log('[Gallery] ✅ Loaded', dbCases.length, 'cases from database');
          console.log('[Gallery] Database cases sample:', dbCases.slice(0, 3).map(c => ({ id: c.id, slug: c.slug, title: c.title })));
          
          // Merge database metadata with GitHub images
          galleryItems.forEach(item => {
            const dbCase = dbCases.find(c => c.slug === item.slug);
            if (dbCase) {
              // Use the DB's real sequential ID so PATCH /toggle hits the right KV key.
              // Without this, item.id is a stringToId() hash that never matches gallery_case_<seq>.
              if (dbCase.id) item.id = dbCase.id;
              item.category = dbCase.category || item.category || 'Face';
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
      
      // 6. Deduplicate by slug (belt-and-suspenders: casesMap already deduplicates,
      //    but a second pass guards against edge-case double-entries and ensures
      //    React key={item.id} never collides across hash and sequential IDs).
      const seenSlugs = new Set<string>();
      const seenIds = new Set<number>();
      const dedupedItems = galleryItems.filter(item => {
        if (!item.slug) {
          // Orphan stubs (no slug) — keep only if id not already seen
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        }
        if (seenSlugs.has(item.slug)) {
          console.warn('[Gallery] Dedup: dropping duplicate slug:', item.slug);
          return false;
        }
        if (seenIds.has(item.id)) {
          console.warn('[Gallery] Dedup: id collision (hash/sequential mismatch) for slug:', item.slug, 'id:', item.id);
          return false;
        }
        seenSlugs.add(item.slug);
        seenIds.add(item.id);
        return true;
      });

      // 7. Cache the deduplicated results
      localStorage.setItem('gallery_items_cache', JSON.stringify(dedupedItems));
      localStorage.setItem('gallery_items_cache_timestamp', Date.now().toString());
      
      console.log('[Gallery] ✅ Setting state with', dedupedItems.length, 'items (deduped from', galleryItems.length, ')');
      setGalleryItems(dedupedItems);
      setLoading(false);
      console.log('[Gallery] ========== END GALLERY LOAD ==========');
    } catch (error) {
      console.error('[Gallery] ❌ ERROR in fetchAndUpdateGallery:', error);
      console.error('[Gallery] Error stack:', error.stack);
      setLoading(false);
      throw error;
    }
  };

  const filteredItems = selectedCategory === 'All' 
    ? galleryItems.filter(item => {
        // Always exclude orphan KV stubs — these are slug-less entries created by
        // the old broken toggle code. They have no images and no slug and would
        // appear as blank/phantom cards even in admin mode.
        if (!item.slug && !item.beforeImage && !item.afterImage) return false;
        // Admins in edit mode can see real items even without images (e.g. new cases)
        if (isAdmin && isEditMode) return true;
        // Public users only see items with images
        return item.beforeImage || item.afterImage;
      })
    : galleryItems.filter(item => {
        // Exclude orphan stubs
        if (!item.slug && !item.beforeImage && !item.afterImage) return false;
        // Category filter
        if (item.category !== selectedCategory) return false;
        // Admins in edit mode can see real items even without images
        if (isAdmin && isEditMode) return true;
        // Public users only see items with images
        return item.beforeImage || item.afterImage;
      });

  // Preload first 6 images for faster initial load
  useEffect(() => {
    if (filteredItems.length > 0) {
      const priorityImages = filteredItems
        .slice(0, 6)
        .flatMap(item => [
          item.beforeImage ? getOptimizedSupabaseUrl(item.beforeImage, { width: 800, quality: 80, format: 'webp' }) : null,
          item.afterImage ? getOptimizedSupabaseUrl(item.afterImage, { width: 800, quality: 80, format: 'webp' }) : null
        ])
        .filter(Boolean);
      
      // Preload priority images using link rel="preload"
      const links: HTMLLinkElement[] = [];
      
      priorityImages.forEach(url => {
        if (!url) return;
        
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        
        // Add CORS for cross-origin images
        if (url.includes('supabase.co') || url.includes('githubusercontent.com')) {
          link.crossOrigin = 'anonymous';
        }
        
        document.head.appendChild(link);
        links.push(link);
      });
      
      // Cleanup
      return () => {
        links.forEach(link => {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        });
      };
    }
  }, [filteredItems]);

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
      const response = await fetch(`${serverUrl}/gallery/cases`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      const data = await response.json();
      
      const cases = data.cases || [];
      
      const message = cases.length === 0 
        ? '❌ No gallery cases found in database!\n\nThe gallery_case_ keys are empty.'
        : `📊 Gallery Cases in Database:\n\n${cases.map(c => {
            return `ID: ${c.id}\nSlug: ${c.slug}\nCategory: ${c.category}\nTitle: ${c.title}\nOrientations: ${c.orientations?.length || 0}`;
          }).join('\n\n---\n\n')}\n\nTotal: ${cases.length} cases`;
      
      alert(message);
      console.log('Full debug data:', data);
    } catch (error) {
      alert(`Error loading debug info: ${error.message}`);
    }
  };

  const handleDebugDisplayed = () => {
    const message = galleryItems.length === 0 
      ? '❌ No gallery items currently displayed!\n\ngalleryItems array is empty.'
      : `📊 Currently Displayed Cases:\n\n${galleryItems.map(item => {
          return `ID: ${item.id}\nSlug: ${item.slug}\nCategory: ${item.category}\nTitle: ${item.title}\nBefore: ${item.beforeImage ? '✅' : '❌'}\nAfter: ${item.afterImage ? '✅' : '❌'}\nOrientations: ${item.orientations?.length || 0}`;
        }).join('\n\n---\n\n')}\n\nTotal displayed: ${galleryItems.length} cases`;
    
    alert(message);
    console.log('Current galleryItems:', galleryItems);
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
        alert(`Failed to fix case ID: ${data.message}`);
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

  const handleCreateNewCase = async () => {
    try {
      // First, check if gallery folder exists
      console.log('[Create Case] Checking if gallery folder exists...');
      const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`;
      
      const response = await fetch(githubApiUrl);
      
      // If folder doesn't exist (404), create it
      if (response.status === 404) {
        console.log('[Create Case] Gallery folder does not exist, creating it...');
        
        if (!confirm('The gallery folder does not exist in GitHub yet.\n\nWould you like to create it now?\n\n(This will create an empty .gitkeep file to initialize the folder)')) {
          return;
        }
        
        // Create .gitkeep file to initialize the folder
        const createResponse = await fetch(`${serverUrl}/gallery/create-folder`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || 'Failed to create gallery folder');
        }
        
        alert('✅ Gallery folder created successfully!\n\nYou can now create cases and upload images.');
        
        // Reload gallery to clear the error state
        loadGalleryImages();
      }
      
      // Open the case editor
      setNewCaseEditorOpen(true);
    } catch (error) {
      console.error('[Create Case] Error:', error);
      alert(`Error: ${error.message}\n\nPlease try again or contact support.`);
    }
  };

  const handleDiagnoseFilenames = async () => {
    setDiagnosing(true);
    setDiagnoseOpen(true);
    setDiagnoseData(null);
    try {
      const resp = await fetch(`${serverUrl}/gallery/diagnose-filenames?t=${Date.now()}`);
      const data = await resp.json();
      console.log('[Diagnose] Result:', data);
      setDiagnoseData(data);
    } catch (error) {
      console.error('[Diagnose] Error:', error);
      setDiagnoseData({ error: error.message });
    } finally {
      setDiagnosing(false);
    }
  };

  const handleSyncFromGitHub = async () => {
    try {
      if (!confirm('🔄 Sync Cases from GitHub?\n\nThis will scan the GitHub gallery folder and create missing case records in the database.\n\nExisting cases will NOT be modified or duplicated.\n\nContinue?')) {
        return;
      }

      console.log('[Sync GitHub] Starting sync...');
      
      const response = await fetch(`${serverUrl}/gallery/sync-from-github`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync from GitHub');
      }
      
      const result = await response.json();
      
      console.log('[Sync GitHub] Result:', result);
      
      let message = '✅ Sync Complete!\n\n';
      message += `Cases found in GitHub: ${result.casesFound}\n`;
      message += `New cases created: ${result.casesCreated}\n`;
      message += `Existing cases skipped: ${result.casesSkipped}\n\n`;
      
      if (result.createdCases && result.createdCases.length > 0) {
        message += 'New cases:\n';
        result.createdCases.forEach(c => {
          message += `  • ${c}\n`;
        });
      }
      
      message += '\n📋 The gallery will now reload...';
      
      alert(message);
      
      // Clear client-side cache
      console.log('[Sync GitHub] Clearing client-side cache...');
      localStorage.removeItem('gallery_items_cache');
      localStorage.removeItem('gallery_items_cache_timestamp');
      
      // Force reload the gallery by calling fetchAndUpdateGallery directly (bypasses cache check)
      console.log('[Sync GitHub] Reloading gallery...');
      setLoading(true);
      await fetchAndUpdateGallery();
    } catch (error) {
      console.error('[Sync GitHub] Error:', error);
      alert(`Error syncing from GitHub: ${error.message}`);
    }
  };

  // Nuke all KV cases then rebuild fresh from GitHub
  const handleRebuildAllFromGitHub = async () => {
    if (!confirm(
      '🔥 REBUILD ALL CASES FROM GITHUB\n\n' +
      'This will:\n' +
      '  1. DELETE every gallery case in the database\n' +
      '  2. Re-scan GitHub for all photos\n' +
      '  3. Create fresh case records from the filenames\n\n' +
      'This is the right move when photos exist in GitHub but cases are blank.\n\n' +
      'Continue?'
    )) return;

    try {
      setLoading(true);
      console.log('[Rebuild] Clearing KV + syncing from GitHub...');

      const response = await fetch(`${serverUrl}/gallery/sync-from-github`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clearFirst: true })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Rebuild failed');
      }

      const result = await response.json();
      console.log('[Rebuild] Result:', result);

      let msg = '✅ Rebuild Complete!\n\n';
      msg += `📁 Images found in GitHub: ${result.imagesFound ?? '?'}\n`;
      msg += `📦 Cases found: ${result.casesFound ?? '?'}\n`;
      msg += `✅ Cases created: ${result.casesCreated}\n`;
      if (result.failedCases?.length) msg += `⚠️  Failed: ${result.failedCases.length}\n`;

      alert(msg);

      // Clear cache and reload
      localStorage.removeItem('gallery_items_cache');
      localStorage.removeItem('gallery_items_cache_timestamp');
      await fetchAndUpdateGallery();
    } catch (error) {
      console.error('[Rebuild] Error:', error);
      alert(`Rebuild error: ${error.message}`);
      setLoading(false);
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
        // Bust localStorage cache so the flag change is visible immediately on
        // this page AND on Home / procedure pages (they all share the same cache key).
        localStorage.removeItem('gallery_items_cache');
        localStorage.removeItem('gallery_items_cache_timestamp');
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

  const handleCleanupOrphans = async () => {
    if (!confirm(
      '🧹 CLEANUP ORPHAN ENTRIES\n\n' +
      'This will scan the database and remove:\n' +
      '  • Stub entries with no slug (created by old toggle bug)\n' +
      '  • Duplicate slug entries (keeps first, removes extras)\n\n' +
      'Real gallery cases and their photos are NOT affected.\n\n' +
      'Continue?'
    )) return;

    try {
      const response = await fetch(`${serverUrl}/gallery/cleanup-orphans`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Cleanup failed');
      }

      const data = await response.json();
      alert(
        `✅ Cleanup Complete!\n\n` +
        `🗑  Orphan stubs removed: ${data.orphansRemoved}\n` +
        `🗑  Duplicate slugs removed: ${data.duplicatesRemoved}\n` +
        `📦  Total entries removed: ${data.totalRemoved}\n\n` +
        (data.totalRemoved === 0 ? 'No issues found — your database is clean!' : 'Gallery refreshed.')
      );

      localStorage.removeItem('gallery_items_cache');
      localStorage.removeItem('gallery_items_cache_timestamp');
      loadGalleryImages();
    } catch (error) {
      console.error('[Cleanup Orphans] Error:', error);
      alert(`Error during cleanup: ${error.message}`);
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
      

      {/* Gallery Filters */}
      <section className="pt-48 pb-16 bg-[#1a1f2e] border-b border-[#2d3548]">
        <div className="container mx-auto px-6">
          {/* Debug button for admins */}
          {isAdmin && isEditMode && (
            <div className="hidden">
              <Button
                variant="default"
                size="sm"
                onClick={handleCreateNewCase}
                className="rounded-full bg-[#c9b896] text-[#1a1f2e] hover:bg-[#b8976a] shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Case
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSyncFromGitHub}
                className="rounded-full bg-green-600 text-white hover:bg-green-700 shadow-lg"
              >
                🔄 Sync from GitHub
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleRebuildAllFromGitHub}
                className="rounded-full bg-red-700 text-white hover:bg-red-800 shadow-lg font-bold"
              >
                🔥 Rebuild All Cases
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanupOrphans}
                className="rounded-full border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
              >
                🧹 Clean Orphans
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDebugGallery}
                className="rounded-full border-[#c9b896] text-[#c9b896] hover:bg-[#c9b896] hover:text-[#1a1f2e]"
              >
                🔍 Debug Database
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDebugDisplayed}
                className="rounded-full border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
              >
                👁️ Debug Displayed
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
                onClick={handleDiagnoseFilenames}
                className="rounded-full border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-[#1a1f2e]"
              >
                🔬 Diagnose Filenames
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
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('gallery_items_cache');
                  localStorage.removeItem('gallery_items_cache_timestamp');
                  setLoading(true);
                  fetchAndUpdateGallery().then(() => console.log('[Gallery] Force refresh complete'));
                }}
                className="rounded-full border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
              >
                ♻️ Force Refresh Cache
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
                  ? (isAdmin && isEditMode
                      ? galleryItems.length
                      : galleryItems.filter(item => item.beforeImage || item.afterImage).length)
                  : (isAdmin && isEditMode
                      ? galleryItems.filter(item => item.category === category).length
                      : galleryItems.filter(item =>
                          item.category === category &&
                          (item.beforeImage || item.afterImage)
                        ).length);
                
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
                    {/* Delete button — available for ALL cases in admin mode */}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-full shadow-2xl border-2 border-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete case "${item.title || item.slug}"?\n\nThis removes it from the database. Photos in GitHub are not affected.`)) {
                          handleDeleteCase(item.id);
                        }
                      }}
                    >
                      🗑️
                    </Button>
                  </div>
                )}

                <Card 
                  className="border-[#2d3548] bg-[#242938]/50 backdrop-blur rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#c9b896]/10 transition-all duration-500 cursor-pointer group"
                  onClick={() => handleOpenLightbox(index)}
                >
                  <div className="aspect-[3/4] w-full bg-[#1a1f2e] flex items-center justify-center relative overflow-hidden">
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
                      
                      // Helper function to optimize Supabase URLs
                      const getOptimizedUrl = (url: string) => {
                        if (!url) return url;
                        
                        // Check if it's a Supabase storage URL
                        if (url.includes('supabase.co/storage/v1/object/public/')) {
                          // Add optimization parameters for faster loading
                          return `${url}?width=800&quality=80&format=webp`;
                        }
                        
                        // Return original URL for non-Supabase URLs (like GitHub)
                        return url;
                      };
                      
                      // Prioritize first 6 images (above the fold on desktop)
                      const isPriority = index < 6;
                      
                      return (
                        <div className="w-full h-full relative">
                          {/* Before Image */}
                          {displayBeforeImage && (
                            <img 
                              src={getOptimizedUrl(displayBeforeImage)} 
                              alt="Before" 
                              loading={isPriority ? 'eager' : 'lazy'}
                              fetchpriority={isPriority ? 'high' : 'auto'}
                              className="absolute inset-0 w-full h-full object-contain transition-opacity duration-1000"
                              style={{ opacity: state.type === 'after' ? 0 : 1 }}
                              onLoad={(e) => {
                                if (imageAspectRatios[item.id]) return;
                                const img = e.currentTarget;
                                const r = img.naturalWidth / img.naturalHeight;
                                // Exact pixel ratio — container matches image perfectly, zero cropping
                                const aspect = `${img.naturalWidth} / ${img.naturalHeight}`;
                                setImageAspectRatios(prev => ({ ...prev, [item.id]: aspect }));
                              }}
                              onError={(e) => {
                                console.error('[Gallery] ❌ Before image failed to load:', displayBeforeImage);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          {/* After Image */}
                          {displayAfterImage && (
                            <img 
                              src={getOptimizedUrl(displayAfterImage)} 
                              alt="After" 
                              loading={isPriority ? 'eager' : 'lazy'}
                              fetchpriority={isPriority ? 'high' : 'auto'}
                              className="absolute inset-0 w-full h-full object-contain transition-opacity duration-1000"
                              style={{ opacity: state.type === 'after' ? 1 : 0 }}
                              onLoad={(e) => {
                                if (imageAspectRatios[item.id]) return;
                                const img = e.currentTarget;
                                const aspect = `${img.naturalWidth} / ${img.naturalHeight}`;
                                setImageAspectRatios(prev => ({ ...prev, [item.id]: aspect }));
                              }}
                              onError={(e) => {
                                console.error('[Gallery] ❌ After image failed to load:', displayAfterImage);
                                (e.target as HTMLImageElement).style.display = 'none';
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

      {/* Filename Diagnose Modal */}
      {diagnoseOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onClick={() => setDiagnoseOpen(false)}>
          <div className="bg-[#1a1f2e] border border-[#2d3548] rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3548]">
              <h3 className="text-[#c9b896] font-semibold text-lg">🔬 Filename Pattern Diagnosis</h3>
              <button onClick={() => setDiagnoseOpen(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="overflow-y-auto p-6 font-mono text-sm text-gray-300 space-y-4">
              {diagnosing && <p className="text-yellow-400 animate-pulse">Fetching filenames from GitHub…</p>}
              {diagnoseData?.error && <p className="text-red-400">❌ Error: {diagnoseData.error}</p>}
              {diagnoseData && !diagnoseData.error && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-center mb-4">
                    <div className="bg-[#242938] rounded-lg p-3">
                      <div className="text-2xl font-bold text-white">{diagnoseData.totalImages}</div>
                      <div className="text-xs text-gray-400">Total images</div>
                    </div>
                    <div className="bg-[#242938] rounded-lg p-3">
                      <div className={`text-2xl font-bold ${diagnoseData.notMatchingStdPattern > 0 ? 'text-red-400' : 'text-green-400'}`}>{diagnoseData.notMatchingStdPattern}</div>
                      <div className="text-xs text-gray-400">Not matching standard pattern</div>
                    </div>
                  </div>
                  {diagnoseData.notMatchingStdPattern > 0 && (
                    <div>
                      <p className="text-red-400 font-bold mb-2">❌ Files NOT matching <code className="bg-black/30 px-1 rounded">{'{{slug}}_p{{n}}_img{{n}}.ext'}</code>:</p>
                      {(diagnoseData.sampleNonMatching || []).map((f, i) => (
                        <div key={i} className="text-red-300 pl-2">{f}</div>
                      ))}
                    </div>
                  )}
                  {diagnoseData.matchingStdPattern > 0 && (
                    <div>
                      <p className="text-green-400 font-bold mb-2">✅ Sample files matching standard pattern ({diagnoseData.matchingStdPattern} total):</p>
                      {(diagnoseData.sampleMatching || []).map((f, i) => (
                        <div key={i} className="text-green-300 pl-2">{f}</div>
                      ))}
                    </div>
                  )}
                  <div>
                    <p className="text-[#c9b896] font-bold mb-2">📋 First 50 filenames (all):</p>
                    {(diagnoseData.allFirst50 || []).map((f, i) => (
                      <div key={i} className="text-gray-300 pl-2">{f}</div>
                    ))}
                  </div>
                  {diagnoseData.truncated && (
                    <p className="text-yellow-400 mt-4">⚠️ Git tree was truncated — some files may be missing from this list.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}