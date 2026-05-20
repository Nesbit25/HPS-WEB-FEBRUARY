import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  schemaMarkup?: any;
}

export function SEOHead({
  title,
  description,
  keywords,
  canonical,
  ogType = 'website',
  ogImage,
  schemaMarkup
}: SEOHeadProps) {
  const fullTitle = `${title} | Hanemann Plastic Surgery`;

  // Use the live origin (and current path) so share/copy actions always
  // generate a link to the site the visitor is actually on — not the old
  // production URL. Falls back to the canonical production domain during
  // SSR or any non-browser context.
  const PRODUCTION_ORIGIN = 'https://hanemannplasticsurgery.com';
  const runtimeOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : PRODUCTION_ORIGIN;
  const runtimePath =
    canonical ??
    (typeof window !== 'undefined' && window.location?.pathname
      ? window.location.pathname
      : '/');
  const fullCanonical = `${runtimeOrigin}${runtimePath}`;
  const resolvedOgImage = ogImage ?? `${runtimeOrigin}/og-image.jpg`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={resolvedOgImage} />
      <meta property="og:site_name" content="Hanemann Plastic Surgery" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedOgImage} />

      {/* Medical/Health Specific */}
      <meta name="application-name" content="Hanemann Plastic Surgery" />
      <meta name="author" content="Dr. Michael Hanemann, Board-Certified Plastic Surgeon" />
      
      {/* Mobile Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#1a1f2e" />

      {/* Schema Markup if provided */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
}
