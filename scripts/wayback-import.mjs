/**
 * Wayback content extractor — Phase 1 of the old-blog content migration.
 *
 * Reads scripts/old-blog-urls.txt (one old URL per line), finds each page's
 * best snapshot in the Internet Archive, downloads the *raw* archived HTML
 * (no Wayback toolbar), and extracts title / date / meta description / body
 * into one clean JSON file per article under scripts/wayback-content/.
 *
 * ZERO dependencies — just Node 18+ (you have v24). Nothing to install.
 *
 * RUN THIS ON YOUR MACHINE (it needs internet; Claude's env is offline):
 *   cd "C:\Users\music\OneDrive\Desktop\New folder\HPS-WEB-FEBRUARY"
 *   node scripts/wayback-import.mjs --limit 3      (test on 3 first)
 *   node scripts/wayback-import.mjs                (full run once happy)
 *
 * Then hand Claude 2-3 of the JSON files to build the importer.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const URL_LIST = 'scripts/old-blog-urls.txt';
const OUT_DIR = 'scripts/wayback-content';
const DELAY_MS = 1500; // be polite to archive.org

const args = process.argv.slice(2);
const li = args.indexOf('--limit');
const LIMIT = li !== -1 ? parseInt(args[li + 1], 10) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugFromUrl(u) {
  try {
    const p = new URL(u).pathname.replace(/\/+$/, '');
    return p.split('/').pop() || 'home';
  } catch {
    return u.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  }
}

async function bestSnapshot(url) {
  const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
  const res = await fetch(api, { headers: { 'User-Agent': 'hps-content-migration' } });
  if (!res.ok) throw new Error(`availability ${res.status}`);
  const data = await res.json();
  const snap = data?.archived_snapshots?.closest;
  return snap?.available && snap?.url ? snap.url : null;
}

// id_ form returns the original page HTML without Wayback's injected toolbar.
const rawForm = (s) => s.replace(/(\/web\/\d+)\//, '$1id_/');

// ---- tiny dependency-free HTML helpers ----
function stripNoise(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

// Find an element by tag+class and return its inner HTML via balanced scanning.
function extractByClass(html, tag, className) {
  const open = new RegExp(`<${tag}\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, 'i');
  const m = open.exec(html);
  if (!m) return null;
  const start = m.index + m[0].length;
  const tagRe = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  tagRe.lastIndex = start;
  let depth = 1, match;
  while ((match = tagRe.exec(html)) !== null) {
    depth += match[1] === '/' ? -1 : 1;
    if (depth === 0) return html.slice(start, match.index);
  }
  return html.slice(start);
}

// First <tag>...</tag> block (balanced) — for <article>/<main> fallbacks.
function extractByTag(html, tag) {
  const open = new RegExp(`<${tag}\\b[^>]*>`, 'i');
  const m = open.exec(html);
  if (!m) return null;
  const start = m.index + m[0].length;
  const tagRe = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  tagRe.lastIndex = start;
  let depth = 1, match;
  while ((match = tagRe.exec(html)) !== null) {
    depth += match[1] === '/' ? -1 : 1;
    if (depth === 0) return html.slice(start, match.index);
  }
  return html.slice(start);
}

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&rsquo;|&lsquo;|&#8217;|&#8216;/g, "'")
    .replace(/&quot;|&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—').replace(/&hellip;|&#8230;/g, '…');
}

function toText(h) {
  return decode(h.replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]*\n[ \t]*\n+/g, '\n\n')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
}

function firstMatch(html, re) {
  const m = re.exec(html);
  return m ? decode(m[1].trim()) : '';
}

function extract(htmlRaw) {
  const html = stripNoise(htmlRaw);

  const title =
    firstMatch(html, /<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '') ||
    firstMatch(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i).replace(/\s*[|–-]\s*Hanemann[\s\S]*$/i, '').trim();

  const metaDescription =
    firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    firstMatch(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);

  const date =
    firstMatch(html, /<time[^>]+datetime=["']([^"']+)["']/i) ||
    firstMatch(html, /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i);

  let body =
    extractByClass(html, 'div', 'entry-content') ||
    extractByTag(html, 'article') ||
    extractByTag(html, 'main') ||
    extractByTag(html, 'body') ||
    '';

  // Rewrite archived image URLs back to their original host.
  body = body.replace(/(src=["'])https?:\/\/web\.archive\.org\/web\/\d+[a-z_]*\/(https?:\/\/[^"']+)(["'])/gi, '$1$2$3');

  const text = toText(body);
  return { title, metaDescription, date, html: body.trim(), text, wordCount: text ? text.split(/\s+/).length : 0 };
}

async function run() {
  if (!existsSync(URL_LIST)) { console.error(`Missing ${URL_LIST}`); process.exit(1); }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const urls = readFileSync(URL_LIST, 'utf8').split(/\r?\n/)
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).slice(0, LIMIT);

  console.log(`Processing ${urls.length} URL(s)...\n`);
  const index = [];
  let ok = 0, miss = 0, fail = 0;

  for (const url of urls) {
    const slug = slugFromUrl(url);
    process.stdout.write(`• ${slug} ... `);
    try {
      const snap = await bestSnapshot(url);
      if (!snap) { console.log('NO SNAPSHOT'); miss++; await sleep(DELAY_MS); continue; }
      const res = await fetch(rawForm(snap), { headers: { 'User-Agent': 'hps-content-migration' } });
      if (!res.ok) { console.log(`fetch ${res.status}`); fail++; await sleep(DELAY_MS); continue; }
      const data = extract(await res.text());
      if (!data.title && !data.text) { console.log('EMPTY'); fail++; await sleep(DELAY_MS); continue; }
      const record = { slug, sourceUrl: url, snapshot: snap, ...data };
      writeFileSync(`${OUT_DIR}/${slug}.json`, JSON.stringify(record, null, 2));
      index.push({ slug, title: data.title, words: data.wordCount, date: data.date });
      console.log(`OK (${data.wordCount} words)`);
      ok++;
    } catch (err) {
      console.log(`ERROR ${err.message}`); fail++;
    }
    await sleep(DELAY_MS);
  }

  writeFileSync(`${OUT_DIR}/_index.json`, JSON.stringify(index, null, 2));
  console.log(`\nDone. OK: ${ok}, no-snapshot: ${miss}, failed: ${fail}`);
  console.log(`Output: ${OUT_DIR}/  — review a few, then send Claude 2-3 samples.`);
}

run();
