// Comprehensive Schema.org structured data for SEO and AI Overviews

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "@id": "https://hanemannplasticsurgery.com/#organization",
  "name": "Hanemann Plastic Surgery",
  "alternateName": "Dr. Michael Hanemann Plastic Surgery",
  "url": "https://hanemannplasticsurgery.com",
  "logo": "https://hanemannplasticsurgery.com/logo-full.png",
  "image": "https://hanemannplasticsurgery.com/office.jpg",
  "description": "Board-certified plastic surgeon Dr. Michael Hanemann specializes in aesthetic and reconstructive surgery including rhinoplasty, facelift, breast augmentation, and body contouring in Baton Rouge, Louisiana.",
  "priceRange": "$$$$",
  "telephone": "+1-225-766-2166",
  "email": "info@hanemannplasticsurgery.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "5233 Dijon Drive",
    "addressLocality": "Baton Rouge",
    "addressRegion": "LA",
    "postalCode": "70808",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 30.4515,
    "longitude": -91.1871
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "17:00"
    }
  ],
  "sameAs": [
    "https://www.facebook.com/hanemannplasticsurgery",
    "https://www.instagram.com/hanemannplasticsurgery",
    "https://www.linkedin.com/company/hanemann-plastic-surgery"
  ],
  "medicalSpecialty": [
    "PlasticSurgery",
    "Dermatology"
  ],
  "hasMap": "https://maps.google.com/?q=5233+Dijon+Drive,+Baton+Rouge,+LA+70808"
};

export const physicianSchema = {
  "@context": "https://schema.org",
  "@type": "Physician",
  "@id": "https://hanemannplasticsurgery.com/#physician",
  "name": "Dr. Michael S. Hanemann Jr.",
  "honorificPrefix": "Dr.",
  "givenName": "Michael",
  "familyName": "Hanemann",
  "honorificSuffix": "MD",
  "image": "https://hanemannplasticsurgery.com/dr-hanemann.jpg",
  "jobTitle": "Board-Certified Plastic Surgeon",
  "worksFor": {
    "@id": "https://hanemannplasticsurgery.com/#organization"
  },
  "medicalSpecialty": [
    {
      "@type": "MedicalSpecialty",
      "name": "Plastic Surgery"
    },
    {
      "@type": "MedicalSpecialty", 
      "name": "Otolaryngology"
    }
  ],
  "alumniOf": [
    {
      "@type": "EducationalOrganization",
      "name": "Louisiana State University School of Medicine"
    },
    {
      "@type": "EducationalOrganization",
      "name": "University of North Carolina at Chapel Hill"
    },
    {
      "@type": "EducationalOrganization",
      "name": "University of Alabama at Birmingham"
    }
  ],
  "award": [
    "American Board of Plastic Surgery Certification",
    "American Board of Otolaryngology – Head and Neck Surgery Certification"
  ],
  "memberOf": [
    {
      "@type": "Organization",
      "name": "American Society of Plastic Surgeons"
    },
    {
      "@type": "Organization",
      "name": "Louisiana Society of Plastic Surgeons"
    }
  ],
  "description": "Double board-certified plastic surgeon specializing in aesthetic and reconstructive surgery with over 15 years of experience in Baton Rouge, Louisiana."
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://hanemannplasticsurgery.com/#website",
  "url": "https://hanemannplasticsurgery.com",
  "name": "Hanemann Plastic Surgery",
  "description": "Board-certified plastic surgeon in Baton Rouge offering rhinoplasty, facelift, breast augmentation, and body contouring procedures.",
  "publisher": {
    "@id": "https://hanemannplasticsurgery.com/#organization"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://hanemannplasticsurgery.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const faqSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

export const medicalProcedureSchema = (procedure: {
  name: string;
  description: string;
  procedureType?: string;
  followup?: string;
  preparation?: string;
  howPerformed?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "MedicalProcedure",
  "name": procedure.name,
  "description": procedure.description,
  "procedureType": procedure.procedureType || "Surgical",
  "followup": procedure.followup,
  "preparation": procedure.preparation,
  "howPerformed": procedure.howPerformed,
  "performer": {
    "@id": "https://hanemannplasticsurgery.com/#physician"
  }
});

export const reviewSchema = (reviews: Array<{
  author: string;
  rating: number;
  reviewBody: string;
  datePublished?: string;
}>) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://hanemannplasticsurgery.com/#organization",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length,
    "reviewCount": reviews.length,
    "bestRating": 5,
    "worstRating": 1
  },
  "review": reviews.map(review => ({
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": review.author
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": 5,
      "worstRating": 1
    },
    "reviewBody": review.reviewBody,
    "datePublished": review.datePublished || new Date().toISOString()
  }))
});

export const serviceSchema = (service: {
  name: string;
  description: string;
  serviceType: string;
  areaServed?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "MedicalService",
  "name": service.name,
  "description": service.description,
  "serviceType": service.serviceType,
  "provider": {
    "@id": "https://hanemannplasticsurgery.com/#organization"
  },
  "areaServed": {
    "@type": "City",
    "name": service.areaServed || "Baton Rouge, Louisiana"
  }
});

// Combined schema for homepage with all critical structured data
export const homepageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    localBusinessSchema,
    physicianSchema,
    websiteSchema,
    {
      "@type": "WebPage",
      "@id": "https://hanemannplasticsurgery.com/#webpage",
      "url": "https://hanemannplasticsurgery.com",
      "name": "Hanemann Plastic Surgery | Board-Certified Plastic Surgeon Baton Rouge",
      "isPartOf": {
        "@id": "https://hanemannplasticsurgery.com/#website"
      },
      "about": {
        "@id": "https://hanemannplasticsurgery.com/#organization"
      },
      "description": "Dr. Michael Hanemann, double board-certified plastic surgeon in Baton Rouge. Expert in rhinoplasty, facelift, breast augmentation, and body contouring.",
      "breadcrumb": {
        "@id": "https://hanemannplasticsurgery.com/#breadcrumb"
      }
    }
  ]
};