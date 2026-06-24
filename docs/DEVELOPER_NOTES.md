# Hanemann Plastic Surgery — Developer / Maintenance Notes

**Audience:** Crescendo Media (technical maintainers). Office-staff instructions
live in `docs/SOP.md`.
**Last updated:** June 2026

---

## 1. Quick Reference

| Item | Value |
|---|---|
| Production domain | `hanemannplasticsurgery.com` |
| Hosting | Vercel (auto-deploys on push to `main`) |
| Code repo | GitHub — `Nesbit25/HPS-WEB-FEBRUARY` (branch `main`) |
| Backend | Supabase Edge Function `make-server-fc862019` |
| Supabase project ref | `jrzzakhpyoujpfrjllrh` |
| Database | Supabase Postgres — key/value table `kv_store_fc862019` |
| Admin allow-list email | `Drh@hanemannplasticsurgery.com` (password in Supabase Auth only) |
| Analytics (GA4) | `G-H5JT171977` |
| Gallery photos | Private GitHub repo, served via image proxy |

---

## 2. Architecture

- **Front end:** React 18 + TypeScript, built with Vite — a client-rendered SPA.
- **Hosting:** Vercel. Push to `main` → automatic build (`vite build`, output
  `build/`) and deploy.
- **Back end:** one Supabase Edge Function (Deno/Hono) at
  `src/supabase/functions/server/index.tsx` (`make-server-fc862019`).
- **Database:** Supabase Postgres, mostly one KV table `kv_store_fc862019`
  (`inquiry_*`, `gallery_case_*`, `analytics_session_*`, `analytics_event_*`,
  `content/*`, etc.).
- **Gallery images:** private GitHub repo, served via an image-proxy endpoint
  using a `GITHUB_TOKEN`.
- **Admin auth:** Supabase Auth; an `ADMIN_EMAILS` allow-list gates admin
  endpoints. The allow-list exists in **two** places — the edge function and
  `src/contexts/AuthContext.tsx` — keep them in sync.

---

## 3. Deployment

- **Front-end:** commit + push to `main`; Vercel auto-deploys.
- **Edge function (manual):** copy `src/supabase/functions/server/index.tsx` →
  Supabase Dashboard → Edge Functions → `make-server-fc862019` → paste → Deploy.
  **This is the most common "change didn't take effect" cause.**
- **DB migrations:** applied via Supabase SQL editor / tooling; effective
  immediately, independent of the edge-function deploy.
- `vercel.json` holds the build config, 301 redirects, and SPA rewrites.
- A prerender path (`scripts/prerender.mjs` + `build:prerender`) exists but is
  **parked** — build-time headless Chrome fails in Vercel's container; revisit
  with `@sparticuz/chromium` only if non-JS crawler/social visibility matters.

---

## 4. Analytics internals

- First-party tracking: `src/hooks/useAnalytics.tsx` → edge function →
  `analytics_session_*` / `analytics_event_*` KV rows. A persistent visitor ID
  is **not** yet implemented (returning-visitor tracking is a possible add).
- Summary is computed by a Postgres function **`analytics_summary_fc862019(p_start,
  p_end)`** (returns range-scoped counts + breakdowns). The summary endpoint
  passes optional `?start&end` query params through to it.
  - ⚠️ Do **not** revert to computing the summary by loading rows via
    `kv.getByPrefix` — PostgREST caps that at ~1000 rows (oldest first), which is
    what made the dashboard show stale/zero data once the store grew.
- GA4 (`config/analytics.ts` + `utils/initAnalytics.ts`): page views + consult
  `generate_lead` forwarded. GTM is wired but needs a container ID
  (`VITE_GTM_CONTAINER_ID`); if enabling GA4 inside GTM, remove the direct gtag
  config to avoid double-counting.

---

## 5. SEO

- `index.html` holds only non-per-page tags; titles/description/canonical/OG are
  owned per-page by `SEOHead` (react-helmet-async). Avoid re-adding canonical/OG
  to `index.html` (caused duplicate canonicals previously).
- `vercel.json` → ~170 `301` redirects (old WordPress → new routes + blog).
- `public/sitemap.xml`, `public/robots.txt`.
- Structured data via `components/seo/*`.

---

## 6. Blog / content recovery

- Static data: `src/components/data/blogPosts.ts` (6 originals) +
  `importedBlogPosts.ts` (32 recovered, auto-generated). Rendered at
  `/blog/<slug>`; index at `/resources`.
- Regenerate recovered posts: `scripts/wayback-import.mjs` →
  `scripts/build-blog-from-wayback.mjs`.

---

## 7. Change Log

Most recent first:

- **Get Directions fix** — Contact page button now opens Google Maps directions.
- **Analytics date-range picker** — presets + custom calendar; range-aware cards;
  parameterized `analytics_summary_fc862019(start,end)`.
- **Analytics data-accuracy fix** — replaced 1000-row-capped `getByPrefix`
  computation with a Postgres aggregation function; Sessions tab fetches
  newest-first.
- **Inquiry timestamps** shown with date + time; GA4 + GTM installed.
- **Patient Forms admin tab removed.**
- **Discreet footer "Resources" link** (crawlable) to the blog library.
- **Blog content recovery** — 32 Wayback posts → `/blog`, `/resources`, sitemap,
  301s.
- **Site-wide SEO fixes** — removed duplicate homepage-pointing canonical; added
  H1s to procedure pages; fixed doubled-brand titles.
- **SEO migration** — `index.html` meta, robots, sitemap, `SEOHead`, ~170 301s.
- **Real social links**; **consultation dialog auto-submit fix**; **gallery**
  position-dropdown + upload/numbering fixes; **inquiry delete** + id fix.
- **Security hardening (Step 1)** — admin authorization chokepoint, CORS locked
  to production domains, removed sign-up/patient-portal backdoors.
