import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items = [] }: BreadcrumbsProps) {
  const baseUrl = 'https://hanemannplasticsurgery.com';
  
  // Don't render if no items
  if (!items || items.length === 0) {
    return null;
  }
  
  // Build BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      ...(item.href && { "item": `${baseUrl}${item.href}` })
    }))
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      
      <nav aria-label="Breadcrumb" className="container mx-auto px-6 py-4">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-4 h-4" />}
              {item.href && index < items.length - 1 ? (
                <a 
                  href={item.href} 
                  className="hover:text-secondary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    // Use your navigation function here if needed
                    window.history.pushState({}, '', item.href);
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <span className={index === items.length - 1 ? 'text-foreground' : ''}>
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}