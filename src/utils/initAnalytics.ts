/**
 * Injects Google Tag Manager + GA4 (gtag.js) at app boot, and exposes helpers
 * to forward first-party events to Google. Everything no-ops safely until the
 * IDs in config/analytics.ts are set, so it's safe to ship before they exist.
 */
import {
  GA4_MEASUREMENT_ID,
  GTM_CONTAINER_ID,
  GA4_ENABLED,
  GTM_ENABLED,
} from '../config/analytics';

let initialized = false;

export function initAnalytics(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const w = window as any;
  w.dataLayer = w.dataLayer || [];

  // ---- Google Tag Manager ----
  if (GTM_ENABLED) {
    w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    const gtm = document.createElement('script');
    gtm.async = true;
    gtm.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
    document.head.appendChild(gtm);

    // <noscript> fallback iframe (GTM standard install)
    const ns = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    ns.appendChild(iframe);
    document.body.insertBefore(ns, document.body.firstChild);
  }

  // ---- GA4 via gtag.js ----
  if (GA4_ENABLED) {
    const ga = document.createElement('script');
    ga.async = true;
    ga.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(ga);

    w.gtag = w.gtag || function gtag() { w.dataLayer.push(arguments); };
    w.gtag('js', new Date());
    // We send page_view manually on each SPA route change (see useAnalytics).
    w.gtag('config', GA4_MEASUREMENT_ID, { send_page_view: false });
  }
}

/** Forward a custom event to GA4 + the GTM dataLayer. No-op until tags load. */
export function trackGA(event: string, params: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (typeof w.gtag === 'function') w.gtag('event', event, params);
  if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event, ...params });
}

/** Send an SPA page_view to GA4 + the dataLayer. */
export function trackGAPageView(path: string, title?: string): void {
  if (typeof window === 'undefined') return;
  const w = window as any;
  const payload = {
    page_path: path,
    page_location: window.location.href,
    page_title: title || document.title,
  };
  if (typeof w.gtag === 'function') w.gtag('event', 'page_view', payload);
  if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: 'page_view', ...payload });
}
