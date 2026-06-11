import React, { useState, useEffect, useMemo } from 'react';
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
import { Edit2, Plus, Upload as UploadIcon, Image as ImageIcon, ArrowLeft, GripVertical } from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getOptimizedSupabaseUrl } from '../../hooks/useImagePreload';
import { useParams, useNavigate } from 'react-router';

// ─── Procedure display name maps (derived from repo folder names & filename prefixes) ───
const PROCEDURE_FOLDER_DISPLAY: Record<string, string> = {
  'breast-augmentation-photos':      'Breast Augmentation',
  'breast-augmentation-lift-photos': 'Breast Aug + Lift',
  'breast-lift-photos':              'Breast Lift',
  'tuberous-breast-photos':          'Tuberous Breast',
  'explant-mastopexy':               'Explant / Mastopexy',
  'breast-reduction-photos':         'Breast Reduction',
  'asymmetrical-breast-photos':      'Asymmetrical Breast',
  'ftm-top-photos':                  'FTM Top Surgery',
  'gynecomastia-photos':             'Gynecomastia',
  'tummy-tuck-photos':               'Tummy Tuck',
  'arm-lift-photos':                 'Arm Lift',
  'thigh-lift-photos':               'Thigh Lift',
  'body-contouring-photos':          'Body Contouring',
  'liposuction-photos-2':            'Liposuction',
  'eyelid-surgery-photos':           'Eyelid Surgery',
  'facelift-necklift-photos':        'Facelift / Neck Lift',
  'chin-augmentation-photos':        'Chin Augmentation',
  'otoplasty-photos':                'Otoplasty',
  'liposuction-photos':              'Liposuction',
  'rhinoplasty-photos':              'Rhinoplasty',
  'revision-rhinoplasty-photos':     'Secondary / Revision Rhinoplasty',
  'ethnic-rhinoplasty-photos':       'Ethnic Rhinoplasty',
};

const PROCEDURE_PREFIX_DISPLAY: Record<string, string> = {
  'BREAST_AUGMENTATION':   'Breast Augmentation',
  'BREAST_AUG_LIFT':       'Breast Aug + Lift',
  'BREAST_LIFT':           'Breast Lift',
  'TUBEROUS_BREAST':       'Tuberous Breast',
  'EXPLANT_MASTOPEXY':     'Explant / Mastopexy',
  'BREAST_REDUCTION':      'Breast Reduction',
  'ASYMMETRICAL_BREAST':   'Asymmetrical Breast',
  'FTM_TOP':               'FTM Top Surgery',
  'GYNECOMASTIA':          'Gynecomastia',
  'TUMMY_TUCK':            'Tummy Tuck',
  'ARM_LIFT':              'Arm Lift',
  'THIGH_LIFT':            'Thigh Lift',
  'BODY_CONTOURING':       'Body Contouring',
  'LIPOSUCTION':           'Liposuction',
  'BODY_LIPOSUCTION':      'Liposuction',
  'EYELID_SURGERY':        'Eyelid Surgery',
  'FACELIFT_NECKLIFT':     'Facelift / Neck Lift',
  'CHIN_AUGMENTATION':     'Chin Augmentation',
  'OTOPLASTY':             'Otoplasty',
  'RHINOPLASTY':           'Rhinoplasty',
  'REVISION_RHINOPLASTY':  'Secondary / Revision Rhinoplasty',
  'SECONDARY_RHINOPLASTY': 'Secondary / Revision Rhinoplasty',
  'ETHNIC_RHINOPLASTY':    'Ethnic Rhinoplasty',
};

// ─── Custom subcategory order per category (matches current live site) ───
const PROCEDURE_ORDER: Record<string, string[]> = {
  Breast: [
    'Breast Augmentation',
    'Tuberous Breast',
    'Breast Aug + Lift',
    'Breast Lift',
    'Explant / Mastopexy',
    'Breast Reduction',
    'Asymmetrical Breast',
    'Gynecomastia',
    'FTM Top Surgery',
  ],
  Body: [
    'Tummy Tuck',
    'Arm Lift',
    'Thigh Lift',
    'Body Contouring',
    'Liposuction',
  ],
  Face: [
    'Eyelid Surgery',
    'Facelift / Neck Lift',
    'Chin Augmentation',
    'Otoplasty',
    'Liposuction',
  ],
  Nose: [
    'Rhinoplasty',
    'Secondary / Revision Rhinoplasty',
    'Ethnic Rhinoplasty',
  ],
};

// ─── Display label overrides (rename for public display only) ───
const PROCEDURE_DISPLAY_LABEL: Record<string, string> = {
  'Breast Lift':           'Breast Lift (Mastopexy)',
  'Breast Aug + Lift':     'Breast Aug w/ Lift',
  'Tummy Tuck':            'Tummy Tuck (Abdominoplasty)',
  'Arm Lift':              'Arm Lift (Brachioplasty)',
  'Eyelid Surgery':        'Eyelid Rejuvenation',
  'Facelift / Neck Lift':  'Facelift / Necklift',
};

/** Get the display label for a procedure (applies rename overrides). */
const getProcedureDisplayLabel = (proc: string): string =>
  PROCEDURE_DISPLAY_LABEL[proc] || proc;

/** Derive a human-readable procedure name from a filename prefix (e.g. "BREAST_AUGMENTATION"). */
const getProcedureNameFromPrefix = (prefix: string): string => {
  const key = prefix.toUpperCase();
  if (PROCEDURE_PREFIX_DISPLAY[key]) return PROCEDURE_PREFIX_DISPLAY[key];
  return prefix.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

/** Extract patient number from slug (e.g. "BREAST_AUGMENTATION_Patient03" → "03") */
const getPatientNumberFromSlug = (slug?: string): string => {
  if (!slug) return '';
  const match = slug.match(/_Patient(\d+)/i);
  if (!match) return '';
  // Pad to 2 digits for consistent display
  return match[1].padStart(2, '0');
};

/** Build display label for a card: "Procedure Name — Patient NN" (falls back gracefully).
    `overrideNumber`, when provided, replaces the slug-derived patient number — used
    for the "Body / Liposuction" view, where neck-lipo cases continue Body's sequence. */
const getCaseDisplayLabel = (
  procedureName?: string,
  slug?: string,
  fallbackTitle?: string,
  overrideNumber?: string
): string => {
  const patientNum = overrideNumber || getPatientNumberFromSlug(slug);
  const procLabel = procedureName ? getProcedureDisplayLabel(procedureName) : '';
  if (procLabel && patientNum) return `${procLabel} — Patient ${patientNum}`;
  if (procLabel) return procLabel;
  return fallbackTitle || '';
};
interface GalleryProps {
  onNavigate: (page: string) => void;
  initialCategory?: string;
  initialProcedure?: string;
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
  procedureName?: string; // Human-readable surgery name (e.g., "Breast Augmentation")
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
  sortOrder?: number;
}

export function Gallery({ onNavigate, initialCategory, initialProcedure }: GalleryProps) {
  const { isAdmin, accessToken } = useAuth();
  const { isEditMode } = useEditMode();
  const routeNavigate = useNavigate();
  const categories = ['All', 'Face', 'Nose', 'Breast', 'Body'];
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'All');
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>(initialProcedure ? [initialProcedure] : []); // empty array = show all
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
  // Stores the computed card aspect ratio per item: (naturalWidth * 2) / naturalHeight
  // Multiplied by 2 because the card shows Before + After side by side
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<number, number>>({});
  // Admin drag-and-drop reorder state
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);


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
      const cacheVersionKey = 'gallery_items_cache_version';
      const CACHE_VERSION = '2'; // Bump to bust stale procedureName data
      const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

      // Bust cache if version mismatch
      if (localStorage.getItem(cacheVersionKey) !== CACHE_VERSION) {
        console.log('[Gallery] Cache version mismatch — busting cache');
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheTimestampKey);
        localStorage.setItem(cacheVersionKey, CACHE_VERSION);
      }
      
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
      const galleryItems = dbCases.map(dbCase => {
        // Derive procedureName from slug prefix (e.g. BREAST_AUGMENTATION_Patient01)
        const slugPrefix = dbCase.slug?.match(/^([A-Z_]+)_Patient/i)?.[1] || '';
        const procedureName = getProcedureNameFromPrefix(slugPrefix) || dbCase.procedure || '';
        return ({
        id: dbCase.id,
        slug: dbCase.slug,
        title: dbCase.title || dbCase.slug,
        category: dbCase.category || 'Face',
        procedure: dbCase.procedure || '',
        procedureName,
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
        createdAt: dbCase.createdAt,
        sortOrder: typeof dbCase.sortOrder === 'number' ? dbCase.sortOrder : undefined
      });});
      
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
      // New format: {PROCEDURE_PREFIX}_Patient{NN}_{Before|After}{N}.{ext}
      const filenameRegex = /^([A-Z_]+)_Patient(\d+)_(Before|After)(\d+)\.(jpg|jpeg|png)$/i;
      
      const casesMap = new Map();
      
      imageFiles.forEach(file => {
        const match = file.name.match(filenameRegex);
        
        if (!match) {
          console.warn('[Gallery] Skipping file with invalid format:', file.name);
          return;
        }
        
        const [, procedurePrefix, patientNum, beforeAfter, viewNumStr] = match;
        const caseSlug = `${procedurePrefix}_Patient${patientNum}`;
        const viewNum  = parseInt(viewNumStr);
        const type     = beforeAfter.toLowerCase() === 'before' ? 'before' : 'after';
        const position = viewNum; // view number is the orientation position
        
        const repoPath = (file as any).path || `gallery/${file.name}`;
        // Public repo — build raw.githubusercontent.com URLs directly
        const imageUrl = `https://raw.githubusercontent.com/Nesbit25/HPS-WEB-FEBRUARY/main/${repoPath}`;
        
        console.log(`[Gallery] Parsed: ${file.name} -> case=${caseSlug}, view=${position}, type=${type}`);
        
        // Get or create case
        if (!casesMap.has(caseSlug)) {
          const procTitle = procedurePrefix
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
          const title = `${procTitle} — Patient ${patientNum}`;
          
          // Category comes from the directory structure (Face|Breast|Body|Nose)
          const category = (file as any).category || 'Face';

          // Derive human-readable procedure name:
          // Prefer the folder name returned by the server, fall back to filename prefix
          const procedureDir = (file as any).procedureDir as string | undefined;
          const procedureName = procedureDir
            ? (PROCEDURE_FOLDER_DISPLAY[procedureDir] || getProcedureNameFromPrefix(procedurePrefix))
            : getProcedureNameFromPrefix(procedurePrefix);

          casesMap.set(caseSlug, {
            slug: caseSlug,
            title,
            category,
            procedure: category,
            procedureName,
            journeyNote: '',
            orientations: [],
            createdAt: new Date().toISOString()
          });
        }
        
        const caseData = casesMap.get(caseSlug);
        
        // Find or create orientation for this view position
        let orientation = caseData.orientations.find(o => o.name === `View ${position}`);
        if (!orientation) {
          orientation = {
            name: `View ${position}`,
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
        // Sort orientations by view number (names are "View 1", "View 2", etc.)
        caseData.orientations.sort((a, b) => {
          const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
          const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
          return numA - numB;
        });
        
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
              if (typeof dbCase.sortOrder === 'number') item.sortOrder = dbCase.sortOrder;
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

  const CATEGORY_ORDER: Record<string, number> = { Breast: 0, Body: 1, Face: 2, Nose: 3 };

  // Helper: check if an item matches any of the selected procedure filters.
  // Checks procedureName first, then falls back to matching the slug or title
  // (handles cases where procedureName wasn't populated or cache is stale).
  const matchesProcedure = (item: GalleryItem, procedures: string[]): boolean => {
    // Direct match on procedureName
    if (item.procedureName && procedures.includes(item.procedureName)) return true;
    // Fallback: derive a name from the slug (e.g. "BREAST_AUGMENTATION_Patient01" → "Breast Augmentation")
    if (item.slug) {
      const prefix = item.slug.replace(/_Patient\d+$/, '');
      const derived = getProcedureNameFromPrefix(prefix);
      if (procedures.includes(derived)) return true;
    }
    // Fallback: check title (e.g. "Breast Augmentation — Patient 1")
    if (item.title) {
      for (const proc of procedures) {
        if (item.title.toLowerCase().includes(proc.toLowerCase())) return true;
      }
    }
    return false;
  };

  // Special-case view: "Body / Liposuction" should ALSO surface the submental
  // (neck) liposuction cases that live under the Face category. The reverse
  // (Face / Liposuction including body lipo) is NOT desired.
  const isBodyLipoView =
    selectedCategory === 'Body' && selectedProcedures.includes('Liposuction');

  const filteredItems = galleryItems
    .filter(item => {
      // Always exclude orphan KV stubs (no slug AND no images)
      if (!item.slug && !item.beforeImage && !item.afterImage) return false;
      // Procedure filter
      if (selectedProcedures.length > 0 && !matchesProcedure(item, selectedProcedures)) return false;
      // Category filter — strict, except: Body/Liposuction also includes
      // Face-categorized Liposuction cases (submental/neck lipo).
      if (selectedCategory !== 'All') {
        const matchesCategory = item.category === selectedCategory;
        const isNeckLipoInBodyView =
          isBodyLipoView &&
          item.category === 'Face' &&
          matchesProcedure(item, ['Liposuction']);
        if (!matchesCategory && !isNeckLipoInBodyView) return false;
      }
      // Admins in edit mode can see real items even without images
      if (isAdmin && isEditMode) return true;
      // Public users only see items with images
      return item.beforeImage || item.afterImage;
    })
    .sort((a, b) => {
      // When showing All, group by category first
      if (selectedCategory === 'All') {
        const catA = CATEGORY_ORDER[a.category] ?? 99;
        const catB = CATEGORY_ORDER[b.category] ?? 99;
        if (catA !== catB) return catA - catB;
      }
      // Body/Liposuction special view: body-categorized cases come first, then
      // the appended neck-lipo (Face) cases — so the renumber sequence below
      // reads cleanly top-to-bottom on the page.
      if (isBodyLipoView && a.category !== b.category) {
        if (a.category === 'Body') return -1;
        if (b.category === 'Body') return 1;
      }
      // Admin-defined sortOrder wins when present on either item
      const aHas = typeof a.sortOrder === 'number';
      const bHas = typeof b.sortOrder === 'number';
      if (aHas && bHas) {
        if (a.sortOrder! !== b.sortOrder!) return a.sortOrder! - b.sortOrder!;
      } else if (aHas) {
        return -1;
      } else if (bHas) {
        return 1;
      }
      // Fallback: alphabetical by title
      return (a.title || '').localeCompare(b.title || '');
    });

  // Display-only patient numbering: within any specific (non-"All") view the
  // visible "Patient NN" label reflects the card's ON-SCREEN POSITION, not the
  // number baked into its filename/slug. So when an admin drags a case to a
  // new spot, its number updates to match where it now appears (e.g. drag
  // Mastopexy Patient 7 to slot 10 → it reads "Patient 10"). The underlying
  // slug / ID / files are never changed.
  //
  // On the "All" view we leave numbers as-is (slug-derived), since a single
  // sequential count across mixed categories would be meaningless.
  //
  // This also subsumes the old Body/Liposuction special case: in that view
  // body cases sort first and the appended neck-lipo cases follow, so
  // position-based numbering naturally continues the sequence.
  const displayPatientNumberOverrides: Record<number, string> = {};
  const shouldRenumberByPosition =
    selectedCategory !== 'All' || selectedProcedures.length > 0;
  if (shouldRenumberByPosition) {
    filteredItems.forEach((item, index) => {
      displayPatientNumberOverrides[item.id] = String(index + 1).padStart(2, '0');
    });
  }

  // Ordered list of procedures available within the current category selection
  const availableProcedures = useMemo(() => {
    const baseItems = selectedCategory === 'All'
      ? galleryItems
      : galleryItems.filter(i => i.category === selectedCategory);
    const withImages = baseItems.filter(i =>
      (isAdmin && isEditMode) || i.beforeImage || i.afterImage
    );
    const names = new Set(withImages.map(i => i.procedureName).filter(Boolean) as string[]);
    // Use custom order if a single category is selected; fall back to alphabetical for "All"
    const order = PROCEDURE_ORDER[selectedCategory];
    if (order) {
      // Return procedures in the defined order, then append any extras alphabetically
      const ordered = order.filter(p => names.has(p));
      const extras = Array.from(names).filter(p => !order.includes(p)).sort((a, b) => a.localeCompare(b));
      return [...ordered, ...extras];
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [galleryItems, selectedCategory, isAdmin, isEditMode]);

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

  // Gallery cards always show the first before photo — no auto-cycling.
  // (BeforeAfterCard on Home/ProcedurePages retains its own animation.)

  const handleOpenLightbox = (index: number) => {
    setCurrentLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Admin drag-and-drop: reorder the currently filtered cards and persist sortOrder.
  // Visible items are reassigned sortOrder = 0..n-1; hidden items keep their existing order.
  const handleReorderDrop = async (targetId: number) => {
    if (!isAdmin || !isEditMode) return;
    const dragId = draggedId;
    setDraggedId(null);
    setDragOverId(null);
    if (!dragId || dragId === targetId) return;

    const visibleIds = filteredItems.map(i => i.id);
    const fromIdx = visibleIds.indexOf(dragId);
    const toIdx = visibleIds.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newOrder = [...visibleIds];
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragId);

    // Snapshot for rollback on failure
    const previousItems = galleryItems;

    // Optimistic local update
    const indexMap = new Map<number, number>(newOrder.map((id, idx) => [id, idx]));
    const updatedItems = galleryItems.map(item =>
      indexMap.has(item.id) ? { ...item, sortOrder: indexMap.get(item.id)! } : item
    );
    setGalleryItems(updatedItems);

    setReordering(true);
    try {
      const response = await fetch(`${serverUrl}/gallery/cases/reorder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: newOrder }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[Gallery] Reorder failed:', response.status, errText);
        setGalleryItems(previousItems);
        alert(
          `Could not save the new order (server returned ${response.status}).\n\n` +
          `The most common cause is that the reorder endpoint hasn't been deployed yet. ` +
          `Ask your developer to run "supabase functions deploy server".`
        );
        return;
      }

      // Persist optimistic state to localStorage so it survives a reload while
      // the cache is still considered fresh.
      try {
        localStorage.setItem('gallery_items_cache', JSON.stringify(updatedItems));
        localStorage.setItem('gallery_items_cache_timestamp', Date.now().toString());
      } catch (cacheErr) {
        console.warn('[Gallery] Could not update cache after reorder:', cacheErr);
      }
    } catch (err) {
      console.error('[Gallery] Reorder error:', err);
      setGalleryItems(previousItems);
      alert(`Could not save the new order: ${err}`);
    } finally {
      setReordering(false);
    }
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

  // Remove a single view (orientation) from a case. Confirms with the user,
  // calls the server, then optimistically removes the view from local state
  // so the lightbox / card update without a full refetch.
  const handleRemoveOrientation = async (caseId: number, orientationIndex: number) => {
    const targetCase = galleryItems.find(i => i.id === caseId);
    if (!targetCase) return;
    const viewName = targetCase.orientations?.[orientationIndex]?.name || `View ${orientationIndex + 1}`;

    if (!confirm(
      `Remove ${viewName} from "${targetCase.title || targetCase.slug}"?\n\n` +
      `This deletes the Before AND After photos for that view. ` +
      `The other views on this case will remain. This can't be undone.`
    )) return;

    try {
      const response = await fetch(
        `${serverUrl}/gallery/case/${caseId}/orientation/${orientationIndex}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Server returned ${response.status}`);
      }
      const data = await response.json();

      // Optimistically update local state with the server's new orientations.
      setGalleryItems(prev => prev.map(item => {
        if (item.id !== caseId) return item;
        const nextOrientations = (data.orientations || []).map((o: any) => ({
          ...o,
          beforeImage: normalizeImageUrl(o.beforeImage),
          afterImage: normalizeImageUrl(o.afterImage),
        }));
        const next = { ...item, orientations: nextOrientations };
        if (orientationIndex === 0) {
          next.beforeImage = nextOrientations[0]?.beforeImage || undefined;
          next.afterImage = nextOrientations[0]?.afterImage || undefined;
        }
        return next;
      }));

      // Bust the cache so a hard reload also picks up the new shape.
      try {
        localStorage.removeItem('gallery_items_cache');
        localStorage.removeItem('gallery_items_cache_timestamp');
      } catch { /* non-fatal */ }
    } catch (err: any) {
      console.error('[Gallery Remove View] Error:', err);
      alert(`Could not remove view: ${err?.message || err}`);
    }
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
    // Snapshot for rollback if the server rejects the delete
    const previousItems = galleryItems;

    // Optimistic removal from local state AND cache.
    // Updating localStorage here prevents the cached array from "resurrecting"
    // the deleted card if the user reloads before fresh data is fetched.
    const remainingItems = galleryItems.filter(item => item.id !== id);
    setGalleryItems(remainingItems);
    try {
      localStorage.setItem('gallery_items_cache', JSON.stringify(remainingItems));
      localStorage.setItem('gallery_items_cache_timestamp', Date.now().toString());
    } catch (cacheErr) {
      console.warn('[Gallery Delete] Could not update cache:', cacheErr);
    }

    try {
      const response = await fetch(`${serverUrl}/gallery/case/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();

      if (data.success) {
        // Server-side tombstone now prevents auto-sync from recreating this
        // case on the next reload, so no need to re-fetch / re-trigger sync.
        return;
      }

      // Server reported failure — roll the UI back
      setGalleryItems(previousItems);
      localStorage.setItem('gallery_items_cache', JSON.stringify(previousItems));
      alert(`Failed to delete case: ${data.error || data.message || 'Unknown error'}`);
    } catch (error) {
      setGalleryItems(previousItems);
      localStorage.setItem('gallery_items_cache', JSON.stringify(previousItems));
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
        title="Photo Gallery | Real Patient Transformations"
        description="View real before and after photos of plastic surgery results by Dr. Hanemann. Browse transformations across rhinoplasty, facelifts, breast augmentation, body contouring, and more."
        keywords="before after photos, plastic surgery results, rhinoplasty before after, facelift results, breast augmentation photos, liposuction results, Dr. Hanemann gallery"
        canonical="/gallery"
      />
      {/* Page Hero */}


      {/* Gallery Filters */}
      <section className="pt-48 pb-16 bg-[#1a1f2e] border-b border-[#2d3548]">
        <div className="container mx-auto px-6">
          {/* Back to Gallery Landing */}
          <button
            onClick={() => routeNavigate('/gallery')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#c9b896] transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Gallery
          </button>
          {/* Admin toolbar — staff-safe buttons only.
              Destructive/developer buttons (Clear All Cases, Rebuild All,
              Sync from GitHub, Force Refresh Cache, Debug Database,
              Debug Displayed, Diagnose Filenames, Fix Case ID, Test Image
              Load, Clean Orphans) were intentionally removed for the staff
              handoff. The handler functions still exist in this file and
              can be re-wired to a developer-only panel if needed. */}
          {isAdmin && isEditMode && (
            <div className="flex flex-wrap gap-2 mb-6">
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
                variant="outline"
                size="sm"
                onClick={() => setBulkUploaderOpen(true)}
                className="rounded-full border-[#c9b896] text-[#c9b896] hover:bg-[#c9b896] hover:text-[#1a1f2e]"
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
            </div>
          )}
          
          {/* Category Tabs — plain buttons + inline styles to survive Tailwind purge in Vite build */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '4px',
            backgroundColor: 'rgba(36,41,56,0.5)',
            padding: '4px',
            borderRadius: '9999px',
            maxWidth: '42rem',
            margin: '0 auto',
            border: '1px solid #2d3548',
          }}>
            {categories.map((category, index) => {
              const isActive = selectedCategory === category;
              return (
                <motion.button
                  key={category}
                  onClick={() => { setSelectedCategory(category); setSelectedProcedures([]); }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  style={{
                    borderRadius: '9999px',
                    padding: '6px 16px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: isActive ? '#c9b896' : 'transparent',
                    color: isActive ? '#1a1f2e' : '#d1d5db',
                    boxShadow: isActive ? '0 2px 8px rgba(201,184,150,0.3)' : 'none',
                  }}
                >
                  {category}
                </motion.button>
              );
            })}
          </div>

          {/* ── Procedure Filter Pills ── single-select, wrapping, inline styles to survive Tailwind purge */}
          {availableProcedures.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', padding: '4px 8px' }}>
                {/* "All" clear pill — active when nothing is selected */}
                <button
                  onClick={() => setSelectedProcedures([])}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    border: selectedProcedures.length === 0 ? '1px solid #b8976a' : '1px solid #2d3548',
                    backgroundColor: selectedProcedures.length === 0 ? '#b8976a' : 'transparent',
                    color: selectedProcedures.length === 0 ? '#1a1f2e' : '#9ca3af',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  All Procedures
                </button>

                {/* One toggleable pill per procedure */}
                {availableProcedures.map(proc => {
                  const isSelected = selectedProcedures.includes(proc);
                  return (
                    <button
                      key={proc}
                      onClick={() => {
                        setSelectedProcedures(prev =>
                          prev.includes(proc)
                            ? []                               // deselect → show all
                            : [proc]                           // single-select only
                        );
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '9999px',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        border: isSelected ? '1px solid #b8976a' : '1px solid #2d3548',
                        backgroundColor: isSelected ? '#b8976a' : 'transparent',
                        color: isSelected ? '#1a1f2e' : '#9ca3af',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getProcedureDisplayLabel(proc)}
                    </button>
                  );
                })}
              </div>
              {/* Active filter summary */}
              {selectedProcedures.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button
                    onClick={() => setSelectedProcedures([])}
                    style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>
          )}
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
                className={`relative ${
                  isAdmin && isEditMode
                    ? `transition-opacity ${draggedId === item.id ? 'opacity-40' : ''} ${
                        dragOverId === item.id && draggedId !== null && draggedId !== item.id
                          ? 'ring-2 ring-[#c9b896] ring-offset-2 ring-offset-[#1a1f2e] rounded-2xl'
                          : ''
                      }`
                    : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={isAdmin && isEditMode ? undefined : { y: -8 }}
                draggable={isAdmin && isEditMode}
                onDragStart={(e) => {
                  if (!isAdmin || !isEditMode) return;
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(item.id));
                  setDraggedId(item.id);
                }}
                onDragOver={(e) => {
                  if (!isAdmin || !isEditMode || draggedId === null) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverId !== item.id) setDragOverId(item.id);
                }}
                onDragLeave={() => {
                  if (dragOverId === item.id) setDragOverId(null);
                }}
                onDrop={(e) => {
                  if (!isAdmin || !isEditMode) return;
                  e.preventDefault();
                  handleReorderDrop(item.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverId(null);
                }}
              >
                {/* Admin toolbar — drag handle + edit buttons in a single wrapping row */}
                {isAdmin && isEditMode && (
                  <div className="absolute top-2 left-2 right-2 z-50 flex flex-wrap items-start gap-2">
                    {/* Card-level Before/After buttons edit View 1 only. To
                        replace photos on Views 2/3 (or any view), open the
                        card → use the per-view Replace buttons in the
                        lightbox. The labels say "View 1" explicitly so admins
                        don't think these buttons cover every view. */}
                    <Button
                      size="sm"
                      className="rounded-full bg-secondary hover:bg-secondary/90 text-white shadow-2xl border-2 border-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditor(item.id, 'before');
                      }}
                      title="Replace the View 1 'Before' photo. For other views, open the card and use the per-view Replace buttons."
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Before · V1
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full bg-secondary hover:bg-secondary/90 text-white shadow-2xl border-2 border-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditor(item.id, 'after');
                      }}
                      title="Replace the View 1 'After' photo. For other views, open the card and use the per-view Replace buttons."
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      After · V1
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
                    {/* Drag handle — sits on the right end of the toolbar so it
                        flows with the other pills instead of overlapping them */}
                    <div
                      className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1a1f2e]/90 border-2 border-[#c9b896] text-[#c9b896] text-[10px] uppercase tracking-wider cursor-move select-none shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-3 h-3" />
                      Drag
                    </div>
                  </div>
                )}

                <Card
                  className="border-[#2d3548] bg-[#242938]/50 backdrop-blur rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#c9b896]/10 transition-all duration-500 cursor-pointer group"
                  onClick={() => handleOpenLightbox(index)}
                >
                  {/* All orientation views stacked vertically */}
                  {item.beforeImage || item.afterImage ? (() => {
                    // Build array of all orientations to display
                    const orientations = item.orientations && item.orientations.length > 0
                      ? item.orientations
                      : [{ name: '', beforeImage: item.beforeImage, afterImage: item.afterImage }];

                    // Helper function to optimize Supabase URLs
                    const getOptimizedUrl = (url: string) => {
                      if (!url) return url;
                      if (url.includes('supabase.co/storage/v1/object/public/')) {
                        return `${url}?width=800&quality=80&format=webp`;
                      }
                      return url;
                    };

                    const isPriority = index < 6;

                    // Fixed aspect ratio for uniform card sizing (3:4 portrait per half = ~1.5 wide)
                    const FIXED_ASPECT = 1.5;

                    return (
                      <div className="w-full">
                        {/* Single Before / After header above all views */}
                        <div className="flex bg-[#1a1f2e] border-b border-[#2d3548]">
                          <div className="w-1/2 flex justify-center py-2">
                            <div className="bg-card/90 backdrop-blur-sm px-3 py-0.5 rounded-full border border-secondary/20">
                              <span className="text-[10px] text-secondary font-medium">Before</span>
                            </div>
                          </div>
                          <div className="w-px bg-secondary/10 flex-shrink-0" />
                          <div className="w-1/2 flex justify-center py-2">
                            <div className="bg-card/90 backdrop-blur-sm px-3 py-0.5 rounded-full border border-secondary/20">
                              <span className="text-[10px] text-secondary font-medium">After</span>
                            </div>
                          </div>
                        </div>
                        {orientations.map((orientation, oIdx) => {
                          const beforeUrl = orientation.beforeImage || item.beforeImage;
                          const afterUrl = orientation.afterImage || item.afterImage;
                          return (
                            <div key={oIdx}>
                              {/* Orientation label (if multiple views) — and the
                                  Remove View button in admin edit mode, so a
                                  single bad view can be deleted without
                                  opening the lightbox. Only available when
                                  more than one view exists. */}
                              {orientations.length > 1 && orientation.name && (
                                <div className="bg-[#1a1f2e] py-1 border-b border-[#2d3548] flex items-center justify-center gap-3 relative">
                                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">{orientation.name}</span>
                                  {isAdmin && isEditMode && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveOrientation(item.id, oIdx);
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/40 hover:bg-red-900/80 border border-red-700/60 text-red-200 hover:text-white text-[9px] uppercase tracking-wider font-semibold transition-colors"
                                      title={`Remove ${orientation.name || `View ${oIdx + 1}`} entirely from this case`}
                                    >
                                      🗑️ Remove
                                    </button>
                                  )}
                                </div>
                              )}
                              {/* Before / After side by side — fixed aspect ratio for uniform sizing */}
                              <div className="w-full bg-[#1a1f2e] relative overflow-hidden" style={{ aspectRatio: FIXED_ASPECT }}>
                                {/* Gold accent corner (first orientation only) */}
                                {oIdx === 0 && (
                                  <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden rounded-tr-2xl z-10">
                                    <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-secondary/30 to-transparent"></div>
                                    <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-secondary/30 to-transparent"></div>
                                  </div>
                                )}
                                <div className="w-full h-full flex">
                                  {/* Before — left half */}
                                  <div className="w-1/2 relative overflow-hidden flex items-center justify-center bg-[#1a1f2e]">
                                    {beforeUrl ? (
                                      <img
                                        src={getOptimizedUrl(beforeUrl)}
                                        alt={`Before${orientation.name ? ` — ${orientation.name}` : ''}`}
                                        loading={isPriority && oIdx === 0 ? 'eager' : 'lazy'}
                                        fetchpriority={isPriority && oIdx === 0 ? 'high' : 'auto'}
                                        className="w-full h-full object-contain object-center"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <span className="text-xs text-muted-foreground">No image</span>
                                    )}
                                    {/* Per-view Replace button (admin edit mode).
                                        Opens the editor with this orientation's index so the
                                        upload writes to the correct view slot. */}
                                    {isAdmin && isEditMode && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditor(item.id, 'before', oIdx);
                                        }}
                                        className="absolute top-1.5 left-1.5 z-20 px-2 py-1 rounded-full bg-[#1a1f2e]/90 border border-[#c9b896] text-[#c9b896] text-[10px] font-semibold uppercase tracking-wider shadow-lg hover:bg-[#c9b896] hover:text-[#1a1f2e] transition-colors"
                                        title={`Replace the Before photo for View ${oIdx + 1}`}
                                      >
                                        <Edit2 className="w-2.5 h-2.5 inline-block mr-0.5" />
                                        Before · V{oIdx + 1}
                                      </button>
                                    )}
                                  </div>
                                  {/* Vertical divider */}
                                  <div className="w-px bg-secondary/20 flex-shrink-0 z-10" />
                                  {/* After — right half */}
                                  <div className="w-1/2 relative overflow-hidden flex items-center justify-center bg-[#1a1f2e]">
                                    {afterUrl ? (
                                      <img
                                        src={getOptimizedUrl(afterUrl)}
                                        alt={`After${orientation.name ? ` — ${orientation.name}` : ''}`}
                                        loading={isPriority && oIdx === 0 ? 'eager' : 'lazy'}
                                        fetchpriority={isPriority && oIdx === 0 ? 'high' : 'auto'}
                                        className="w-full h-full object-contain object-center"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <span className="text-xs text-muted-foreground">No image</span>
                                    )}
                                    {isAdmin && isEditMode && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditor(item.id, 'after', oIdx);
                                        }}
                                        className="absolute top-1.5 right-1.5 z-20 px-2 py-1 rounded-full bg-[#1a1f2e]/90 border border-[#c9b896] text-[#c9b896] text-[10px] font-semibold uppercase tracking-wider shadow-lg hover:bg-[#c9b896] hover:text-[#1a1f2e] transition-colors"
                                        title={`Replace the After photo for View ${oIdx + 1}`}
                                      >
                                        <Edit2 className="w-2.5 h-2.5 inline-block mr-0.5" />
                                        After · V{oIdx + 1}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                              </div>
                              {/* Thin separator between orientation views */}
                              {oIdx < orientations.length - 1 && (
                                <div className="h-px bg-[#2d3548]" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })() : (
                    <div className="w-full bg-[#1a1f2e] flex items-center justify-center" style={{ aspectRatio: 0.75 }}>
                      <span className="text-muted-foreground">{item.title}</span>
                    </div>
                  )}
                  <div className="p-4 bg-card relative">
                    {/* Patient label — "Procedure Name — Patient NN" */}
                    {(() => {
                      const label = getCaseDisplayLabel(
                        item.procedureName,
                        item.slug,
                        item.title,
                        displayPatientNumberOverrides[item.id]
                      );
                      return label ? (
                        <h3 className="font-serif text-base text-[#b8976a] font-semibold mb-1 leading-tight">{label}</h3>
                      ) : null;
                    })()}
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
              <p className="text-muted-foreground">
                {selectedProcedures.length > 0
                  ? `No results found for the selected procedure${selectedProcedures.length > 1 ? 's' : ''}.`
                  : 'No results found for this category.'}
              </p>
              {selectedProcedures.length > 0 && (
                <button
                  onClick={() => setSelectedProcedures([])}
                  className="mt-3 text-sm text-[#b8976a] hover:text-[#c9b896] underline underline-offset-2 transition-colors"
                >
                  Show all procedures →
                </button>
              )}
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
        currentItem={(() => {
          const raw = filteredItems[currentLightboxIndex];
          if (!raw) return raw;
          // Apply the same display-number override used on the cards so the
          // lightbox heading stays in sync (Body/Lipo view renumbers neck-lipo
          // cases to continue the sequence).
          const override = displayPatientNumberOverrides[raw.id];
          if (!override || !raw.title) return raw;
          const newTitle = raw.title.replace(/Patient\s+\d+/i, `Patient ${override}`);
          return { ...raw, title: newTitle };
        })()}
        currentIndex={currentLightboxIndex}
        totalImages={filteredItems.length}
        onNext={handleNextImage}
        onPrevious={handlePreviousImage}
        onRemoveOrientation={handleRemoveOrientation}
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
          orientationIndex={editingItem.orientationIndex ?? 0}
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
                      <p className="text-red-400 font-bold mb-2">❌ Files NOT matching <code className="bg-black/30 px-1 rounded">{'PROC_Patient01_Before1.jpg'}</code>:</p>
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