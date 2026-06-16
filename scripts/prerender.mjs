/**
 * Post-build prerender for the HPS SPA.
 *
 * WHY: this is a client-rendered React SPA. Googlebot executes JS and sees the
 * full site, but many crawlers/scrapers (Bing, Semrush, AI bots, social link
 * unfurlers) do NOT run JS — they see an almost-empty index.html with no
 * content, schema, or per-page meta. This script renders every route in a real
 * headless Chrome (so all browser APIs + dynamic data work) and writes the
 * fully-rendered HTML to build/<route>/index.html. Crawlers then get complete
 * markup; the React app still hydrates normally for real users.
 *
 * SAFE BY DESIGN: this is NOT wired into the default `build` script, so it
 * cannot break your Vercel deploy. Turn it on deliberately (see USAGE).
 *
 * USAGE (run on a machine with internet — needs Chromium):
 *   npm install --save-dev puppeteer
 *   npm run build:prerender          # = vite build && node scripts/prerender.mjs
 *   npx serve build                  # spot-check, then deploy build/
 *
 * Test on a Vercel PREVIEW deployment before switching the production build
 * command from `vite build` to `npm run build:prerender`.
 *
 * Routes are read from public/sitemap.xml — your single source of truth, so new
 * blog posts/pages are picked up automatically when the sitemap is regenerated.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readFileSync as rf } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname, dirname } from 'node:path';

const BUILD_DIR = 'build';
const SITEMAP = 'public/sitemap.xml';
const PORT = 4178;
const ORIGIN = `http://localhost:${PORT}`;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain',
};

// Minimal static server with SPA fallback to index.html.
function startServer() {
  const indexHtml = rf(join(BUILD_DIR, 'index.html'));
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = join(BUILD_DIR, urlPath);
    try {
      if (existsSync(filePath) && statSync(filePath).isFile()) {
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
        res.end(rf(filePath));
        return;
      }
    } catch { /* fall through to SPA index */ }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexHtml); // SPA fallback — React Router resolves the route client-side
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

// Pull every <loc> path out of the sitemap.
function routesFromSitemap() {
  const xml = readFileSync(SITEMAP, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const paths = locs.map((u) => { try { return new URL(u).pathname; } catch { return null; } })
    .filter(Boolean);
  return [...new Set(paths)];
}

function outPathFor(route) {
  const clean = route.replace(/\/+$/, '');
  return clean === '' ? join(BUILD_DIR, 'index.html') : join(BUILD_DIR, clean, 'index.html');
}

async function run() {
  if (!existsSync(join(BUILD_DIR, 'index.html'))) {
    console.error(`No ${BUILD_DIR}/index.html — run "vite build" first.`);
    process.exit(1);
  }
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    console.error('puppeteer not installed. Run: npm install --save-dev puppeteer');
    process.exit(1);
  }

  const routes = routesFromSitemap();
  console.log(`Prerendering ${routes.length} routes...`);

  const server = await startServer();
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  let ok = 0, fail = 0;

  for (const route of routes) {
    const page = await browser.newPage();
    try {
      await page.goto(`${ORIGIN}${route}`, { waitUntil: 'networkidle0', timeout: 45000 });
      // Wait until React has mounted real content (an <h1> or article body).
      await page.waitForFunction(
        () => document.querySelector('#root')?.children.length > 0 &&
              (document.querySelector('h1') || document.querySelector('article') || document.querySelector('main')),
        { timeout: 15000 }
      ).catch(() => {});
      const html = await page.content();
      const out = outPathFor(route);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, html);
      console.log(`  ✓ ${route}`);
      ok++;
    } catch (err) {
      console.log(`  ✗ ${route} — ${err.message}`);
      fail++;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();
  console.log(`\nPrerender done. ${ok} ok, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

run();
