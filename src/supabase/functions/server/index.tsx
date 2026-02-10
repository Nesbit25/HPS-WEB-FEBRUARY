import * as kv from './kv_store.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Hono } from 'npm:hono@4.6.14';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { generateFormPDF } from './pdf-generator.tsx';

const app = new Hono();

// ===== IN-MEMORY CACHE TO REDUCE DATABASE CALLS =====
interface CacheEntry {
  value: any;
  timestamp: number;
}

const contentCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Cached KV get wrapper
async function getCachedContent(key: string): Promise<any> {
  // Check cache first
  const cached = contentCache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[CACHE HIT] Returning cached content for key: ${key}`);
    return cached.value;
  }
  
  console.log(`[CACHE MISS] Fetching from database for key: ${key}`);
  const value = await kv.get(key);
  
  // Store in cache
  contentCache.set(key, {
    value,
    timestamp: Date.now()
  });
  
  return value;
}

// Clear cache entry
function clearCacheEntry(key: string) {
  contentCache.delete(key);
  console.log(`[CACHE] Cleared cache for key: ${key}`);
}

// Clear all gallery cache entries
function clearGalleryCache() {
  let cleared = 0;
  for (const [key] of contentCache.entries()) {
    if (key.startsWith('gallery_')) {
      contentCache.delete(key);
      cleared++;
    }
  }
  console.log(`[CACHE] Cleared ${cleared} gallery cache entries`);
}

// Periodic cache cleanup (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  let cleared = 0;
  for (const [key, entry] of contentCache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL_MS) {
      contentCache.delete(key);
      cleared++;
    }
  }
  if (cleared > 0) {
    console.log(`[CACHE] Cleaned up ${cleared} expired entries`);
  }
}, 10 * 60 * 1000);
// ===== END CACHE =====

// Retry utility for handling connection resets
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 100
): Promise<T> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorMessage = error?.message || String(error);
      
      // Only retry on connection errors (including DNS failures)
      if (errorMessage.includes('connection reset') || 
          errorMessage.includes('connection error') ||
          errorMessage.includes('ECONNRESET') ||
          errorMessage.includes('dns error') ||
          errorMessage.includes('lookup') ||
          errorMessage.includes('name resolution') ||
          errorMessage.includes('temporary failure')) {
        console.log(`[RETRY] Attempt ${i + 1}/${maxRetries} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
        continue;
      }
      
      // Don't retry other types of errors
      throw error;
    }
  }
  
  throw lastError;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Initialize test user on startup
const initTestUser = async () => {
  try {
    console.log('Checking for test user...');
    
    // Try to create the test user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@hanemannplasticsurgery.com',
      password: 'Password',
      user_metadata: { 
        name: 'Test',
        role: 'admin',
        username: 'Test'
      },
      email_confirm: true
    });

    if (error) {
      // User might already exist
      if (error.message.includes('already registered')) {
        console.log('Test user already exists - Username: Test, Password: Password');
      } else {
        console.log('Error creating test user:', error.message);
      }
    } else {
      console.log('Test user created successfully - Username: Test, Password: Password');
      console.log('User ID:', data?.user?.id);
    }
  } catch (error) {
    console.log('Error initializing test user:', error);
  }
};

// Run initialization in background (don't block server startup)
initTestUser().catch(err => console.log('Init error:', err));

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-fc862019/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ROUTES ====================

// Sign up route for creating admin users
app.post("/make-server-fc862019/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'admin' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log('Signup exception:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// ==================== INQUIRY ROUTES ====================

// Submit contact inquiry
app.post("/make-server-fc862019/inquiries", async (c) => {
  try {
    const inquiry = await c.req.json();
    const timestamp = new Date().toISOString();
    const inquiryId = `inquiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await kv.set(inquiryId, {
      ...inquiry,
      id: inquiryId,
      timestamp,
      status: 'new'
    });

    return c.json({ success: true, id: inquiryId });
  } catch (error) {
    console.log('Error saving inquiry:', error);
    return c.json({ error: 'Failed to save inquiry' }, 500);
  }
});

// ==================== PATIENT FORMS ROUTES ====================

// Submit patient form
app.post("/make-server-fc862019/patient-forms", async (c) => {
  try {
    const formData = await c.req.json();
    const timestamp = new Date().toISOString();
    
    // Extract patient name from form data
    let patientName = 'Unknown Patient';
    if (formData.firstName && formData.lastName) {
      patientName = `${formData.lastName}, ${formData.firstName}`;
    } else if (formData.patientName) {
      patientName = formData.patientName;
    }
    
    // Create a normalized patient key for grouping
    const normalizedName = patientName.toLowerCase().replace(/[^a-z]/g, '');
    const formId = `patientform_${normalizedName}_${formData.formType}_${Date.now()}`;
    
    const completeFormData = {
      ...formData,
      id: formId,
      patientName,
      normalizedName,
      timestamp,
      status: 'new'
    };
    
    // Generate PDF for record keeping
    let pdfUrl = null;
    try {
      const pdfHtml = generateFormPDF(completeFormData);
      const pdfFileName = `${formId}.html`;
      
      // Store PDF as HTML in storage bucket (can be printed to PDF by browser)
      const bucketName = 'make-fc862019-patient-forms';
      
      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 10485760 // 10MB
        });
      }
      
      // Upload PDF HTML
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(pdfFileName, new Blob([pdfHtml], { type: 'text/html' }), {
          contentType: 'text/html',
          upsert: true
        });
      
      if (!uploadError && uploadData) {
        // Generate signed URL valid for 1 year
        const { data: signedUrlData } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(pdfFileName, 31536000); // 1 year
        
        pdfUrl = signedUrlData?.signedUrl || null;
      }
    } catch (pdfError) {
      console.log('Error generating PDF:', pdfError);
      // Continue even if PDF generation fails
    }
    
    // Save form data with PDF URL
    await kv.set(formId, {
      ...completeFormData,
      pdfUrl
    });

    return c.json({ success: true, id: formId, pdfUrl });
  } catch (error) {
    console.log('Error saving patient form:', error);
    return c.json({ error: 'Failed to save patient form' }, 500);
  }
});

// Get all patient forms (protected)
app.get("/make-server-fc862019/patient-forms", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formsData = await kv.getByPrefix('patientform_');
    
    // Extract values from the KV store result (getByPrefix returns [{key, value}])
    const forms = formsData.map((item: any) => item.value);
    
    // Group forms by patient name
    const patientGroups: Record<string, any> = {};
    
    forms.forEach((form: any) => {
      const name = form.patientName || 'Unknown Patient';
      if (!patientGroups[name]) {
        patientGroups[name] = {
          patientName: name,
          forms: [],
          lastSubmission: form.timestamp
        };
      }
      patientGroups[name].forms.push(form);
      
      // Update last submission if this one is newer
      if (new Date(form.timestamp) > new Date(patientGroups[name].lastSubmission)) {
        patientGroups[name].lastSubmission = form.timestamp;
      }
    });
    
    // Convert to array and sort by last submission
    const groupedForms = Object.values(patientGroups).sort((a: any, b: any) => 
      new Date(b.lastSubmission).getTime() - new Date(a.lastSubmission).getTime()
    );
    
    return c.json({ 
      forms: forms.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
      groupedByPatient: groupedForms
    });
  } catch (error) {
    console.log('Error fetching patient forms:', error);
    return c.json({ error: 'Failed to fetch patient forms' }, 500);
  }
});

// Get patient forms by patient name (protected)
app.get("/make-server-fc862019/patient-forms/patient/:name", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const patientName = decodeURIComponent(c.req.param('name'));
    const allFormsData = await kv.getByPrefix('patientform_');
    
    // Extract values from the KV store result
    const allForms = allFormsData.map((item: any) => item.value);
    
    const patientForms = allForms.filter((form: any) => 
      form.patientName === patientName
    ).sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return c.json({ forms: patientForms });
  } catch (error) {
    console.log('Error fetching patient forms:', error);
    return c.json({ error: 'Failed to fetch patient forms' }, 500);
  }
});

// Update patient form status (protected)
app.put("/make-server-fc862019/patient-forms/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const { status, notes } = await c.req.json();
    
    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ error: 'Form not found' }, 404);
    }

    await kv.set(id, { ...existing, status, notes });
    return c.json({ success: true });
  } catch (error) {
    console.log('Error updating patient form:', error);
    return c.json({ error: 'Failed to update patient form' }, 500);
  }
});

// Get patient form PDF (protected - admin or patient owner)
app.get("/make-server-fc862019/patient-forms/:id/pdf", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const form = await kv.get(id);
    
    if (!form) {
      return c.json({ error: 'Form not found' }, 404);
    }
    
    // Check authorization: either admin or the patient who submitted
    const isAdmin = user.user_metadata?.userType !== 'patient';
    const isPatientOwner = form.userId && form.userId === user.id;
    
    if (!isAdmin && !isPatientOwner) {
      return c.json({ error: 'Unauthorized to view this form' }, 403);
    }
    
    if (!form.pdfUrl) {
      // Generate PDF on the fly if it doesn't exist
      const pdfHtml = generateFormPDF(form);
      return new Response(pdfHtml, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="${form.id}.html"`
        }
      });
    }
    
    // Fetch the HTML from storage and return it
    const pdfResponse = await fetch(form.pdfUrl);
    const pdfHtml = await pdfResponse.text();
    
    return new Response(pdfHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename=\"${form.id}.html\"`
      }
    });
  } catch (error) {
    console.log('Error fetching form PDF:', error);
    return c.json({ error: 'Failed to fetch PDF' }, 500);
  }
});

// Get all inquiries (protected)
app.get("/make-server-fc862019/inquiries", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const inquiries = await kv.getByPrefix('inquiry_');
    return c.json({ inquiries: inquiries.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ) });
  } catch (error) {
    console.log('Error fetching inquiries:', error);
    return c.json({ error: 'Failed to fetch inquiries' }, 500);
  }
});

// Update inquiry status (protected)
app.put("/make-server-fc862019/inquiries/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const { status, notes } = await c.req.json();
    
    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ error: 'Inquiry not found' }, 404);
    }

    await kv.set(id, { ...existing, status, notes });
    return c.json({ success: true });
  } catch (error) {
    console.log('Error updating inquiry:', error);
    return c.json({ error: 'Failed to update inquiry' }, 500);
  }
});

// ==================== SCHEDULE ROUTES ====================

// Get schedule events (protected)
app.get("/make-server-fc862019/schedule", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const events = await kv.getByPrefix('event_');
    return c.json({ events });
  } catch (error) {
    console.log('Error fetching schedule:', error);
    return c.json({ error: 'Failed to fetch schedule' }, 500);
  }
});

// Create schedule event (protected)
app.post("/make-server-fc862019/schedule", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const event = await c.req.json();
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await kv.set(eventId, { ...event, id: eventId });
    return c.json({ success: true, id: eventId });
  } catch (error) {
    console.log('Error creating event:', error);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

// Delete schedule event (protected)
app.delete("/make-server-fc862019/schedule/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    await kv.del(id);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting event:', error);
    return c.json({ error: 'Failed to delete event' }, 500);
  }
});

// ==================== ANALYTICS ROUTES ====================

// Get analytics (protected)
app.get("/make-server-fc862019/analytics", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const inquiries = await kv.getByPrefix('inquiry_');
    const pageViews = await kv.get('page_views') || {};
    
    // Calculate analytics
    const totalInquiries = inquiries.length;
    const newInquiries = inquiries.filter((i: any) => i.status === 'new').length;
    const contactedInquiries = inquiries.filter((i: any) => i.status === 'contacted').length;
    
    // Get inquiries by procedure
    const inquiriesByProcedure: Record<string, number> = {};
    inquiries.forEach((inq: any) => {
      const proc = inq.interestedIn || 'General Inquiry';
      inquiriesByProcedure[proc] = (inquiriesByProcedure[proc] || 0) + 1;
    });

    return c.json({
      totalInquiries,
      newInquiries,
      contactedInquiries,
      inquiriesByProcedure,
      pageViews
    });
  } catch (error) {
    console.log('Error fetching analytics:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// Track page view
app.post("/make-server-fc862019/analytics/pageview", async (c) => {
  try {
    const { page } = await c.req.json();
    const pageViews = await kv.get('page_views') || {};
    
    pageViews[page] = (pageViews[page] || 0) + 1;
    await kv.set('page_views', pageViews);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error tracking page view:', error);
    return c.json({ error: 'Failed to track page view' }, 500);
  }
});

// ==================== PHOTO UPLOAD ROUTES ====================

// Initialize storage bucket
const bucketName = 'make-fc862019-gallery';

// Create bucket on startup
const initBucket = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });
      console.log('Created storage bucket:', bucketName);
    }
  } catch (error) {
    console.log('Error initializing bucket:', error);
  }
};

initBucket();

// Debug endpoint to list all gallery keys
app.get("/make-server-fc862019/gallery/debug", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all keys that start with "gallery_"
    const galleryKeys = await kv.getByPrefix('gallery_');
    
    return c.json({ 
      keys: galleryKeys.map(item => ({
        key: item.key,
        value: item.value
      }))
    });
  } catch (error) {
    console.log('[Gallery Debug] Error:', error);
    return c.json({ error: 'Failed to fetch gallery keys' }, 500);
  }
});

// Wipe all gallery data (protected) - removes all cases and images
app.delete("/make-server-fc862019/gallery/wipe-all", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      console.log('[Gallery Wipe] Authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Gallery Wipe] Starting gallery wipe...');
    
    // Get all gallery-related keys
    const allGalleryKeys = await kv.getByPrefix('gallery_');
    
    console.log(`[Gallery Wipe] Found ${allGalleryKeys.length} gallery keys to delete`);
    
    // Delete all keys
    const deletePromises = allGalleryKeys.map(item => kv.del(item.key));
    await Promise.all(deletePromises);
    
    console.log('[Gallery Wipe] Successfully deleted all gallery data');
    
    return c.json({ 
      success: true, 
      message: `Wiped ${allGalleryKeys.length} gallery items`,
      deletedKeys: allGalleryKeys.map(item => item.key)
    });
  } catch (error) {
    console.log('[Gallery Wipe] Error:', error);
    return c.json({ error: 'Failed to wipe gallery data' }, 500);
  }
});

// Upload gallery image (protected) - uses service role to bypass RLS
app.post("/make-server-fc862019/gallery/upload", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      console.log('[Gallery Upload] Authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { fileName, fileData, galleryItemId, imageType } = body;
    
    if (!fileName || !fileData) {
      console.log('[Gallery Upload] Missing required fields');
      return c.json({ error: 'Missing fileName or fileData' }, 400);
    }
    
    console.log(`[Gallery Upload] Uploading ${imageType} image for gallery item ${galleryItemId}`);
    
    // Decode base64
    const fileBuffer = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
    
    // Upload to storage using service role (bypasses RLS)
    const filePath = `gallery/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.log('[Gallery Upload] Upload error:', uploadError);
      return c.json({ error: uploadError.message }, 400);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('[Gallery Upload] Success:', publicUrl);

    return c.json({ success: true, publicUrl });
  } catch (error) {
    console.log('[Gallery Upload] Error:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// Upload image directly to GitHub (protected)
app.post("/make-server-fc862019/gallery/upload-to-github", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      console.log('[GitHub Upload] Authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { caseSlug, position, imageType, fileData, fileExtension } = body;
    
    if (!caseSlug || !position || !imageType || !fileData) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // GitHub configuration - read token from environment
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
    if (!GITHUB_TOKEN) {
      console.error('[GitHub Upload] No GITHUB_TOKEN found in environment');
      return c.json({ error: 'GitHub token not configured' }, 500);
    }
    
    const GITHUB_OWNER = 'Nesbit25';
    const GITHUB_REPO = 'HPS-WEB-FEBRUARY';
    const GITHUB_BRANCH = 'main';
    
    // Calculate image index from position and type
    // Position 1: before=img1, after=img2
    // Position 2: before=img3, after=img4
    // Position 3: before=img5, after=img6
    const imageIndex = (position * 2) - (imageType === 'before' ? 1 : 0);
    
    // Generate filename: {case_slug}_p1_img{index}.{ext}
    const filename = `${caseSlug}_p1_img${imageIndex}.${fileExtension || 'png'}`;
    const githubPath = `gallery/${filename}`;
    
    console.log(`[GitHub Upload] Uploading ${filename} to GitHub...`);
    
    // Retry logic for SHA conflicts (409 errors)
    let uploadSuccess = false;
    let retryCount = 0;
    const maxRetries = 3;
    let result = null;
    
    while (!uploadSuccess && retryCount < maxRetries) {
      try {
        // Check if file exists (to determine if we need to update or create)
        const checkUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`;
        const checkResponse = await fetch(checkUrl, {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        let sha = null;
        if (checkResponse.ok) {
          const existingFile = await checkResponse.json();
          sha = existingFile.sha;
          console.log(`[GitHub Upload] File exists, will update (SHA: ${sha})`);
        }
        
        // Upload to GitHub
        const uploadUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`;
        const uploadPayload = {
          message: `Upload ${imageType} image for ${caseSlug} position ${position}`,
          content: fileData, // Already base64
          branch: GITHUB_BRANCH,
          ...(sha && { sha }) // Include SHA if updating existing file
        };
        
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(uploadPayload)
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          
          // If we get a 409 conflict (SHA mismatch), retry with fresh SHA
          if (uploadResponse.status === 409 && retryCount < maxRetries - 1) {
            retryCount++;
            console.log(`[GitHub Upload] SHA conflict detected, retrying (attempt ${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 200 * retryCount)); // Exponential backoff
            continue; // Retry the loop
          }
          
          console.error('[GitHub Upload] Error:', errorData);
          throw new Error(`GitHub API error: ${uploadResponse.status} - ${errorData.message}`);
        }
        
        result = await uploadResponse.json();
        uploadSuccess = true;
        
      } catch (loopError) {
        if (retryCount >= maxRetries - 1) {
          throw loopError; // Re-throw if we've exhausted retries
        }
        retryCount++;
        console.log(`[GitHub Upload] Error on attempt ${retryCount}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
      }
    }
    
    const publicUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${githubPath}`;
    
    console.log(`[GitHub Upload] Successfully uploaded to GitHub: ${publicUrl}`);
    
    return c.json({ 
      success: true, 
      publicUrl,
      filename,
      path: githubPath
    });
  } catch (error) {
    console.error('[GitHub Upload] Error:', error);
    return c.json({ error: `Failed to upload to GitHub: ${error.message}` }, 500);
  }
});

// Create gallery folder in GitHub (protected)
app.post("/make-server-fc862019/gallery/create-folder", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      console.log('[Create Folder] Authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // GitHub configuration - read token from environment
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
    if (!GITHUB_TOKEN) {
      console.error('[Create Folder] No GITHUB_TOKEN found in environment');
      return c.json({ error: 'GitHub token not configured' }, 500);
    }
    
    const GITHUB_OWNER = 'Nesbit25';
    const GITHUB_REPO = 'HPS-WEB-FEBRUARY';
    const GITHUB_BRANCH = 'main';
    
    console.log('[Create Folder] Creating gallery folder in GitHub...');
    
    // Create .gitkeep file to initialize the gallery folder
    const githubPath = 'gallery/.gitkeep';
    const uploadUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`;
    
    // Check if file already exists
    const checkResponse = await fetch(uploadUrl, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (checkResponse.ok) {
      console.log('[Create Folder] Gallery folder already exists');
      return c.json({ success: true, message: 'Gallery folder already exists' });
    }
    
    // Create the .gitkeep file
    const uploadPayload = {
      message: 'Initialize gallery folder',
      content: '', // Empty file
      branch: GITHUB_BRANCH
    };
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(uploadPayload)
    });
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error('[Create Folder] Error:', errorData);
      throw new Error(`GitHub API error: ${uploadResponse.status} - ${errorData.message}`);
    }
    
    console.log('[Create Folder] Successfully created gallery folder');
    
    return c.json({ 
      success: true, 
      message: 'Gallery folder created successfully'
    });
  } catch (error) {
    console.error('[Create Folder] Error:', error);
    return c.json({ error: `Failed to create gallery folder: ${error.message}` }, 500);
  }
});

// Create new gallery case (protected)
app.post("/make-server-fc862019/gallery/create", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      console.log('[Gallery Create] Authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { category, title, procedure, journeyNote, slug } = body;
    
    if (!category || !title) {
      return c.json({ error: 'Missing required fields (category and title are required)' }, 400);
    }

    // Get the next available ID (start custom cases at 1000 to avoid conflicts with base cases)
    const existingCases = await kv.getByPrefix('gallery_case_');
    const maxId = existingCases.reduce((max, item) => {
      const match = item.key.match(/gallery_case_(\d+)$/);
      if (match) {
        const id = parseInt(match[1]);
        return id > max ? id : max;
      }
      return max;
    }, 999); // Start at 999 so first case gets ID 1000
    
    const newId = maxId + 1;
    
    // Generate slug if not provided
    const caseSlug = slug || `pt_${newId}_${category.toLowerCase()}`;
    
    // Save case metadata (procedure and journeyNote are now optional)
    await kv.set(`gallery_case_${newId}`, {
      id: newId,
      slug: caseSlug,
      category,
      title,
      procedure: procedure || category, // Default to category if not provided
      journeyNote: journeyNote || '', // Allow empty journey notes
      orientations: [], // Will be populated with image sets (e.g., ['front', 'side', 'angle'])
      createdBy: user.id,
      createdAt: new Date().toISOString()
    });

    console.log(`[Gallery Create] Created new case with ID: ${newId}, slug: ${caseSlug}`);

    return c.json({ success: true, id: newId, slug: caseSlug });
  } catch (error) {
    console.log('[Gallery Create] Error:', error);
    return c.json({ error: 'Failed to create gallery case' }, 500);
  }
});

// Sync cases from GitHub (protected) - scans GitHub folder and creates missing case records
app.post("/make-server-fc862019/gallery/sync-from-github", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      console.log('[Sync GitHub] Authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Sync GitHub] Starting sync from GitHub...');

    // GitHub configuration - read token from environment
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
    if (!GITHUB_TOKEN) {
      console.error('[Sync GitHub] No GITHUB_TOKEN found in environment');
      return c.json({ error: 'GitHub token not configured' }, 500);
    }
    
    const GITHUB_OWNER = 'Nesbit25';
    const GITHUB_REPO = 'HPS-WEB-FEBRUARY';
    const GITHUB_FOLDER = 'gallery';

    // Fetch files from GitHub
    const githubApiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`;
    console.log('[Sync GitHub] Fetching from:', githubApiUrl);
    
    const response = await fetch(githubApiUrl, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    console.log('[Sync GitHub] GitHub response status:', response.status);

    if (response.status === 404) {
      console.log('[Sync GitHub] ⚠️  Gallery folder does not exist in GitHub yet');
      return c.json({
        success: false,
        error: 'Gallery folder not found in GitHub. Please upload images using the bulk uploader first.',
        casesFound: 0,
        casesCreated: 0,
        casesSkipped: 0,
        createdCases: []
      }, 404);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Sync GitHub] GitHub API error:', response.status, errorText);
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
    }

    const files = await response.json();
    
    // Filter image files
    const imageFiles = files.filter(file => 
      file.type === 'file' && 
      (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg'))
    );

    console.log(`[Sync GitHub] Found ${imageFiles.length} image files`);

    // Extract unique case slugs from filenames
    // Expected format: {case_slug}_p{page}_img{index}.{ext}
    const filenameRegex = /^(.*)_p(\d+)_img(\d+)\.(png|jpg|jpeg)$/;
    const caseSlugs = new Set();
    const caseOrientations = new Map(); // Track how many images per case

    imageFiles.forEach(file => {
      const match = file.name.match(filenameRegex);
      if (match) {
        const caseSlug = match[1];
        caseSlugs.add(caseSlug);
        
        // Count images per case
        const count = caseOrientations.get(caseSlug) || 0;
        caseOrientations.set(caseSlug, count + 1);
      }
    });

    console.log(`[Sync GitHub] Found ${caseSlugs.size} unique cases:`, Array.from(caseSlugs));

    // Get existing cases from database
    const existingCases = await kv.getByPrefix('gallery_case_');
    const existingSlugs = new Set(existingCases.map(item => item.value.slug));

    console.log(`[Sync GitHub] Existing cases in database:`, Array.from(existingSlugs));

    // Get next available ID
    const maxId = existingCases.reduce((max, item) => {
      const match = item.key.match(/gallery_case_(\d+)$/);
      if (match) {
        const id = parseInt(match[1]);
        return id > max ? id : max;
      }
      return max;
    }, 999);

    let nextId = maxId + 1;
    const createdCases = [];
    let casesCreated = 0;
    let casesSkipped = 0;

    // Create missing cases
    const failedCases = [];
    for (const caseSlug of caseSlugs) {
      if (existingSlugs.has(caseSlug)) {
        console.log(`[Sync GitHub] Case already exists, skipping: ${caseSlug}`);
        casesSkipped++;
        continue;
      }

      try {
        // Extract category from slug (assumes format: pt_XXXX_category or similar)
        const parts = caseSlug.split('_');
        const category = parts.length > 2 ? parts.slice(2).join('_') : parts[parts.length - 1];
        const title = `Patient ${parts[1] || 'Case'}`;

        // Calculate number of orientations (2 images per orientation)
        const imageCount = caseOrientations.get(caseSlug) || 0;
        const orientationCount = Math.floor(imageCount / 2);
        const orientations = [];
        for (let i = 1; i <= orientationCount; i++) {
          orientations.push(`Position ${i}`);
        }

        const caseData = {
          id: nextId,
          slug: caseSlug,
          category: category.charAt(0).toUpperCase() + category.slice(1),
          title,
          procedure: category.charAt(0).toUpperCase() + category.slice(1),
          journeyNote: '',
          orientations,
          createdBy: user.id,
          createdAt: new Date().toISOString(),
          syncedFromGitHub: true
        };

        // Create case with error handling
        console.log(`[Sync GitHub] Writing case ${caseSlug} with ID ${nextId}...`);
        await kv.set(`gallery_case_${nextId}`, caseData);
        
        // Verify it was written
        const verification = await kv.get(`gallery_case_${nextId}`);
        if (!verification) {
          console.error(`[Sync GitHub] ⚠️  WARNING: Case ${caseSlug} was not persisted!`);
          failedCases.push({ slug: caseSlug, reason: 'Not persisted after write' });
        } else {
          console.log(`[Sync GitHub] ✓ Created case: ${caseSlug} with ID ${nextId}, orientations: ${orientations.join(', ')}`);
          createdCases.push(caseSlug);
          casesCreated++;
        }
        
        nextId++;
      } catch (caseError) {
        console.error(`[Sync GitHub] ❌ Failed to create case ${caseSlug}:`, caseError);
        failedCases.push({ slug: caseSlug, reason: caseError.message });
      }
    }

    console.log(`[Sync GitHub] Sync complete. Created: ${casesCreated}, Skipped: ${casesSkipped}, Failed: ${failedCases.length}`);
    if (failedCases.length > 0) {
      console.error('[Sync GitHub] Failed cases:', failedCases);
    }

    // Clear server-side cache so new cases appear immediately
    clearGalleryCache();

    return c.json({
      success: true,
      casesFound: caseSlugs.size,
      casesCreated,
      casesSkipped,
      casesFailed: failedCases.length,
      createdCases,
      failedCases
    });
  } catch (error) {
    console.error('[Sync GitHub] Error:', error);
    return c.json({ error: `Failed to sync from GitHub: ${error.message}` }, 500);
  }
});

// Get GitHub gallery files (with authentication) - UNPROTECTED so gallery can load without login
app.get("/make-server-fc862019/gallery/github-files", async (c) => {
  try {
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
    if (!GITHUB_TOKEN) {
      console.error('[GitHub Files] No GITHUB_TOKEN found in environment');
      return c.json({ error: 'GitHub token not configured', files: [] }, 500);
    }
    
    const GITHUB_OWNER = 'Nesbit25';
    const GITHUB_REPO = 'HPS-WEB-FEBRUARY';
    const GITHUB_FOLDER = 'gallery';

    const githubApiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`;
    
    console.log('[GitHub Files] Fetching:', githubApiUrl);
    
    const response = await fetch(githubApiUrl, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    console.log('[GitHub Files] Response status:', response.status);
    
    if (response.status === 404) {
      console.log('[GitHub Files] Folder not found');
      return c.json({ files: [], exists: false }, 404);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GitHub Files] Error:', response.status, errorText);
      return c.json({ error: `GitHub API error: ${response.status}`, files: [] }, response.status);
    }

    const files = await response.json();
    console.log('[GitHub Files] Found', files.length, 'files');
    
    // Add cache headers for better performance (5 min cache)
    c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    
    // Return the raw file list - let client filter/process
    return c.json({ 
      files, 
      exists: true,
      count: files.length 
    });

  } catch (error) {
    console.error('[GitHub Files] Error:', error);
    return c.json({ error: error.message, files: [] }, 500);
  }
});

// Check GitHub folder status (for debugging) - UNPROTECTED for easier debugging
app.get("/make-server-fc862019/gallery/check-github", async (c) => {
  try {
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
    if (!GITHUB_TOKEN) {
      console.error('[Check GitHub] No GITHUB_TOKEN found in environment');
      return c.json({ error: 'GitHub token not configured' }, 500);
    }
    
    const GITHUB_OWNER = 'Nesbit25';
    const GITHUB_REPO = 'HPS-WEB-FEBRUARY';
    const GITHUB_FOLDER = 'gallery';

    const githubApiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`;
    
    console.log('[Check GitHub] Checking:', githubApiUrl);
    
    const response = await fetch(githubApiUrl, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const status = response.status;
    
    if (response.status === 404) {
      return c.json({
        exists: false,
        status: 404,
        message: 'Gallery folder does not exist in GitHub',
        url: githubApiUrl,
        suggestion: 'Upload images using the Bulk Gallery Uploader first'
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({
        exists: false,
        status,
        error: errorText,
        url: githubApiUrl
      });
    }

    const files = await response.json();
    const imageFiles = files.filter(f => 
      f.type === 'file' && (f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.jpeg'))
    );

    return c.json({
      exists: true,
      status: 200,
      totalFiles: files.length,
      imageFiles: imageFiles.length,
      fileNames: imageFiles.slice(0, 10).map(f => f.name),
      message: imageFiles.length > 0 
        ? `Found ${imageFiles.length} images in GitHub` 
        : 'Folder exists but contains no images',
      url: githubApiUrl
    });

  } catch (error) {
    console.error('[Check GitHub] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Add orientation to gallery case (protected)
app.post("/make-server-fc862019/gallery/case/:id/orientation", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      console.log('[Gallery Add Orientation] Authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    const { orientationName, beforeImage, afterImage } = body;
    
    if (!orientationName) {
      return c.json({ error: 'Missing orientation name' }, 400);
    }

    // Get existing case
    const caseData = await kv.get(`gallery_case_${id}`);
    if (!caseData) {
      console.log(`[Gallery Add Orientation] Case not found: gallery_case_${id}`);
      return c.json({ error: 'Case not found' }, 404);
    }

    console.log(`[Gallery Add Orientation] Found case:`, caseData);
    
    // Initialize orientations array if it doesn't exist
    const orientations = caseData.orientations || [];
    
    // Find existing orientation or create new one
    let orientation = orientations.find(o => o.name === orientationName);
    
    if (!orientation) {
      // Create new orientation
      orientation = {
        name: orientationName,
        beforeImage: beforeImage || null,
        afterImage: afterImage || null
      };
      orientations.push(orientation);
      console.log(`[Gallery Add Orientation] Created new orientation '${orientationName}' for case ${id}`);
    } else {
      // Update existing orientation with new images
      if (beforeImage) orientation.beforeImage = beforeImage;
      if (afterImage) orientation.afterImage = afterImage;
      console.log(`[Gallery Add Orientation] Updated orientation '${orientationName}' for case ${id}`);
    }
    
    // Update case with orientations and set primary before/after from first orientation
    const updatedCase = {
      ...caseData,
      orientations
    };
    
    // Set primary before/after images from first orientation
    if (orientations.length > 0 && orientations[0]) {
      updatedCase.beforeImage = orientations[0].beforeImage || null;
      updatedCase.afterImage = orientations[0].afterImage || null;
    }
    
    await kv.set(`gallery_case_${id}`, updatedCase);
    
    console.log(`[Gallery Add Orientation] Case ${id} updated with orientations:`, orientations);

    return c.json({ success: true, orientations });
  } catch (error) {
    console.log('[Gallery Add Orientation] Error:', error);
    return c.json({ error: 'Failed to add orientation' }, 500);
  }
});

// Clear all gallery cases (protected)
app.delete("/make-server-fc862019/gallery/cases/all", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      console.log('[Gallery Clear All] Authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Gallery Clear All] Starting to clear all cases...');

    // Get all gallery cases
    const allCases = await kv.getByPrefix('gallery_case_');
    console.log(`[Gallery Clear All] Found ${allCases.length} cases to delete`);

    // Delete all case metadata
    const caseKeys = allCases.map(c => c.key);
    if (caseKeys.length > 0) {
      await kv.mdel(caseKeys);
      console.log(`[Gallery Clear All] Deleted ${caseKeys.length} case metadata entries`);
    }

    // Delete all gallery images (before/after and all orientations)
    const allImages = await kv.getByPrefix('gallery_');
    const imageKeys = allImages
      .filter(item => !item.key.startsWith('gallery_case_')) // Don't re-delete case metadata
      .map(item => item.key);
    
    if (imageKeys.length > 0) {
      await kv.mdel(imageKeys);
      console.log(`[Gallery Clear All] Deleted ${imageKeys.length} image entries`);
    }

    console.log('[Gallery Clear All] Successfully cleared all gallery data');

    return c.json({ 
      success: true, 
      deletedCases: caseKeys.length,
      deletedImages: imageKeys.length
    });
  } catch (error) {
    console.log('[Gallery Clear All] Error:', error);
    return c.json({ error: 'Failed to clear gallery cases' }, 500);
  }
});

// List all gallery cases (public)
app.get("/make-server-fc862019/gallery/cases", async (c) => {
  try {
    const cases = await kv.getByPrefix('gallery_case_');
    
    const formattedCases = cases.map(item => ({
      ...item.value,
      key: item.key
    }));

    // Add cache headers for better performance
    c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    
    return c.json({ cases: formattedCases });
  } catch (error) {
    console.log('[Gallery Cases] Error:', error);
    return c.json({ error: 'Failed to fetch gallery cases' }, 500);
  }
});

// Delete gallery case (protected)
app.delete("/make-server-fc862019/gallery/case/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      console.log('[Gallery Delete] Authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    
    console.log(`[Gallery Delete] Starting deletion of case ${id}...`);
    
    // Get case metadata to find all orientation images
    const caseData = await kv.get(`gallery_case_${id}`);
    
    // Delete case metadata
    await kv.del(`gallery_case_${id}`);
    console.log(`[Gallery Delete] Deleted case metadata: gallery_case_${id}`);
    
    // Delete base images (position 1)
    await kv.del(`gallery_${id}_before`);
    await kv.del(`gallery_${id}_after`);
    console.log(`[Gallery Delete] Deleted base images`);
    
    // Delete all orientation images if they exist
    if (caseData && caseData.orientations && Array.isArray(caseData.orientations)) {
      console.log(`[Gallery Delete] Deleting ${caseData.orientations.length} orientations...`);
      for (const orientationName of caseData.orientations) {
        await kv.del(`gallery_${id}_${orientationName}_before`);
        await kv.del(`gallery_${id}_${orientationName}_after`);
        console.log(`[Gallery Delete] Deleted orientation "${orientationName}" images`);
      }
    }
    
    // Note: We're not deleting from Supabase Storage to keep the files
    // but they won't be linked anymore

    console.log(`[Gallery Delete] Successfully deleted case ID: ${id}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('[Gallery Delete] Error:', error);
    return c.json({ error: 'Failed to delete gallery case' }, 500);
  }
});

// Toggle gallery case flags (protected)
app.patch("/make-server-fc862019/gallery/case/:id/toggle", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      console.log('[Gallery Toggle] Authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    const { flag, value } = body;
    
    console.log(`[Gallery Toggle] Request for case ${id}, flag: ${flag}, value: ${value}`);
    
    if (!flag || value === undefined) {
      return c.json({ error: 'Missing flag or value' }, 400);
    }

    // Get existing case
    const existingCase = await kv.get(`gallery_case_${id}`);
    
    console.log(`[Gallery Toggle] Existing case data:`, existingCase);
    
    if (!existingCase) {
      console.log(`[Gallery Toggle] Case not found in database: gallery_case_${id}`);
      
      // Debug: check what keys exist
      const allKeys = await kv.getByPrefix('gallery_case_');
      console.log('[Gallery Toggle] Available gallery cases:', allKeys);
      
      // Create a new entry for base gallery items (IDs 1-12)
      // This allows toggling flags on pre-existing cases
      console.log(`[Gallery Toggle] Creating new database entry for case ${id}`);
      const newCase = {
        id: parseInt(id),
        [flag]: value,
        // Don't include createdBy or createdAt for base cases
        // This distinguishes them from custom uploaded cases
      };
      
      await kv.set(`gallery_case_${id}`, newCase);
      
      console.log(`[Gallery Toggle] Created new case entry: ${flag} = ${value}`);
      return c.json({ success: true });
    }

    // Update the flag
    const updatedCase = {
      ...existingCase,
      [flag]: value
    };

    // Save back to KV
    await kv.set(`gallery_case_${id}`, updatedCase);

    console.log(`[Gallery Toggle] Updated case ${id}: ${flag} = ${value}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('[Gallery Toggle] Error:', error);
    return c.json({ error: `Failed to toggle flag: ${error.message}` }, 500);
  }
});

// Update gallery case category (protected)
app.patch("/make-server-fc862019/gallery/case/:id/category", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      console.log('[Gallery Update Category] Authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    const { category } = body;
    
    console.log(`[Gallery Update Category] Request for case ${id}, category: ${category}`);
    
    if (!category) {
      return c.json({ error: 'Missing category' }, 400);
    }

    // Validate category
    const validCategories = ['Nose', 'Face', 'Breast', 'Body'];
    if (!validCategories.includes(category)) {
      return c.json({ error: 'Invalid category' }, 400);
    }

    // Get existing case
    const existingCase = await kv.get(`gallery_case_${id}`);
    
    if (!existingCase) {
      console.log(`[Gallery Update Category] Case not found: gallery_case_${id}`);
      return c.json({ error: 'Case not found' }, 404);
    }

    // Update the category
    const updatedCase = {
      ...existingCase,
      category
    };

    // Save back to KV
    await kv.set(`gallery_case_${id}`, updatedCase);

    console.log(`[Gallery Update Category] Updated case ${id}: category = ${category}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('[Gallery Update Category] Error:', error);
    return c.json({ error: `Failed to update category: ${error.message}` }, 500);
  }
});

// Fix mismatched gallery case IDs (protected) - migrate images from wrong ID to correct ID
app.post("/make-server-fc862019/gallery/fix-case-id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { correctCaseId, wrongCaseId } = await c.req.json();
    
    if (!correctCaseId || !wrongCaseId) {
      return c.json({ error: 'Missing correctCaseId or wrongCaseId' }, 400);
    }

    console.log(`[Fix Case ID] Migrating images from ${wrongCaseId} to ${correctCaseId}`);
    
    // Get all keys that start with gallery_{wrongCaseId}_
    const allKeys = await kv.getByPrefix(`gallery_${wrongCaseId}_`);
    const migratedKeys = [];
    
    for (const item of allKeys) {
      const oldKey = item.key;
      const newKey = oldKey.replace(`gallery_${wrongCaseId}_`, `gallery_${correctCaseId}_`);
      
      console.log(`[Fix Case ID] Migrating ${oldKey} -> ${newKey}`);
      
      // Copy to new key
      await kv.set(newKey, item.value);
      
      // Delete old key
      await kv.del(oldKey);
      
      migratedKeys.push({ from: oldKey, to: newKey });
    }
    
    // Update the case metadata to include orientations
    const caseMetadata = await kv.get(`gallery_case_${correctCaseId}`);
    if (caseMetadata) {
      // Extract orientation numbers from the migrated keys
      const orientations = [];
      migratedKeys.forEach(({ to }) => {
        const match = to.match(/gallery_\d+_(\d+)_(before|after)/);
        if (match) {
          const orientationNum = match[1];
          if (!orientations.includes(orientationNum)) {
            orientations.push(orientationNum);
          }
        }
      });
      
      // Update case with orientations
      if (orientations.length > 0) {
        await kv.set(`gallery_case_${correctCaseId}`, {
          ...caseMetadata,
          orientations: orientations.sort((a, b) => parseInt(a) - parseInt(b))
        });
        console.log(`[Fix Case ID] Updated case ${correctCaseId} with orientations:`, orientations);
      }
    }
    
    return c.json({ 
      success: true, 
      migratedKeys,
      message: `Successfully migrated ${migratedKeys.length} keys from case ${wrongCaseId} to ${correctCaseId}`
    });
  } catch (error) {
    console.log('[Fix Case ID] Error:', error);
    return c.json({ error: `Failed to fix case ID: ${error.message}` }, 500);
  }
});

// Upload photo (protected)
app.post("/make-server-fc862019/photos/upload", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('Authorization error: No token provided');
      return c.json({ code: 401, message: 'No authorization token provided' }, 401);
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      console.log('Authorization error during upload:', error.message);
      return c.json({ code: 401, message: `Invalid JWT: ${error.message}` }, 401);
    }
    
    if (!user) {
      console.log('Authorization error: No user found');
      return c.json({ code: 401, message: 'Invalid JWT: User not found' }, 401);
    }

    const body = await c.req.json();
    console.log('Upload request received:', { 
      fileName: body.fileName, 
      category: body.category,
      hasFileData: !!body.fileData,
      fileDataLength: body.fileData?.length 
    });
    
    const { fileName, fileData, category, caption, displayLocation, title, status, featured } = body;
    
    if (!fileName || !fileData) {
      console.log('Missing required fields:', { hasFileName: !!fileName, hasFileData: !!fileData });
      return c.json({ error: 'Missing fileName or fileData' }, 400);
    }
    
    // Upload to Supabase Storage
    const timestamp = Date.now();
    const filePath = `${category}/${timestamp}_${fileName}`;
    
    console.log('Attempting to upload to storage:', filePath);
    
    // Decode base64 if needed
    const fileBuffer = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.log('Upload error:', uploadError);
      return c.json({ error: uploadError.message }, 400);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Save metadata to KV
    const photoId = `photo_${timestamp}`;
    await kv.set(photoId, {
      id: photoId,
      fileName,
      filePath,
      publicUrl,
      category,
      caption,
      displayLocation: displayLocation || 'gallery',
      title: title || '',
      status: status || 'published',
      featured: featured !== undefined ? featured : false,
      uploadedBy: user.email,
      uploadedAt: new Date().toISOString()
    });

    return c.json({ success: true, photoId, publicUrl });
  } catch (error) {
    console.log('Error uploading photo:', error);
    return c.json({ error: 'Failed to upload photo' }, 500);
  }
});

// IMPORTANT: Public route must come BEFORE protected /photos route
// Get published photos (public - for image selection)
app.get("/make-server-fc862019/photos/published", async (c) => {
  try {
    console.log('===== PHOTOS/PUBLISHED ENDPOINT CALLED =====');
    const photoEntries = await kv.getByPrefix('photo_');
    console.log('Fetched photo entries from KV:', photoEntries.length);
    
    // Format entries properly with id from key
    const photos = photoEntries.map((entry: any) => ({
      id: entry.key, // The full key like "photo_123"
      ...entry.value // The actual photo data (publicUrl, title, category, etc.)
    }));
    
    console.log('Formatted photos:', photos.length);
    
    // Filter to only published photos
    const publishedPhotos = photos.filter((p: any) => p.status === 'published');
    
    console.log('Published photos:', publishedPhotos.length);
    
    const result = { 
      photos: publishedPhotos.sort((a: any, b: any) => 
        new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
      )
    };
    
    return c.json(result);
  } catch (error) {
    console.log('[Photos Published] Error fetching photos:', error);
    return c.json({ error: 'Failed to fetch photos', errorDetails: String(error) }, 500);
  }
});

// Get single photo by ID (public - no auth required)
app.get("/make-server-fc862019/photos/:id", async (c) => {
  try {
    const photoId = c.req.param('id');
    const photo = await kv.get(photoId);
    
    if (!photo) {
      console.log(`[GET photo/:id] Photo ${photoId} not found`);
      return c.json({ error: 'Photo not found' }, 404);
    }

    console.log(`[GET photo/:id] Returning photo ${photoId}:`, {
      id: photo.id,
      status: photo.status,
      displayLocation: photo.displayLocation,
      title: photo.title
    });

    return c.json({ photo });
  } catch (error) {
    console.log('Error fetching photo:', error);
    return c.json({ error: 'Failed to fetch photo' }, 500);
  }
});

// List photos (protected)
app.get("/make-server-fc862019/photos", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const photoEntries = await kv.getByPrefix('photo_');
    const photos = photoEntries.map((entry: any) => ({
      id: entry.key, // The full key like "photo_123"
      ...entry.value // The actual photo data
    }));
    
    return c.json({ photos: photos.sort((a: any, b: any) => 
      new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
    ) });
  } catch (error) {
    console.log('[Photos List] Error fetching photos:', error);
    return c.json({ error: 'Failed to fetch photos' }, 500);
  }
});

// Delete photo (protected)
app.delete("/make-server-fc862019/photos/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      console.log('[Photo Delete] Unauthorized:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const photoId = c.req.param('id');
    console.log(`[Photo Delete] Attempting to delete photo: ${photoId}`);
    
    const photo = await kv.get(photoId);
    console.log(`[Photo Delete] Photo found:`, photo ? 'Yes' : 'No', photo);
    
    if (photo) {
      // Delete from storage if filePath exists
      if (photo.filePath) {
        console.log(`[Photo Delete] Deleting from storage: ${photo.filePath}`);
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([photo.filePath]);
        
        if (storageError) {
          console.log(`[Photo Delete] Storage deletion error:`, storageError);
        } else {
          console.log(`[Photo Delete] Successfully deleted from storage`);
        }
      }
      
      // Delete from KV
      console.log(`[Photo Delete] Deleting from KV: ${photoId}`);
      await kv.del(photoId);
      console.log(`[Photo Delete] Successfully deleted from KV`);
      
      // Verify deletion
      const verify = await kv.get(photoId);
      console.log(`[Photo Delete] Verification - still exists?`, verify ? 'Yes (ERROR!)' : 'No (SUCCESS)');
    } else {
      console.log(`[Photo Delete] Photo not found in database: ${photoId}`);
      return c.json({ error: 'Photo not found' }, 404);
    }
    
    console.log(`[Photo Delete] Delete operation completed successfully`);
    return c.json({ success: true });
  } catch (error) {
    console.log('[Photo Delete] Error:', error);
    return c.json({ error: 'Failed to delete photo' }, 500);
  }
});

// Update photo metadata (protected)
app.put("/make-server-fc862019/photos/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const photoId = c.req.param('id');
    const { category, caption, displayLocation, title, status, featured } = await c.req.json();
    
    const photo = await kv.get(photoId);
    
    if (!photo) {
      return c.json({ error: 'Photo not found' }, 404);
    }

    // Update photo metadata
    await kv.set(photoId, {
      ...photo,
      category: category || photo.category,
      caption: caption !== undefined ? caption : photo.caption,
      displayLocation: displayLocation || photo.displayLocation,
      title: title !== undefined ? title : photo.title,
      status: status || photo.status,
      featured: featured !== undefined ? featured : photo.featured,
      updatedAt: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error) {
    console.log('Error updating photo:', error);
    return c.json({ error: 'Failed to update photo' }, 500);
  }
});

// ==================== CONTENT MANAGEMENT ROUTES ====================

// DIAGNOSTIC: Test public content access
app.get('/make-server-fc862019/content-test', async (c) => {
  console.log('[CONTENT TEST] === DIAGNOSTIC ENDPOINT CALLED ===');
  console.log('[CONTENT TEST] Headers:', Object.fromEntries(c.req.raw.headers));
  
  try {
    console.log('[CONTENT TEST] Attempting to call kv.get("test_key")...');
    const result = await kv.get('test_key');
    console.log('[CONTENT TEST] Success! Result:', result);
    
    return c.json({
      success: true,
      message: 'KV store is accessible',
      testResult: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CONTENT TEST] ERROR:', error);
    return c.json({
      success: false,
      error: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Get content by key (public endpoint - no auth required)
app.get('/make-server-fc862019/content/:key', async (c) => {
  const key = c.req.param('key');
  console.log(`[PUBLIC GET] === REQUEST FOR KEY: ${key} ===`);
  console.log('[PUBLIC GET] Headers:', Object.fromEntries(c.req.raw.headers));
  
  // Enhanced retry logic for connection resets
  const maxRetries = 5; // Increased from 3 to 5
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[PUBLIC GET] Attempt ${attempt}/${maxRetries} - Calling getCachedContent("${key}")...`);
      const content = await getCachedContent(key);
      console.log(`[PUBLIC GET] getCachedContent returned:`, content);
      
      if (!content) {
        console.log(`[PUBLIC GET] Content not found for key: ${key}`);
        return c.json({ content: null });
      }
      
      console.log(`[PUBLIC GET] Content found for key: ${key}`, {
        hasValue: !!content.value,
        valueType: typeof content.value,
        valuePreview: typeof content.value === 'string' ? content.value.substring(0, 100) : content.value,
        isURL: typeof content.value === 'string' && content.value.startsWith('http'),
        fullContent: content
      });
      
      return c.json({ content });
    } catch (error) {
      lastError = error;
      console.error(`[PUBLIC GET] Attempt ${attempt}/${maxRetries} failed for key: ${key}`);
      console.error('[PUBLIC GET] Error:', error?.message);
      console.error('[PUBLIC GET] Error type:', error?.name);
      console.error('[PUBLIC GET] Full error:', error);
      
      // Check if it's a connection-related error
      const errorMsg = (error?.message || String(error)).toLowerCase();
      const isConnectionError = 
        errorMsg.includes('connection') ||
        errorMsg.includes('reset') ||
        errorMsg.includes('econnreset') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('network') ||
        errorMsg.includes('fetch') ||
        errorMsg.includes('dns') ||
        errorMsg.includes('lookup') ||
        errorMsg.includes('name resolution') ||
        errorMsg.includes('temporary failure') ||
        error?.name === 'FetchError' ||
        error?.name === 'TypeError' && errorMsg.includes('fetch');
      
      // If this isn't the last attempt and it's a connection error, wait and retry
      if (attempt < maxRetries && isConnectionError) {
        // Exponential backoff with moderate delays: 1500ms, 3000ms, 6000ms, 12000ms, 24000ms (max 24s)
        const delayMs = Math.min(1500 * Math.pow(2, attempt - 1), 24000);
        console.log(`[PUBLIC GET] Connection error detected. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      // If it's not a connection error or we're out of retries, return error
      if (attempt === maxRetries) {
        console.error(`[PUBLIC GET] All ${maxRetries} attempts failed for key: ${key}`);
        console.error('[PUBLIC GET] Final error:', lastError?.stack);
        console.error('[PUBLIC GET] Returning null content to prevent UI breakage');
        
        // Return null content instead of 500 error to prevent UI breakage
        // The frontend should handle null content gracefully
        return c.json({ 
          content: null,
          error: 'Connection timeout - database temporarily unavailable',
          retryable: true,
          key: key
        }, 200); // Return 200 so frontend doesn't break
      }
      
      // If it's not a connection error, fail immediately
      if (!isConnectionError) {
        console.error(`[PUBLIC GET] Non-connection error, not retrying: ${error?.message}`);
        return c.json({ 
          error: 'Failed to fetch content', 
          details: lastError?.message || String(lastError),
          key: key
        }, 500);
      }
    }
  }
  
  // Fallback (should never reach here)
  return c.json({ 
    error: 'Failed to fetch content', 
    details: lastError?.message || 'Unknown error',
    key: key
  }, 500);
});

// Get content revision history (requires auth)
app.get('/make-server-fc862019/content/:key/history', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('[GET HISTORY] Unauthorized access attempt');
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const key = c.req.param('key');
    console.log(`[GET HISTORY] Fetching history for key: ${key}`);
    
    // Get all revisions for this key (stored with suffix _revision_timestamp)
    const allRevisions = await kv.getByPrefix(`${key}_revision_`);
    
    // Map revisions with their timestamps (now stored in the data)
    const revisions = allRevisions
      .filter(item => item._revisionTimestamp)
      .map(item => ({
        timestamp: item._revisionTimestamp,
        value: item.value,
        updatedBy: item.updatedBy,
        updatedAt: item.updatedAt,
        date: new Date(item._revisionTimestamp).toISOString()
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
    
    console.log(`[GET HISTORY] Found ${revisions.length} revisions for key: ${key}`);
    return c.json({ revisions });
  } catch (error) {
    console.error('[GET HISTORY] Error fetching history:', error);
    return c.json({ error: 'Failed to fetch history', details: error.message }, 500);
  }
});

// Update content by key (protected endpoint - requires auth)
app.put('/make-server-fc862019/content/:key', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('[PUT] Unauthorized access attempt:', authError?.message);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const key = c.req.param('key');
    const body = await c.req.json();
    
    console.log(`[PUT] Updating content for key: ${key} by user: ${user.id}`, body);
    
    // Get the current content first to save as a revision
    const currentContent = await kv.get(key);
    
    // If there's existing content, save it as a revision
    if (currentContent) {
      const timestamp = Date.now();
      const revisionKey = `${key}_revision_${timestamp}`;
      await kv.set(revisionKey, {
        ...currentContent,
        _revisionTimestamp: timestamp,
        _originalKey: key
      });
      console.log(`[PUT] Saved revision: ${revisionKey}`);
    }
    
    // Save the new content with all fields from body
    await kv.set(key, {
      ...body,  // Spread all fields from the request (value, photoId, etc.)
      updatedBy: user.id,
      updatedAt: new Date().toISOString()
    });
    
    // Clear cache entry to force fresh fetch on next GET
    clearCacheEntry(key);
    
    console.log(`[PUT] Content updated successfully for key: ${key}`);
    return c.json({ success: true, saved: true });
  } catch (error) {
    console.error('[PUT] Error updating content:', error);
    return c.json({ error: 'Failed to update content', details: error.message }, 500);
  }
});

// DEBUG: List all content keys (protected - requires auth)
app.get('/make-server-fc862019/content-debug/list', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get all content entries that look like image assignments
    const allContent = await kv.getByPrefix('home_');
    
    console.log('[DEBUG] Found content entries:', allContent.length);
    
    return c.json({ 
      content: allContent.map(item => ({
        key: item.key,
        value: item.value,
        isBad: item.value?.startsWith?.('http') || false
      }))
    });
  } catch (error) {
    console.error('[DEBUG] Error listing content:', error);
    return c.json({ error: 'Failed to list content' }, 500);
  }
});

// Clear corrupted image content (protected - requires auth)
app.post('/make-server-fc862019/content-debug/clear-images', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    console.log('[DIRECT DELETE] ===== STARTING CLEAR OPERATION =====');
    
    // DIRECT DELETE - manually delete the specific corrupted keys
    const corruptedKeys = [
      'home_hero_image_1',
      'home_hero_image_2',
      'home_hero_image_3',
      'home_hero_image_4',
      'home_hero_image_5'
    ];
    
    const deletedKeys = [];
    const details = [];
    
    for (const key of corruptedKeys) {
      console.log(`[DIRECT DELETE] --- Processing ${key} ---`);
      
      const existing = await kv.get(key);
      console.log(`[DIRECT DELETE] Get result for ${key}:`, JSON.stringify(existing));
      
      if (existing) {
        console.log(`[DIRECT DELETE] About to delete ${key}...`);
        await kv.del(key);
        console.log(`[DIRECT DELETE] Delete completed for ${key}`);
        
        // Verify deletion
        const verify = await kv.get(key);
        console.log(`[DIRECT DELETE] Verify after delete for ${key}:`, JSON.stringify(verify));
        
        deletedKeys.push(key);
        details.push({
          key,
          hadContent: true,
          deletedSuccessfully: verify === null,
          originalValue: existing
        });
      } else {
        console.log(`[DIRECT DELETE] Key ${key} already empty or doesn't exist`);
        details.push({
          key,
          hadContent: false,
          deletedSuccessfully: true,
          originalValue: null
        });
      }
    }
    
    console.log(`[DIRECT DELETE] ===== CLEAR OPERATION COMPLETE =====`);
    console.log(`[DIRECT DELETE] Deleted ${deletedKeys.length} entries:`, deletedKeys);
    
    return c.json({ 
      success: true, 
      deleted: deletedKeys,
      details: details,
      message: `Forcefully cleared ${deletedKeys.length} entries`
    });
  } catch (error) {
    console.error('[DIRECT DELETE] Error clearing content:', error);
    return c.json({ error: 'Failed to clear content', details: error.message }, 500);
  }
});

// HARD RESET - Nuclear option for hero images
app.post('/make-server-fc862019/content-debug/hard-reset-heroes', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    console.log('[HARD RESET] ===== NUCLEAR RESET INITIATED =====');
    
    const keys = [
      'home_hero_image_1',
      'home_hero_image_2', 
      'home_hero_image_3',
      'home_hero_image_4',
      'home_hero_image_5'
    ];
    
    const results = [];
    
    for (const key of keys) {
      console.log(`[HARD RESET] Processing ${key}...`);
      
      // Check before
      const before = await retryOperation(() => kv.get(key));
      console.log(`[HARD RESET] Before: ${key} =`, JSON.stringify(before));
      
      // Delete with retry
      await retryOperation(() => kv.del(key));
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check after
      const after = await retryOperation(() => kv.get(key));
      console.log(`[HARD RESET] After: ${key} =`, JSON.stringify(after));
      
      results.push({
        key,
        hadData: !!before,
        beforeValue: before,
        afterValue: after,
        success: after === null
      });
    }
    
    const allSuccessful = results.every(r => r.success);
    console.log(`[HARD RESET] ===== RESET COMPLETE: ${allSuccessful ? 'SUCCESS' : 'FAILED'} =====`);
    
    return c.json({
      success: allSuccessful,
      results,
      message: allSuccessful ? 'All hero images successfully reset' : 'Some deletions may have failed'
    });
  } catch (error) {
    console.error('[HARD RESET] Error:', error);
    return c.json({ error: 'Hard reset failed', details: error.message }, 500);
  }
});

// ==================== BLOG POST ROUTES ====================

// Get all blog posts (public - no auth required for reading published posts)
app.get("/make-server-fc862019/blog-posts", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    let isAdmin = false;
    
    // Check if user is admin
    if (accessToken) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      isAdmin = !!user && !error;
    }
    
    // Get all blog posts
    const allPosts = await kv.getByPrefix('blogpost_');
    
    // If not admin, only return published posts
    const posts = isAdmin 
      ? allPosts 
      : allPosts.filter((post: any) => post.status === 'published');
    
    // Sort by date (newest first)
    const sortedPosts = posts.sort((a: any, b: any) => 
      new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
    
    return c.json({ posts: sortedPosts });
  } catch (error) {
    console.log('Error fetching blog posts:', error);
    return c.json({ error: 'Failed to fetch blog posts' }, 500);
  }
});

// Get single blog post by slug (public)
app.get("/make-server-fc862019/blog-posts/:slug", async (c) => {
  try {
    const slug = c.req.param('slug');
    const post = await kv.get(`blogpost_${slug}`);
    
    if (!post) {
      return c.json({ error: 'Blog post not found' }, 404);
    }
    
    // Check if post is published or if user is admin
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    let isAdmin = false;
    
    if (accessToken) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      isAdmin = !!user && !error;
    }
    
    if (post.status !== 'published' && !isAdmin) {
      return c.json({ error: 'Blog post not found' }, 404);
    }
    
    return c.json({ post });
  } catch (error) {
    console.log('Error fetching blog post:', error);
    return c.json({ error: 'Failed to fetch blog post' }, 500);
  }
});

// Create blog post (protected)
app.post("/make-server-fc862019/blog-posts", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const postData = await c.req.json();
    const slug = postData.slug;
    
    if (!slug) {
      return c.json({ error: 'Slug is required' }, 400);
    }
    
    // Check if slug already exists
    const existing = await kv.get(`blogpost_${slug}`);
    if (existing) {
      return c.json({ error: 'A blog post with this slug already exists' }, 400);
    }
    
    const blogPost = {
      ...postData,
      slug,
      id: `blogpost_${slug}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`blogpost_${slug}`, blogPost);
    return c.json({ success: true, post: blogPost });
  } catch (error) {
    console.log('Error creating blog post:', error);
    return c.json({ error: 'Failed to create blog post' }, 500);
  }
});

// Update blog post (protected)
app.put("/make-server-fc862019/blog-posts/:slug", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const slug = c.req.param('slug');
    const postData = await c.req.json();
    
    const existing = await kv.get(`blogpost_${slug}`);
    if (!existing) {
      return c.json({ error: 'Blog post not found' }, 404);
    }
    
    const updatedPost = {
      ...existing,
      ...postData,
      slug, // Keep original slug
      id: `blogpost_${slug}`,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`blogpost_${slug}`, updatedPost);
    return c.json({ success: true, post: updatedPost });
  } catch (error) {
    console.log('Error updating blog post:', error);
    return c.json({ error: 'Failed to update blog post' }, 500);
  }
});

// Delete blog post (protected)
app.delete("/make-server-fc862019/blog-posts/:slug", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const slug = c.req.param('slug');
    await kv.del(`blogpost_${slug}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting blog post:', error);
    return c.json({ error: 'Failed to delete blog post' }, 500);
  }
});

// ==================== PDF RESOURCE ROUTES ====================

// Initialize PDF bucket
const pdfBucketName = 'make-fc862019-pdfs';

const initPDFBucket = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === pdfBucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(pdfBucketName, {
        public: false, // Private bucket - requires signed URLs
        fileSizeLimit: 10485760 // 10MB
      });
      console.log('Created PDF storage bucket:', pdfBucketName);
    }
  } catch (error) {
    console.log('Error initializing PDF bucket:', error);
  }
};

initPDFBucket();

// Get all PDF resources (public)
app.get("/make-server-fc862019/pdf-resources", async (c) => {
  try {
    const pdfs = await kv.getByPrefix('pdf_');
    
    // Generate fresh signed URLs for all PDFs
    const pdfsWithUrls = await Promise.all(pdfs.map(async (pdf: any) => {
      try {
        const { data, error } = await supabase.storage
          .from(pdfBucketName)
          .createSignedUrl(pdf.filePath, 3600); // 1 hour expiry
        
        if (!error && data) {
          return { ...pdf, fileUrl: data.signedUrl };
        }
      } catch (err) {
        console.log('Error generating signed URL:', err);
      }
      return pdf;
    }));
    
    // Sort by upload date (newest first)
    const sortedPDFs = pdfsWithUrls.sort((a: any, b: any) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    
    return c.json({ pdfs: sortedPDFs });
  } catch (error) {
    console.log('Error fetching PDFs:', error);
    return c.json({ error: 'Failed to fetch PDFs' }, 500);
  }
});

// Upload PDF (protected)
app.post("/make-server-fc862019/pdf-resources", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, description, category, fileName, fileData, fileSize } = await c.req.json();
    
    if (!title || !fileName || !fileData) {
      return c.json({ error: 'Title, fileName, and fileData are required' }, 400);
    }
    
    // Generate unique file path
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${timestamp}_${safeFileName}`;
    
    // Convert base64 to buffer
    const base64Data = fileData.split(',')[1]; // Remove data:application/pdf;base64, prefix
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(pdfBucketName)
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (uploadError) {
      console.log('Upload error:', uploadError);
      return c.json({ error: 'Failed to upload PDF' }, 500);
    }
    
    // Generate signed URL
    const { data: urlData, error: urlError } = await supabase.storage
      .from(pdfBucketName)
      .createSignedUrl(filePath, 3600);
    
    if (urlError) {
      console.log('URL generation error:', urlError);
    }
    
    // Store metadata in KV
    const pdfId = `pdf_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    const pdfResource = {
      id: pdfId,
      title,
      description: description || '',
      category,
      fileName,
      filePath,
      fileUrl: urlData?.signedUrl || '',
      fileSize: fileSize || '0 KB',
      uploadedAt: new Date().toISOString(),
      downloadCount: 0
    };
    
    await kv.set(pdfId, pdfResource);
    
    return c.json({ success: true, pdf: pdfResource });
  } catch (error) {
    console.log('Error uploading PDF:', error);
    return c.json({ error: 'Failed to upload PDF' }, 500);
  }
});

// Delete PDF (protected)
app.delete("/make-server-fc862019/pdf-resources/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const pdf = await kv.get(id);
    
    if (!pdf) {
      return c.json({ error: 'PDF not found' }, 404);
    }
    
    // Delete from storage
    try {
      await supabase.storage
        .from(pdfBucketName)
        .remove([pdf.filePath]);
    } catch (storageError) {
      console.log('Error deleting from storage:', storageError);
    }
    
    // Delete metadata
    await kv.del(id);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting PDF:', error);
    return c.json({ error: 'Failed to delete PDF' }, 500);
  }
});

// Track PDF download
app.post("/make-server-fc862019/pdf-resources/:id/download", async (c) => {
  try {
    const id = c.req.param('id');
    const pdf = await kv.get(id);
    
    if (pdf) {
      pdf.downloadCount = (pdf.downloadCount || 0) + 1;
      await kv.set(id, pdf);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error tracking download:', error);
    return c.json({ error: 'Failed to track download' }, 500);
  }
});

// ===== PATIENT PORTAL ENDPOINTS =====

// Patient signup
app.post("/make-server-fc862019/patient/signup", async (c) => {
  try {
    const { email, password, firstName, lastName, phone, dob } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: {
        firstName,
        lastName,
        phone,
        dob,
        userType: 'patient' // Distinguish from admin users
      }
    });

    if (error) {
      console.log('Patient signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, userId: data.user.id });
  } catch (error) {
    console.log('Error creating patient account:', error);
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

// Update patient profile
app.put("/make-server-fc862019/patient/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { user_metadata: { ...user.user_metadata, ...updates } }
    );

    if (updateError) {
      return c.json({ error: updateError.message }, 400);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('Error updating patient profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Get patient's own forms
app.get("/make-server-fc862019/patient/my-forms", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allFormsData = await kv.getByPrefix('patientform_');
    const allForms = allFormsData.map((item: any) => item.value);
    
    // Filter forms by user ID
    const myForms = allForms.filter((form: any) => form.userId === user.id);
    
    return c.json({ 
      forms: myForms.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    });
  } catch (error) {
    console.log('Error fetching patient forms:', error);
    return c.json({ error: 'Failed to fetch forms' }, 500);
  }
});

// ===== ANALYTICS ENDPOINTS =====

// Create analytics session
app.post("/make-server-fc862019/analytics/session", async (c) => {
  try {
    const sessionData = await c.req.json();
    const sessionId = `analytics_session_${sessionData.sessionId}`;
    
    await kv.set(sessionId, {
      ...sessionData,
      events: [],
      pageCount: 1
    });

    return c.json({ success: true });
  } catch (error) {
    console.log('Error creating analytics session:', error);
    return c.json({ error: 'Failed to create session' }, 500);
  }
});

// Update session with userId
app.put("/make-server-fc862019/analytics/session/:sessionId", async (c) => {
  try {
    const sessionId = `analytics_session_${c.req.param('sessionId')}`;
    const { userId } = await c.req.json();
    
    const session = await kv.get(sessionId);
    if (session) {
      session.userId = userId;
      session.lastActivity = new Date().toISOString();
      await kv.set(sessionId, session);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('Error updating session:', error);
    return c.json({ error: 'Failed to update session' }, 500);
  }
});

// Track analytics event
app.post("/make-server-fc862019/analytics/event", async (c) => {
  try {
    const event = await c.req.json();
    const sessionId = `analytics_session_${event.sessionId}`;
    
    // Get session and add event
    const session = await kv.get(sessionId);
    if (session) {
      session.events = session.events || [];
      session.events.push(event);
      session.lastActivity = event.timestamp;
      
      // Track unique pages
      if (event.eventType === 'pageview' && !session.pages.includes(event.page)) {
        session.pages.push(event.page);
        session.pageCount = session.pages.length;
      }
      
      await kv.set(sessionId, session);
    }

    // Also store event individually for easier querying
    const eventId = `analytics_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(eventId, event);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error tracking event:', error);
    return c.json({ error: 'Failed to track event' }, 500);
  }
});

// Get all analytics sessions (admin)
app.get("/make-server-fc862019/analytics/sessions", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionsData = await kv.getByPrefix('analytics_session_');
    const sessions = sessionsData.map((item: any) => item.value);
    
    // Sort by most recent
    sessions.sort((a: any, b: any) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    return c.json({ sessions });
  } catch (error) {
    console.log('Error fetching analytics sessions:', error);
    return c.json({ error: 'Failed to fetch sessions' }, 500);
  }
});

// Get analytics events (admin)
app.get("/make-server-fc862019/analytics/events", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const eventsData = await kv.getByPrefix('analytics_event_');
    const events = eventsData.map((item: any) => item.value);
    
    // Sort by most recent
    events.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return c.json({ events });
  } catch (error) {
    console.log('Error fetching analytics events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// Get analytics summary (admin)
app.get("/make-server-fc862019/analytics/summary", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionsData = await kv.getByPrefix('analytics_session_');
    const sessions = sessionsData.map((item: any) => item.value);
    
    const eventsData = await kv.getByPrefix('analytics_event_');
    const events = eventsData.map((item: any) => item.value);

    // Calculate summary stats
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeSessions = sessions.filter((s: any) => 
      new Date(s.lastActivity).getTime() > now.getTime() - 30 * 60 * 1000 // Active in last 30 min
    );

    const sessions24h = sessions.filter((s: any) => 
      new Date(s.startTime) > last24Hours
    );

    const sessions7d = sessions.filter((s: any) => 
      new Date(s.startTime) > last7Days
    );

    const pageviews24h = events.filter((e: any) => 
      e.eventType === 'pageview' && new Date(e.timestamp) > last24Hours
    );

    const formStarts = events.filter((e: any) => e.eventType === 'form_start');
    const formCompletions = events.filter((e: any) => e.eventType === 'form_complete');
    
    // Popular pages
    const pageViewsByPage: Record<string, number> = {};
    events.filter((e: any) => e.eventType === 'pageview').forEach((e: any) => {
      pageViewsByPage[e.page] = (pageViewsByPage[e.page] || 0) + 1;
    });
    
    const popularPages = Object.entries(pageViewsByPage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));

    // Traffic sources
    const trafficSources: Record<string, number> = {};
    sessions.forEach((s: any) => {
      const source = s.utmSource || s.referrer || 'direct';
      trafficSources[source] = (trafficSources[source] || 0) + 1;
    });

    return c.json({
      activeNow: activeSessions.length,
      sessions24h: sessions24h.length,
      sessions7d: sessions7d.length,
      pageviews24h: pageviews24h.length,
      totalSessions: sessions.length,
      totalPageviews: events.filter((e: any) => e.eventType === 'pageview').length,
      formStarts: formStarts.length,
      formCompletions: formCompletions.length,
      conversionRate: formStarts.length > 0 ? ((formCompletions.length / formStarts.length) * 100).toFixed(1) : '0',
      popularPages,
      trafficSources: Object.entries(trafficSources)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([source, count]) => ({ source, count })),
      deviceBreakdown: {
        mobile: sessions.filter((s: any) => s.deviceType === 'mobile').length,
        tablet: sessions.filter((s: any) => s.deviceType === 'tablet').length,
        desktop: sessions.filter((s: any) => s.deviceType === 'desktop').length
      }
    });
  } catch (error) {
    console.log('Error fetching analytics summary:', error);
    return c.json({ error: 'Failed to fetch summary' }, 500);
  }
});

Deno.serve(app.fetch);
