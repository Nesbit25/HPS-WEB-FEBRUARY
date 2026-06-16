/**
 * Wayback content extractor — Phase 1 of the old-blog content migration.
 *
 * Reads scripts/old-blog-urls.txt (one old URL per line), finds each page's
 * best snapshot in the Internet Archive, downloads the *raw* archived HTML
 * (no Wayback toolbar), and extracts title / date / meta description / body
 * into one clean JSON file per article under scripts/wayback-content/.
 *
 * RUN THIS ON YOUR MACHINE (it needs internet; Claude's environment is
 * network-restricted):
 *
 *   1. cd "C:\Users\music\OneDrive\Desktop\New folder\HPS-WEB-FEBRUARY"
 *   2. npm i --no-save cheerio        (HTML parser; --no-save keeps it out of package.json)
 *   3. node scripts/wayback-import.mjs --limit 3      (test on 3 first)
 *   4. Review scripts/wayback-content/*.json
 *   5. node scripts/wayback-import.mjs                (full run once happy)
 *
 * Then hand a couple of the JSON files back to Claude to build the importer.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { load } from 'cheerio';

const URL_LIST = 'scripts/old-blog-urls.txt';
const OUT_DIR = 'scripts/wayback-content';
const DELAY_MS = 1500; // be polite to archive.org

const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugFromUrl(u) {
  try {
    const path = new URL(u).pathname.replace(/\/+$/, '');
    return path.split('/').pop() || 'home';
  } catch {
    return u.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  }
}

// Ask the Wayback availability API for the closest good snapshot.
async function bestSnapshot(url) {
  const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
  const res = await fetch(api, { headers: { 'User-Agent': 'hps-content-migration' } });
  if (!res.ok) throw new Error(`availability ${res.status}`);
  const data = await res.json();
  const snap = data?.archived_snapshots?.closest;
  if (!snap?.available || !snap?.url) return null;
  return snap.url; // e.g. http://web.archive.org/web/20190112/https://...
}

// Convert a snapshot URL to the "raw" id_ form so we get the original page
// HTML without the injected Wayback toolbar/scripts.
function rawForm(snapUrl) {
  return snapUrl.replace(/(\/web\/\d+)\//, '$1id_/');
}

function extract($, sourceUrl) {
  // Title: prefer the WordPress entry title, then og:title, then <title>.
  const title =
    $('h1.entry-title').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('title').first().text().replace(/\s*[|–-]\s*Hanemann.*$/i, '').trim() ||
    '';

  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    '';

  // Publish date: <time datetime>, common WP meta, or visible posted date.
  const date =
    $('time[datetime]').attr('datetime') ||
    $('meta[property="article:published_time"]').attr('content') ||
    $('.entry-time, .posted-on time, .entry-date').first().text().trim() ||
    '';

  // Body: the WordPress content container, with the usual junk stripped.
  let $body =
    $('.entry-content').first().length ? $('.entry-content').first() :
    $('article').first().length ? $('article').first() :
    $('main').first().length ? $('main').first() :
    $('body');

  $body.find(
    'script, style, noscript, nav, header, footer, form, iframe, ' +
    '.sharedaddy, .jp-relatedposts, .sd-sharing, .author-box, ' +
    '.entry-meta, .breadcrumb, .sidebar, #comments, .comments-area, ' +
    '.wp-customer-reviews, .crystal-gallery, .nav-links'
  ).remove();

  // Rewrite any web.archive.org image src back to the original host so we
  // don't hot-link the archive (we'll re-host or swap later).
  $body.find('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const m = src.match(/\/web\/\d+[a-z_]*\/(https?:\/\/.+)$/i);
    if (m) $(el).attr('src', m[1]);
  });

  const html = ($body.html() || '').trim();
  const text = $body.text().replace(/\n{3,}/g, '\n\n').trim();

  return { title, metaDescription, date, html, text };
}

async function run() {
  if (!existsSync(URL_LIST)) {
    console.error(`Missing ${URL_LIST}. Create it with one old URL per line.`);
    process.exit(1);
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const urls = readFileSync(URL_LIST, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .slice(0, LIMIT);

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
      const htmlRaw = await res.text();

      const $ = load(htmlRaw);
      const data = extract($, url);
      if (!data.title && !data.text) { console.log('EMPTY'); fail++; await sleep(DELAY_MS); continue; }

      const record = { slug, sourceUrl: url, snapshot: snap, ...data, wordCount: data.text.split(/\s+/).length };
      writeFileSync(`${OUT_DIR}/${slug}.json`, JSON.stringify(record, null, 2));
      index.push({ slug, title: data.title, words: record.wordCount, date: data.date });
      console.log(`OK (${record.wordCount} words)`);
      ok++;
    } catch (err) {
      console.log(`ERROR ${err.message}`);
      fail++;
    }
    await sleep(DELAY_MS);
  }

  writeFileSync(`${OUT_DIR}/_index.json`, JSON.stringify(index, null, 2));
  console.log(`\nDone. OK: ${ok}, no-snapshot: ${miss}, failed: ${fail}`);
  console.log(`Output: ${OUT_DIR}/  (review a few, then send Claude 2-3 samples)`);
}

run();
