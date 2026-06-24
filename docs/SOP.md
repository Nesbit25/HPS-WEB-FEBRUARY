# Hanemann Plastic Surgery — Website Operations SOP

**Maintained by:** Crescendo Media
**Live site:** https://hanemannplasticsurgery.com
**Last updated:** June 2026

This document explains how the website works, how to operate the admin portal,
how changes are deployed, and a running log of changes. Keep it current as the
site evolves.

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
| Admin portal | `https://hanemannplasticsurgery.com/admin/login` |
| Primary admin login | `Drh@hanemannplasticsurgery.com` (password stored in Supabase Auth only) |
| Analytics (Google) | GA4 — `G-H5JT171977` |
| Gallery photos | Private GitHub repo, served via image proxy |

---

## 2. Tech Stack & Architecture

- **Front end:** React 18 + TypeScript, built with Vite. It is a **single-page
  app (SPA)** — the browser loads one HTML shell and JavaScript renders every
  page. Google reads it fine; some non-JavaScript crawlers see less (see §9).
- **Hosting:** **Vercel.** Every push to the `main` branch triggers an automatic
  build and deploy. Build command `vite build`, output folder `build`.
- **Back end:** a single **Supabase Edge Function** (Deno/Hono) named
  `make-server-fc862019`, in `src/supabase/functions/server/index.tsx`. It
  handles inquiries, content edits, gallery data, blog, PDFs, and analytics.
  ⚠️ **The edge function does NOT auto-deploy** — it must be redeployed manually
  (see §7.2).
- **Database:** Supabase Postgres. Most data lives in one key/value table,
  `kv_store_fc862019` (e.g. `inquiry_*`, `gallery_case_*`, `analytics_session_*`,
  `analytics_event_*`, `content/*`).
- **Gallery images:** stored in a **private GitHub repo** and served to the site
  through an image-proxy endpoint on the edge function (so the photos are never
  publicly listable).

---

## 3. Admin Portal

### 3.1 Logging in
1. Go to `https://hanemannplasticsurgery.com/admin/login`.
2. Sign in with `Drh@hanemannplasticsurgery.com`. The password is set in the
   Supabase dashboard (Authentication → Users) — **it is never stored in code**.
3. Only emails on the allow-list (`ADMIN_EMAILS` in the edge function and
   `AuthContext.tsx`) can access admin features. Add a teammate by (a) creating
   their Supabase Auth user and (b) adding their email to both allow-lists, then
   redeploying the edge function.

### 3.2 Admin tabs
| Tab | What it does |
|---|---|
| **Inquiries** | Every consultation/contact request, newest first, with a **date + time** stamp, status (new / contacted), and a delete button for spam/tests. |
| **Schedule** | Scheduling view. |
| **Analytics** | Live first-party traffic dashboard with a date-range picker (see §8). |
| **Blog** | Manage blog posts. (Note: the public blog currently renders the static + recovered posts; see §6.) |
| **PDFs** | Upload/manage downloadable PDFs (e.g. patient forms PDF). |
| **Photos** | The before/after gallery manager — add cases, add views, set order. |

> The **Patient Forms** admin tab was removed (the online-forms feature is
> retired). A downloadable **Patient Forms (PDF)** link remains in the header/
> footer, pointing at `/patient-forms.pdf` (drop the file in `public/`).

### 3.3 Editing page content inline
When logged in as admin, much of the site text and images are **editable in
place** (the `EditableText` / `EditableImage` components). Click the element,
edit, and it saves to the `content/*` keys in the database — no code deploy
needed for copy/image changes.

### 3.4 Managing the gallery (Photos tab)
- **Add a case:** choose the category/procedure, upload the before/after photos
  for each view; the case appears as a card.
- **Multiple views:** each case supports multiple orientations/views; use the
  per-view Replace and Remove buttons.
- **Ordering:** each card has a **position dropdown** ("Pos n / total") — pick
  the number to place the case at that spot. Numbering shown to patients matches
  the on-screen order for the selected category.

---

## 4. Inquiries (Lead Handling)

- Consultation and contact submissions are saved as `inquiry_*` records with a
  server-side timestamp and a `status` of `new`.
- They appear in the **Inquiries** tab (newest first) with full date + time.
- Work each lead and set its status to **contacted**. Delete obvious spam/tests.
- Submitting a consultation also fires a **GA4 `generate_lead`** event for
  Google Analytics conversion reporting.

---

## 5. Deployment Process

### 5.1 Front-end changes (most changes)
Anything in the React app (pages, components, styles, blog data, SEO config):
1. Commit and push to the `main` branch on GitHub.
2. Vercel automatically builds and deploys (~1–2 minutes).
No manual step beyond the push.

### 5.2 Edge-function changes (backend)
Changes to `src/supabase/functions/server/index.tsx` require a **manual deploy**:
1. Copy the full contents of `src/supabase/functions/server/index.tsx`.
2. Supabase Dashboard → **Edge Functions** → `make-server-fc862019` → Edit code.
3. Select all, paste, **Deploy**.

### 5.3 Database changes
Schema/function changes (migrations) are applied in the Supabase SQL editor or
via tooling. They take effect immediately and are independent of the edge-
function deploy.

---

## 6. Blog & Content Library

- The public blog lives at **`/blog/<slug>`**, with the index/listing page at
  **`/resources`** (labeled "Patient Resources & Education").
- **38 posts total:** 6 original hand-written posts + **32 legacy posts
  recovered from the Internet Archive** (Wayback Machine) after the WordPress
  migration.
- Posts are stored as **static data** in:
  - `src/components/data/blogPosts.ts` (original posts)
  - `src/components/data/importedBlogPosts.ts` (recovered posts — auto-generated)
- A discreet, crawlable **"Resources"** link sits in the footer copyright bar so
  the library is reachable by visitors and search engines without a prominent
  nav tab.
- **To regenerate the recovered posts** (e.g. after recovering more): run the
  scripts in `scripts/` — `wayback-import.mjs` (pull content) then
  `build-blog-from-wayback.mjs` (clean + emit the TS data file).

---

## 7. SEO Setup

- **301 redirects:** `vercel.json` maps ~170 old WordPress URLs (procedures,
  gallery, blog posts) to their new homes so old links and search results land
  correctly.
- **Sitemap:** `public/sitemap.xml` lists all public pages + every blog post.
- **robots.txt:** `public/robots.txt` allows crawling, disallows `/admin` and
  internal paths, and points to the sitemap.
- **Per-page meta + canonical:** handled by `SEOHead` (react-helmet-async). Each
  page sets its own title, description, and a single correct canonical URL.
- **Structured data:** MedicalBusiness / Physician / Organization schema site-
  wide, plus Article + FAQ schema on relevant pages.
- **Known limitation (SPA):** non-JavaScript crawlers and some social link
  scrapers see a thin page. Google renders JS so it is unaffected. A prerender
  approach was evaluated and parked (`scripts/prerender.mjs`); revisit if Bing/
  AI-crawler/social-preview visibility becomes a priority.

---

## 8. Analytics

### 8.1 What's running
- **First-party tracking** (`src/hooks/useAnalytics.tsx`) logs every session,
  page view, and key event to Supabase — this powers the in-app Analytics tab.
- **Google Analytics 4** (`G-H5JT171977`) is installed via
  `src/config/analytics.ts` + `src/utils/initAnalytics.ts`. Page views and the
  consultation `generate_lead` conversion are forwarded to GA4.
- **Google Tag Manager** is wired but inactive until a container ID is set
  (`VITE_GTM_CONTAINER_ID` env var, or the constant in `config/analytics.ts`).
  ⚠️ Do not also add a GA4 tag inside GTM — page views would double-count.

### 8.2 The Analytics tab
- **Date-range picker:** preset chips (Today / 7d / 30d / Since launch / All) and
  a custom two-month **calendar** range. All metrics recalculate for the window.
- **Cards:** Active Now (last 30 min), Sessions, Page Views, Inquiries (with
  conversion %). Plus Popular Pages, Traffic Sources, and Device Breakdown.
- **Conversion rate** = inquiries ÷ sessions for the selected window.
- The dashboard reads a Postgres function, `analytics_summary_fc862019(start,
  end)`, so counts are accurate and uncapped (see the §10 changelog for why this
  matters).

### 8.3 Demographics & geography
- True visitor **demographics** (age/gender/interests) and **geography** come
  from **GA4**, not the in-app tab. Enable **Google Signals** in GA4 (Admin →
  Data collection) to populate the Demographics reports. Location is available in
  GA4 by default. (Demographic data is aggregated and threshold-limited, so it is
  sparse at low traffic.)

---

## 9. Common Operational Tasks

| Task | How |
|---|---|
| Edit page text/images | Log into admin, click the element inline, save. |
| Add a gallery case | Admin → Photos → add case, upload views, set position. |
| Respond to a lead | Admin → Inquiries → work it, set status to "contacted". |
| Check traffic | Admin → Analytics → pick a date range. |
| Publish front-end change | Push to `main`; Vercel deploys automatically. |
| Deploy a backend change | Paste `index.tsx` into the Supabase edge function (§5.2). |
| Recover/regenerate blog | Run the `scripts/` Wayback importers (§6). |
| View demographics/geo | Google Analytics (GA4), with Google Signals enabled. |

---

## 10. Change Log

Recent work, most recent first:

- **Get Directions fix** — the Contact page button did nothing; now opens Google
  Maps directions to 5233 Dijon Drive, Baton Rouge, LA 70808.
- **Analytics date-range picker** — preset chips + custom calendar; metrics are
  range-aware; added an Inquiries card. New parameterized SQL summary function.
- **Analytics data-accuracy fix** — the dashboard had been reading the **oldest
  1,000 rows** (dev-era data) because the query had no sort/limit, so all
  "last 24h" numbers read 0. Replaced with a Postgres aggregation function that
  counts the full data set; the Sessions tab now fetches newest-first.
- **Inquiry timestamps** — admin inquiry cards now show full date **and time**.
- **GA4 + GTM** — installed Google Analytics (`G-H5JT171977`); GTM scaffolding
  ready for a container ID; page views + lead conversions forwarded.
- **Patient Forms admin tab removed.**
- **Discreet footer "Resources" link** — makes the recovered blog library
  reachable/crawlable without a prominent nav tab.
- **Blog content recovery** — 32 legacy posts recovered from the Wayback Machine,
  rendered at `/blog/<slug>`, indexed at `/resources`, added to the sitemap, and
  301-redirected from their old WordPress URLs.
- **Site-wide SEO fixes** — removed a duplicate/conflicting canonical tag that
  pointed every page at the homepage; added H1s to procedure pages; fixed
  doubled-brand `<title>` tags on several pages.
- **SEO migration** — real `index.html` meta, `robots.txt`, `sitemap.xml`,
  per-page SEO via `SEOHead`, and ~170 301 redirects from old WordPress URLs.
- **Social links** — real Facebook (`facebook.com/plasticBR`) and Instagram
  (`instagram.com/hanemannplasticsurgery`) links; LinkedIn removed.
- **Consultation dialog fix** — the final step no longer auto-submits before the
  visitor fills it out; the form resets between opens.
- **Gallery** — replaced drag-reorder with a position dropdown; fixed "add
  views" upload; new cases appear correctly; case numbering matches on-screen
  order; procedure name matches the page.
- **Inquiries** — added delete (remove test/spam) and fixed the inquiry-id bug.
- **Security hardening (Step 1)** — centralized admin authorization, locked CORS
  to production domains, removed sign-up/patient-portal backdoors, and tightened
  caching. Admin email allow-list anchors access; the admin password lives only
  in Supabase.

---

## 11. Notes & Cautions

- **Never commit secrets** (the admin password, GitHub token, Supabase service
  key). The admin password is set only in Supabase Auth.
- **Edge function = manual deploy.** Front-end pushes are automatic; backend
  changes are not. Forgetting to redeploy the edge function is the most common
  "why didn't my change take effect" cause.
- **Admin email allow-list** must be updated in **two** places (the edge
  function and `AuthContext.tsx`) when adding/removing an admin.
