import React from 'react';
import { Helmet } from 'react-helmet-async';

export function StructuredData() {
  // Medical Business Schema
  const medicalBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "@id": "https://hanemannplasticsurgery.com",
    "name": "Hanemann Plastic Surgery",
    "alternateName": "Dr. Hanemann Plastic Surgery",
    "description": "Board-certified plastic surgeon specializing in facial rejuvenation, rhinoplasty, breast augmentation, body contouring, and reconstructive surgery serving Baton Rouge, LA and surrounding areas.",
    "url": "https://hanemannplasticsurgery.com",
    "telephone": "+1-225-766-2166",
    "email": "drh@hanemannplasticsurgery.com",
    "image": "https://hanemannplasticsurgery.com/logo.png",
    "priceRange": "$$$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "5233 Dijon Dr",
      "addressLocality": "Baton Rouge",
      "addressRegion": "LA",
      "postalCode": "70808",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "30.4145",
      "longitude": "-91.1311"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "16:00"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/hanemannplasticsurgery",
      "https://www.instagram.com/hanemannplasticsurgery",
      "https://www.linkedin.com/company/hanemann-plastic-surgery"
    ],
    "medicalSpecialty": [
      "Plastic Surgery",
      "Cosmetic Surgery",
      "Reconstructive Surgery"
    ],
    "areaServed": [
      {
        "@type": "City",
        "name": "Baton Rouge",
        "containedIn": {
          "@type": "State",
          "name": "Louisiana"
        }
      },
      {
        "@type": "City",
        "name": "Prairieville"
      },
      {
        "@type": "City",
        "name": "Gonzales"
      },
      {
        "@type": "City",
        "name": "Denham Springs"
      }
    ]
  };

  // Physician Schema
  const physicianSchema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": "Dr. Michael Hanemann",
    "honorificPrefix": "Dr.",
    "jobTitle": "Double Board-Certified Plastic Surgeon",
    "description": "Double board-certified in Plastic Surgery and Otolaryngology with extensive training from LSU, UNC Chapel Hill, and UAB. Faculty member at LSU and Tulane Schools of Medicine.",
    "worksFor": {
      "@type": "MedicalBusiness",
      "name": "Hanemann Plastic Surgery"
    },
    "medicalSpecialty": [
      "Plastic Surgery",
      "Cosmetic Surgery",
      "Facial Plastic Surgery",
      "Reconstructive Surgery"
    ],
    "memberOf": [
      {
        "@type": "Organization",
        "name": "American Society of Plastic Surgeons"
      },
      {
        "@type": "Organization",
        "name": "American Board of Plastic Surgery"
      },
      {
        "@type": "Organization",
        "name": "American Board of Otolaryngology"
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
      "Double Board Certification - Plastic Surgery & Otolaryngology",
      "Faculty - LSU School of Medicine",
      "Faculty - Tulane School of Medicine"
    ]
  };

  // Website Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Hanemann Plastic Surgery",
    "url": "https://hanemannplasticsurgery.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://hanemannplasticsurgery.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Hanemann Plastic Surgery",
    "url": "https://hanemannplasticsurgery.com",
    "logo": "https://hanemannplasticsurgery.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-123-4567",
      "contactType": "Customer Service",
      "areaServed": "US",
      "availableLanguage": ["English"]
    }
  };

  return (
    <Helmet>
      {/* Medical Business Schema */}
      <script type="application/ld+json">
        {JSON.stringify(medicalBusinessSchema)}
      </script>

      {/* Physician Schema */}
      <script type="application/ld+json">
        {JSON.stringify(physicianSchema)}
      </script>

      {/* Website Schema */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>

      {/* Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
    </Helmet>
  );
}