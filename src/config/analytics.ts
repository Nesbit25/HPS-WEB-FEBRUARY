/**
 * Google Analytics 4 + Google Tag Manager configuration.
 *
 * These IDs are PUBLIC (they ship in the page), so they can live in code or in
 * Vercel env vars. To activate tracking, set EITHER:
 *   - Vercel env vars  VITE_GA4_MEASUREMENT_ID  and  VITE_GTM_CONTAINER_ID, or
 *   - the fallback constants below.
 *
 * GA4 Measurement ID format: G-XXXXXXXXXX   (GA4 → Admin → Data Streams → Web)
 * GTM Container ID format:    GTM-XXXXXXX    (Tag Manager → top of workspace)
 *
 * NOTE: GA4 is loaded directly via gtag (see utils/initAnalytics.ts). Do NOT
 * also add a GA4 Configuration tag inside GTM, or page views double-count.
 */
const ENV = import.meta.env as Record<string, string | undefined>;

export const GA4_MEASUREMENT_ID = ENV.VITE_GA4_MEASUREMENT_ID || ''; // e.g. 'G-XXXXXXXXXX'
export const GTM_CONTAINER_ID = ENV.VITE_GTM_CONTAINER_ID || ''; // e.g. 'GTM-XXXXXXX'

export const GA4_ENABLED = /^G-[A-Z0-9]+$/i.test(GA4_MEASUREMENT_ID);
export const GTM_ENABLED = /^GTM-[A-Z0-9]+$/i.test(GTM_CONTAINER_ID);
