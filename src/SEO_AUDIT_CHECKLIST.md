# 🔍 SEARCH ENGINE CRAWL AUDIT CHECKLIST

## What Search Engines Actually Evaluate When Crawling Your Site

This is a comprehensive, actionable checklist of **exactly what search engines look for** when crawling and ranking websites. Use this to audit any site programmatically or manually.

---

## 1️⃣ **PAGE-LEVEL TECHNICAL SEO**

### **Meta Tags** (Crawlable in `<head>`)

```html
✅ CHECK: Does page have these tags?

<!-- Title Tag -->
<title>Primary Keyword | Brand Name</title>
• Length: 50-60 characters (display limit)
• Includes target keyword
• Unique per page
• Includes location (for local SEO)

<!-- Meta Description -->
<meta name="description" content="...">
• Length: 120-155 characters
• Includes target keyword
• Includes CTA
• Unique per page
• Includes location (for local SEO)

<!-- Canonical URL -->
<link rel="canonical" href="https://example.com/page">
• Points to correct page (avoid duplicate content)
• Absolute URL (not relative)

<!-- Viewport (Mobile) -->
<meta name="viewport" content="width=device-width, initial-scale=1">
• Required for mobile-first indexing

<!-- Language -->
<html lang="en">
• Declares page language

<!-- Charset -->
<meta charset="UTF-8">
• Declares character encoding
```

**How to Audit:**
```javascript
// Title tag
const title = document.querySelector('title')?.textContent;
console.log('Title:', title, '| Length:', title?.length);

// Meta description
const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
console.log('Description:', description, '| Length:', description?.length);

// Canonical
const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
console.log('Canonical:', canonical);
```

---

### **Heading Structure** (Crawlable in `<body>`)

```html
✅ CHECK: Is heading hierarchy correct?

<!-- Only ONE H1 per page -->
<h1>Primary Keyword in Baton Rouge, LA</h1>
• Contains main keyword
• Contains location (for local SEO)
• Only one H1 per page

<!-- H2s for main sections -->
<h2>Section Title with Related Keywords</h2>
• Multiple H2s allowed
• Semantic structure (H2 → H3 → H4)
• Never skip levels (no H1 → H3)

<!-- H3s for subsections under H2s -->
<h3>Subsection Title</h3>
```

**How to Audit:**
```javascript
// Check H1 count (should be exactly 1)
const h1Count = document.querySelectorAll('h1').length;
console.log('H1 count:', h1Count, h1Count === 1 ? '✅' : '❌');

// Check all headings
['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
  const headings = document.querySelectorAll(tag);
  console.log(`${tag.toUpperCase()}: ${headings.length}`);
  headings.forEach((h, i) => console.log(`  ${i+1}. ${h.textContent}`));
});
```

---

### **Structured Data (Schema Markup)** (Crawlable in `<script>` tags)

```html
✅ CHECK: Does page have relevant schema?

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "Business Name",
  "telephone": "+1-225-766-2166",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "City",
    "addressRegion": "ST",
    "postalCode": "12345"
  }
}
</script>
```

**Schema Types Search Engines Love:**
- **LocalBusiness** / MedicalBusiness / Restaurant / etc.
- **Organization**
- **WebSite** (with siteNavigationElement)
- **BreadcrumbList**
- **FAQPage**
- **Article** / BlogPosting
- **Product** (with reviews/price)
- **Review** / AggregateRating
- **VideoObject**
- **Event**
- **Person** (for professionals)
- **MedicalProcedure** (rare, high value!)

**How to Audit:**
```javascript
// Find all JSON-LD schema
const schemas = document.querySelectorAll('script[type="application/ld+json"]');
console.log('Schema count:', schemas.length);
schemas.forEach((schema, i) => {
  const data = JSON.parse(schema.textContent);
  console.log(`Schema ${i+1}:`, data['@type']);
});

// Validate at: https://search.google.com/test/rich-results
```

---

### **Open Graph & Social Meta** (Crawlable in `<head>`)

```html
✅ CHECK: Does page have social sharing tags?

<!-- Open Graph (Facebook, LinkedIn) -->
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description">
<meta name="twitter:image" content="https://example.com/image.jpg">
```

---

## 2️⃣ **CONTENT QUALITY SIGNALS**

### **Keyword Usage & Relevance**

```
✅ CHECK: Content quality signals

• Target keyword in H1
• Target keyword in first 100 words
• Target keyword 2-5 times in body (natural density)
• LSI keywords (related terms) present
• Location keywords present (for local SEO)
• Content length: 800+ words for pages, 1500+ for blog posts
• Readability: 8th grade reading level (Flesch-Kincaid)
• No keyword stuffing (over-optimization penalty)
```

**How to Audit:**
```javascript
// Get all text content
const bodyText = document.body.innerText;
const wordCount = bodyText.split(/\s+/).length;
console.log('Word count:', wordCount);

// Check keyword density
const keyword = 'plastic surgeon';
const keywordCount = (bodyText.match(new RegExp(keyword, 'gi')) || []).length;
const density = ((keywordCount / wordCount) * 100).toFixed(2);
console.log(`"${keyword}" appears ${keywordCount} times (${density}% density)`);
```

---

### **Internal Linking**

```
✅ CHECK: Internal link structure

• Links use descriptive anchor text (not "click here")
• Links point to relevant internal pages
• Important pages have more internal links pointing to them
• No broken internal links (404s)
• Links use relative URLs or absolute with domain
• Footer links to important pages
• Breadcrumb navigation present
```

**How to Audit:**
```javascript
// Get all internal links
const links = Array.from(document.querySelectorAll('a[href]'));
const internalLinks = links.filter(link => {
  const href = link.getAttribute('href');
  return href?.startsWith('/') || href?.includes(window.location.hostname);
});

console.log('Internal links:', internalLinks.length);
internalLinks.forEach(link => {
  console.log('→', link.textContent.trim(), '|', link.getAttribute('href'));
});
```

---

## 3️⃣ **TECHNICAL INFRASTRUCTURE**

### **URL Structure**

```
✅ CHECK: SEO-friendly URLs

GOOD:
• /procedures/rhinoplasty
• /blog/tummy-tuck-recovery-guide
• /about-dr-hanemann

BAD:
• /page?id=123
• /#/procedures (SPA hash routes)
• /procedures/12345/edit

Rules:
• Lowercase only
• Hyphens (not underscores)
• No special characters
• Short and descriptive
• Includes keywords
• No session IDs or parameters
```

**How to Audit:**
```javascript
const url = window.location.href;
console.log('Current URL:', url);

// Check for bad patterns
const issues = [];
if (url.includes('?id=')) issues.push('Query parameters in URL');
if (url.includes('#/')) issues.push('Hash routing (not crawlable)');
if (url.includes('_')) issues.push('Underscores instead of hyphens');
if (/[A-Z]/.test(url)) issues.push('Uppercase characters');

console.log('URL issues:', issues.length ? issues : '✅ None');
```

---

### **Sitemap.xml**

```
✅ CHECK: Valid XML sitemap

Location: /sitemap.xml or /sitemap_index.xml

Must include:
• <loc> - Full URL of page
• <lastmod> - Last modified date
• <changefreq> - How often page changes
• <priority> - Importance (0.0 - 1.0)

Example:
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2025-01-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

**How to Audit:**
```bash
# Check if sitemap exists
curl -I https://example.com/sitemap.xml

# Validate sitemap
# Use: https://www.xml-sitemaps.com/validate-xml-sitemap.html
```

---

### **Robots.txt**

```
✅ CHECK: Robots.txt allows crawling

Location: /robots.txt

Good example:
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: https://example.com/sitemap.xml

Bad patterns:
Disallow: /  ← Blocks all crawlers!
```

**How to Audit:**
```bash
# Check robots.txt
curl https://example.com/robots.txt

# Test with Google Search Console:
# https://search.google.com/search-console/robots-testing-tool
```

---

### **HTTPS & Security**

```
✅ CHECK: Site uses HTTPS

• Valid SSL certificate
• No mixed content (HTTP resources on HTTPS page)
• HSTS header set
• Redirects from HTTP → HTTPS
```

**How to Audit:**
```javascript
console.log('Protocol:', window.location.protocol);
console.log('Secure:', window.location.protocol === 'https:' ? '✅' : '❌');

// Check for mixed content
const insecureResources = Array.from(document.querySelectorAll('img, script, link')).filter(el => {
  const src = el.src || el.href;
  return src?.startsWith('http://');
});
console.log('Insecure resources:', insecureResources.length);
```

---

## 4️⃣ **MOBILE & PERFORMANCE**

### **Mobile-Friendliness**

```
✅ CHECK: Mobile optimization

• Responsive design (no fixed widths)
• Text readable without zooming (16px+ font)
• Tap targets at least 48x48px
• No horizontal scrolling
• Fast mobile load time (<3 seconds)
• No Flash or unsupported plugins
• Viewport meta tag present
```

**How to Audit:**
```javascript
// Check viewport meta tag
const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content');
console.log('Viewport:', viewport || '❌ Missing');

// Check font size
const body = document.body;
const fontSize = window.getComputedStyle(body).fontSize;
console.log('Body font size:', fontSize);
```

**Tools:**
- Google Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- Chrome DevTools Device Toolbar

---

### **Core Web Vitals** (Ranking Factor!)

```
✅ CHECK: Performance metrics

1. Largest Contentful Paint (LCP)
   • Good: < 2.5 seconds
   • Poor: > 4 seconds
   • What it measures: Time to load main content

2. First Input Delay (FID) / Interaction to Next Paint (INP)
   • Good: < 100ms (FID) or < 200ms (INP)
   • Poor: > 300ms (FID) or > 500ms (INP)
   • What it measures: Responsiveness to user input

3. Cumulative Layout Shift (CLS)
   • Good: < 0.1
   • Poor: > 0.25
   • What it measures: Visual stability (no jumping content)
```

**How to Audit:**
```bash
# Use Lighthouse in Chrome DevTools
# Or: https://pagespeed.web.dev/

# Run test:
lighthouse https://example.com --view
```

---

### **Page Speed**

```
✅ CHECK: Fast load time

• Server response time < 200ms (TTFB)
• Total page size < 3MB
• Images optimized (WebP, compressed)
• CSS/JS minified
• Lazy loading for images
• Browser caching enabled
• CDN usage (optional but recommended)
```

**How to Audit:**
```javascript
// Check page resources
performance.getEntriesByType('resource').forEach(resource => {
  console.log(resource.name, '|', (resource.transferSize / 1024).toFixed(2), 'KB');
});

// Total page weight
const totalSize = performance.getEntriesByType('resource')
  .reduce((sum, r) => sum + (r.transferSize || 0), 0);
console.log('Total page size:', (totalSize / 1024 / 1024).toFixed(2), 'MB');
```

---

## 5️⃣ **LOCAL SEO SIGNALS** (Critical for Local Businesses!)

### **NAP Consistency** (Name, Address, Phone)

```
✅ CHECK: Contact info is consistent and crawlable

Must appear on every page (usually footer):

• Business Name: "Hanemann Plastic Surgery"
• Address: "5233 Dijon Dr, Baton Rouge, LA 70808"
• Phone: "(225) 766-2166" or "+1-225-766-2166"

Requirements:
• Exact same format across all pages
• Phone clickable: <a href="tel:+12257662166">
• Address wrapped in structured data (LocalBusiness schema)
• Address links to Google Maps
```

**How to Audit:**
```javascript
// Find phone numbers
const phoneLinks = Array.from(document.querySelectorAll('a[href^="tel:"]'));
console.log('Phone numbers found:', phoneLinks.length);
phoneLinks.forEach(link => console.log('→', link.textContent, '|', link.href));

// Check for address
const bodyText = document.body.innerText;
const hasAddress = /\d+\s+[A-Za-z\s]+,\s+[A-Za-z\s]+,\s+[A-Z]{2}\s+\d{5}/.test(bodyText);
console.log('Address found:', hasAddress ? '✅' : '❌');
```

---

### **Local Keywords**

```
✅ CHECK: Location keywords present

• City name in title tag
• City name in H1
• City name in meta description
• Surrounding areas mentioned (Prairieville, Gonzales, etc.)
• State abbreviation (LA) or full name (Louisiana)
• "Near me" optimization (implicit with location)

Example:
❌ "Plastic Surgeon"
✅ "Plastic Surgeon in Baton Rouge, LA"
```

---

### **Google Business Profile Integration**

```
✅ CHECK: Embedded map or link to GBP

• Google Maps embed on Contact page
• Link to Google Business Profile
• Reviews widget (optional)
• Consistent NAP with GBP listing
```

---

## 6️⃣ **IMAGE OPTIMIZATION**

### **Image SEO**

```
✅ CHECK: Images are optimized

• Alt text on ALL images (accessibility + SEO)
• File names descriptive (rhinoplasty-before-after.jpg, not IMG_1234.jpg)
• Images compressed (< 200KB each)
• Modern formats (WebP, AVIF)
• Lazy loading enabled
• Responsive images (srcset)
• No broken image links

Example:
<img 
  src="rhinoplasty-baton-rouge.webp" 
  alt="Rhinoplasty before and after results in Baton Rouge" 
  loading="lazy"
  width="800"
  height="600"
>
```

**How to Audit:**
```javascript
// Check images without alt text
const imagesWithoutAlt = Array.from(document.querySelectorAll('img:not([alt])'));
console.log('Images without alt:', imagesWithoutAlt.length);

// Check all images
const allImages = document.querySelectorAll('img');
console.log('Total images:', allImages.length);
allImages.forEach(img => {
  console.log('→', img.src, '| Alt:', img.alt || '❌ Missing');
});
```

---

## 7️⃣ **USER EXPERIENCE SIGNALS** (Indirect Ranking Factors)

### **Click-Through Rate (CTR) from Search**

```
✅ CHECK: Title & description encourage clicks

Optimized title/description → Higher CTR → Better rankings

• Compelling title with benefit
• Power words (Expert, Proven, Transform, etc.)
• Numbers (5 Ways, 10 Tips)
• Local modifier
• CTA in description
```

---

### **Dwell Time & Bounce Rate**

```
✅ CHECK: Users stay on page

Signals Google uses:
• Time on page (longer = better)
• Bounce rate (lower = better)
• Pages per session (higher = better)

Improve by:
• Engaging content above the fold
• Clear navigation
• Related content links
• Fast load time
• No intrusive popups
```

---

### **Accessibility**

```
✅ CHECK: Site is accessible

• Alt text on images
• ARIA labels on interactive elements
• Keyboard navigation works
• Color contrast ratio 4.5:1+
• No reliance on color alone
• Skip to content link
• Form labels present

Why it matters:
• Legal compliance (ADA)
• Better UX for all users
• Google considers accessibility
```

**How to Audit:**
```bash
# Use axe DevTools or Lighthouse Accessibility audit
# Or: https://wave.webaim.org/
```

---

## 8️⃣ **CONTENT FRESHNESS**

### **Last Updated Date**

```
✅ CHECK: Content is fresh

• Publish date visible on blog posts
• Last updated date shown
• Regular content updates
• New blog posts monthly
• Old content refreshed annually

Search engines favor fresh content!
```

---

## 9️⃣ **CRAWLABILITY**

### **No Crawler Blockers**

```
✅ CHECK: Nothing blocks crawlers

Avoid:
• JavaScript-only rendering (use SSR or SSG)
• CAPTCHA before content
• Login-walled content
• Infinite scroll without pagination
• Ajax-loaded content without fallback

Google can render JS, but it's slower and less reliable.
```

---

## 🔟 **BACKLINKS & AUTHORITY** (Off-Page SEO)

### **External Links Pointing to Your Site**

```
✅ CHECK: Quality backlinks

High-value backlinks:
• Medical directories (Healthgrades, RealSelf, Vitals)
• Local directories (Yelp, Yellow Pages)
• Local news sites
• Medical association sites (ASPS, etc.)
• .edu or .gov sites

Low-value/harmful:
• Link farms
• Spammy directories
• Unrelated sites
• Paid links without rel="nofollow"
```

**How to Check:**
- Google Search Console → Links
- Ahrefs, SEMrush, Moz (paid tools)

---

## 📊 **COMPLETE AUDIT SCRIPT**

Here's a JavaScript snippet you can run in the browser console to audit any page:

```javascript
// === SEO AUDIT SCRIPT ===
console.clear();
console.log('🔍 SEO AUDIT STARTING...\n');

// 1. TITLE TAG
const title = document.querySelector('title')?.textContent || 'MISSING';
console.log('📌 TITLE:', title);
console.log('   Length:', title.length, title.length >= 50 && title.length <= 60 ? '✅' : '⚠️');

// 2. META DESCRIPTION
const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || 'MISSING';
console.log('\n📌 DESCRIPTION:', description);
console.log('   Length:', description.length, description.length >= 120 && description.length <= 155 ? '✅' : '⚠️');

// 3. H1 COUNT
const h1s = document.querySelectorAll('h1');
console.log('\n📌 H1 COUNT:', h1s.length, h1s.length === 1 ? '✅' : '❌');
h1s.forEach(h1 => console.log('   →', h1.textContent.trim()));

// 4. CANONICAL
const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || 'MISSING';
console.log('\n📌 CANONICAL:', canonical);

// 5. SCHEMA MARKUP
const schemas = document.querySelectorAll('script[type="application/ld+json"]');
console.log('\n📌 SCHEMA COUNT:', schemas.length);
schemas.forEach((schema, i) => {
  try {
    const data = JSON.parse(schema.textContent);
    console.log(`   ${i+1}. Type:`, data['@type'] || 'Unknown');
  } catch(e) {
    console.log(`   ${i+1}. Parse error`);
  }
});

// 6. IMAGES WITHOUT ALT
const imgsNoAlt = Array.from(document.querySelectorAll('img:not([alt])')).length;
const totalImgs = document.querySelectorAll('img').length;
console.log('\n📌 IMAGES:', totalImgs, 'total,', imgsNoAlt, 'without alt', imgsNoAlt === 0 ? '✅' : '⚠️');

// 7. INTERNAL LINKS
const links = Array.from(document.querySelectorAll('a[href]'));
const internalLinks = links.filter(l => {
  const href = l.getAttribute('href');
  return href?.startsWith('/') || href?.includes(window.location.hostname);
}).length;
console.log('\n📌 INTERNAL LINKS:', internalLinks);

// 8. HTTPS
console.log('\n📌 HTTPS:', window.location.protocol === 'https:' ? '✅' : '❌');

// 9. MOBILE VIEWPORT
const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || 'MISSING';
console.log('\n📌 VIEWPORT:', viewport !== 'MISSING' ? '✅' : '❌');

// 10. PAGE SPEED (rough estimate)
const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
console.log('\n📌 PAGE LOAD TIME:', (loadTime / 1000).toFixed(2), 'seconds');

// 11. WORD COUNT
const bodyText = document.body.innerText;
const wordCount = bodyText.split(/\s+/).length;
console.log('\n📌 WORD COUNT:', wordCount, wordCount >= 800 ? '✅' : '⚠️ (Consider adding more content)');

// 12. PHONE NUMBER (CLICK TO CALL)
const phoneLinks = document.querySelectorAll('a[href^="tel:"]').length;
console.log('\n📌 CLICK-TO-CALL PHONE:', phoneLinks, phoneLinks > 0 ? '✅' : '⚠️');

console.log('\n\n✅ AUDIT COMPLETE!\n');
console.log('Next steps:');
console.log('1. Run Google PageSpeed Insights: https://pagespeed.web.dev/');
console.log('2. Test schema: https://search.google.com/test/rich-results');
console.log('3. Check mobile: https://search.google.com/test/mobile-friendly');
console.log('4. Submit sitemap in Google Search Console');
```

---

## 🚀 **PRIORITY RANKING**

If you can only fix a few things, prioritize in this order:

### **Tier 1 (Critical - Fix Immediately):**
1. ✅ One H1 per page with target keyword + location
2. ✅ Unique title tag per page (50-60 chars)
3. ✅ Unique meta description per page (120-155 chars)
4. ✅ HTTPS enabled
5. ✅ Mobile-friendly (viewport meta tag)
6. ✅ Valid sitemap.xml
7. ✅ Robots.txt doesn't block crawlers

### **Tier 2 (High Impact):**
8. ✅ LocalBusiness schema markup
9. ✅ FAQ schema on key pages
10. ✅ Breadcrumb navigation + schema
11. ✅ Alt text on all images
12. ✅ NAP (Name, Address, Phone) consistent
13. ✅ Core Web Vitals passing (LCP, CLS, INP)
14. ✅ Internal linking structure

### **Tier 3 (Important):**
15. ✅ MedicalProcedure schema (procedure pages)
16. ✅ Click-to-call phone links
17. ✅ Content > 800 words per page
18. ✅ SEO-friendly URLs
19. ✅ Open Graph tags
20. ✅ Keyword in first 100 words

---

## 📝 **TOOLS TO USE**

### **Free Tools:**
- **Google Search Console** - Index status, errors, queries
- **Google PageSpeed Insights** - Performance + Core Web Vitals
- **Google Rich Results Test** - Schema validation
- **Google Mobile-Friendly Test** - Mobile optimization
- **Screaming Frog SEO Spider** - Full site crawl (free up to 500 URLs)
- **Chrome DevTools Lighthouse** - Full audit (performance, SEO, accessibility)

### **Paid Tools (Optional):**
- **Ahrefs** - Backlinks, keyword research, competitor analysis
- **SEMrush** - Full SEO suite
- **Moz Pro** - Domain authority, rank tracking

---

## ✅ **QUICK WIN CHECKLIST**

Copy this and check off as you audit:

```
PAGE-LEVEL:
☐ Title tag present, unique, 50-60 chars
☐ Meta description present, unique, 120-155 chars
☐ Canonical URL set
☐ Exactly one H1 per page
☐ H1 contains target keyword + location
☐ Heading hierarchy (H2 → H3 → H4, no skipping)
☐ LocalBusiness schema present
☐ FAQ schema on procedure pages
☐ Breadcrumb schema present
☐ Open Graph tags present
☐ All images have alt text
☐ NAP (Name, Address, Phone) visible
☐ Phone number is click-to-call
☐ 800+ words of content
☐ Target keyword in first 100 words
☐ Internal links with descriptive anchor text

SITE-WIDE:
☐ HTTPS enabled (SSL certificate)
☐ Mobile-friendly (viewport meta tag)
☐ sitemap.xml exists and returns 200
☐ sitemap.xml submitted to Google Search Console
☐ robots.txt exists and allows crawling
☐ Core Web Vitals passing (PageSpeed Insights)
☐ Page load time < 3 seconds
☐ No broken links (404s)
☐ SEO-friendly URLs (lowercase, hyphens, keywords)
☐ Google Business Profile claimed and optimized

CONTENT:
☐ Blog/resources section exists
☐ 4+ blog posts published
☐ Regular content updates
☐ Internal linking between blog and procedure pages
☐ FAQ sections on key pages
☐ Testimonials/reviews visible
```

---

## 🎯 **EXPECTED RESULTS**

After implementing these fixes:

**3 Months:**
- 50-100% increase in Google Search impressions
- Ranking for brand name (position 1)
- Ranking for long-tail keywords (positions 5-15)

**6 Months:**
- Ranking for competitive local keywords (positions 3-10)
- Rich snippets appearing for FAQs
- 3-5x increase in organic traffic

**12 Months:**
- Dominant local rankings (positions 1-3)
- Map pack inclusion (top 3)
- 10x increase in consultation requests from organic search

---

**Use this checklist to audit any site and make data-driven SEO improvements! 🚀**
