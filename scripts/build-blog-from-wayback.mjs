/**
 * Phase 3 of the old-blog migration — turn the recovered Wayback JSON into a
 * static TypeScript blog-data module the site can render directly.
 *
 * Reads:  scripts/wayback-content/*.json   (output of wayback-import.mjs)
 * Writes: src/components/data/importedBlogPosts.ts
 *
 * What it does to each recovered post:
 *   - cleans the HTML body (drops empty <div>/<p>, trims)
 *   - rewrites old WordPress internal links to the new site's paths
 *     (/breast-lift/  ->  /procedures/breast,  /contact-us/  ->  /contact, ...)
 *   - auto-categorizes by keyword (Face / Breast / Body / General) so the
 *     Resources filter works, and picks a matching procedure + hero image
 *   - derives excerpt, read-time, display date, SEO title/description/keywords
 *
 * ZERO dependencies, no internet — just reads local JSON. Run from the project root:
 *   node scripts/build-blog-from-wayback.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const IN_DIR = 'scripts/wayback-content';
const OUT_FILE = 'src/components/data/importedBlogPosts.ts';

// Category -> hero image (reuse URLs already proven to load in blogPosts.ts).
const IMAGES = {
  Breast: 'https://images.unsplash.com/photo-1559757175-5f96b77560f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwcGxhbm5pbmd8ZW58MXx8fHwxNzYzNTc4MzQzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  Body: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwY29uc3VsdGF0aW9uJTIwcGxhc3RpYyUyMHN1cmdlcnl8ZW58MXx8fHwxNzYzNTc4MzQyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  Face: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtZWRpY2FsJTIwY29uc3VsdGF0aW9uJTIwcGxhc3RpYyUyMHN1cmdlcnl8ZW58MXx8fHwxNjM1NTc4MzQyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  Nose: 'https://images.unsplash.com/photo-1620805176126-7a127bf2e612?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWNvdmVyeSUyMG1lZGljYWx8ZW58MXx8fHwxNzYzNTc4MzQzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  General: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjBjb25zdWx0YXRpb258ZW58MXx8fHwxNzYzNTc4MzQyfDA&ixlib=rb-4.1.0&q=80&w=1080',
};

// Decide the Resources-filter category + the underlying procedure from text.
function classify(slug, title) {
  const s = `${slug} ${title}`.toLowerCase();
  if (/rhinoplasty|\bnose\b|breathing/.test(s)) return { category: 'Face', proc: 'rhinoplasty' };
  if (/breast|implant|mastopexy|augmentation|reduction|saline|silicone/.test(s))
    return { category: 'Breast', proc: 'breast' };
  if (/tummy|abdominoplasty|liposuction|\blipo\b|thigh|arm[- ]?lift|athletic|body[- ]?contour/.test(s))
    return { category: 'Body', proc: 'body' };
  if (/facelift|brow|eyelid|otoplasty|neck[- ]?lift|chin|\bear\b|face/.test(s))
    return { category: 'Face', proc: 'face' };
  // surgeon-selection / general practice articles
  return { category: 'General', proc: 'general' };
}

function relatedFor(proc) {
  switch (proc) {
    case 'breast': return ['/procedures/breast'];
    case 'body': return ['/procedures/body'];
    case 'rhinoplasty': return ['/procedures/rhinoplasty'];
    case 'face': return ['/procedures/face'];
    default: return ['/procedures/face', '/procedures/breast', '/procedures/body'];
  }
}

function imageFor(proc, category) {
  if (proc === 'rhinoplasty') return IMAGES.Nose;
  if (proc === 'breast') return IMAGES.Breast;
  if (proc === 'body') return IMAGES.Body;
  if (proc === 'face') return IMAGES.Face;
  return IMAGES[category] || IMAGES.General;
}

// Map an old WordPress internal path to the new site's route.
function newPathFor(href) {
  // Drop our own domain if present, leaving an absolute path.
  let path = href.replace(/^https?:\/\/(www\.)?hanemannplasticsurgery\.com/i, '');
  if (!path.startsWith('/')) return href; // external link — leave untouched
  const p = path.toLowerCase();
  if (p.includes('contact')) return '/contact';
  if (/(^|\/)(us|about|about-us|meet-dr-hanemann|meet-the-team|our-staff)(\/|$)/.test(p)) return '/about';
  if (p.includes('gallery') || p.includes('photo')) return '/gallery';
  if (/breast|implant|mastopexy|augmentation|reduction|saline|silicone/.test(p)) return '/procedures/breast';
  if (/tummy|abdominoplasty|lipo|thigh|arm-lift|body/.test(p)) return '/procedures/body';
  if (/rhinoplasty|nose/.test(p)) return '/procedures/rhinoplasty';
  if (/facelift|brow|eyelid|otoplasty|neck|chin|\bear\b|face/.test(p)) return '/procedures/face';
  return '/contact'; // most remaining internal links are "schedule/learn more" CTAs
}

function isInternal(href) {
  return href.startsWith('/') || /hanemannplasticsurgery\.com/i.test(href);
}

function cleanHtml(html) {
  let h = html
    .replace(/<div>\s*<\/div>/gi, '')          // WordPress block spacers
    .replace(/<p>\s*(?:&nbsp;)?\s*<\/p>/gi, '') // empty paragraphs
    .replace(/\s+style=("|')[^"']*\1/gi, '')   // stray inline styles
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  // Rewrite internal links to the new routes; leave external links alone.
  h = h.replace(/href=("|')([^"']+)\1/gi, (m, q, href) =>
    `href="${isInternal(href) ? newPathFor(href) : href}"`);
  return h;
}

function toExcerpt(meta, text) {
  let src = (meta || '').trim();
  // Wayback meta descriptions often end on a truncated "… " fragment.
  src = src.replace(/\s*(…|\.\.\.)\s*$/, '').replace(/\s+\S*$/, m => (src.length > 180 ? '' : m));
  if (src.length < 60) src = (text || '').slice(0, 200);
  src = src.trim();
  if (src.length > 200) src = src.slice(0, 197).replace(/\s+\S*$/, '') + '…';
  return src;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function displayDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  return `${MONTHS[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}, ${m[1]}`;
}

// SEOHead already appends " | Hanemann Plastic Surgery", so return the bare
// title here (otherwise the brand would appear twice in the <title>).
function seoTitleFor(title) {
  return title.trim();
}

function keywordsFor(title, category) {
  const base = title.replace(/[^a-z0-9 ]/gi, '').toLowerCase();
  return [base, 'Baton Rouge', 'Hanemann Plastic Surgery', `${category} procedures`, 'Dr. Hanemann']
    .filter(Boolean).join(', ');
}

function run() {
  if (!existsSync(IN_DIR)) { console.error(`Missing ${IN_DIR}`); process.exit(1); }
  const files = readdirSync(IN_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));
  const records = {};
  let count = 0;

  for (const file of files) {
    const raw = JSON.parse(readFileSync(`${IN_DIR}/${file}`, 'utf8'));
    if (!raw.title || !raw.html) continue;
    const { category, proc } = classify(raw.slug, raw.title);
    const words = raw.wordCount || (raw.text ? raw.text.split(/\s+/).length : 0);

    records[raw.slug] = {
      id: raw.slug,
      slug: raw.slug,
      title: raw.title.trim(),
      seoTitle: seoTitleFor(raw.title),
      excerpt: toExcerpt(raw.metaDescription, raw.text),
      description: (raw.metaDescription || toExcerpt(raw.metaDescription, raw.text)).trim().slice(0, 300),
      keywords: keywordsFor(raw.title, category),
      category,
      date: displayDate(raw.date),
      readTime: `${Math.max(1, Math.round(words / 200))} min read`,
      image: imageFor(proc, category),
      author: 'Dr. Michael Hanemann',
      authorTitle: 'Board-Certified Plastic Surgeon',
      bodyHtml: cleanHtml(raw.html),
      relatedProcedures: relatedFor(proc),
    };
    count++;
  }

  // Stable ordering: newest first by ISO date kept on a side field, then title.
  const ordered = Object.values(records).sort((a, b) =>
    (b.date && a.date) ? new Date(b.date) - new Date(a.date) : a.title.localeCompare(b.title));
  const orderedMap = {};
  for (const r of ordered) orderedMap[r.slug] = r;

  const header = `// AUTO-GENERATED by scripts/build-blog-from-wayback.mjs — do not edit by hand.\n` +
    `// Recovered legacy blog content (Internet Archive). Regenerate with:\n` +
    `//   node scripts/build-blog-from-wayback.mjs\n` +
    `import type { BlogPostData } from './blogPosts';\n\n` +
    `export const importedBlogPostsData: Record<string, BlogPostData> = `;

  writeFileSync(OUT_FILE, header + JSON.stringify(orderedMap, null, 2) + ';\n');
  console.log(`Wrote ${count} recovered posts -> ${OUT_FILE}`);
  const byCat = ordered.reduce((acc, r) => ((acc[r.category] = (acc[r.category] || 0) + 1), acc), {});
  console.log('By category:', JSON.stringify(byCat));
}

run();
