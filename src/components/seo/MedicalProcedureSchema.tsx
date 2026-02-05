import React from 'react';
import { Helmet } from 'react-helmet-async';

interface MedicalProcedureSchemaProps {
  name: string;
  alternateName?: string;
  description: string;
  bodyLocation: string;
  procedureType: 'Surgical' | 'Noninvasive';
  preparation?: string;
  followup?: string;
  howPerformed?: string;
  typicalRecoveryTime?: string;
}

export function MedicalProcedureSchema({
  name,
  alternateName,
  description,
  bodyLocation,
  procedureType,
  preparation,
  followup,
  howPerformed,
  typicalRecoveryTime
}: MedicalProcedureSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    "name": name,
    ...(alternateName && { "alternateName": alternateName }),
    "description": description,
    "bodyLocation": bodyLocation,
    "procedureType": procedureType,
    "medicalSpecialty": "Plastic Surgery",
    ...(preparation && { "preparation": preparation }),
    ...(followup && { "followup": followup }),
    ...(howPerformed && { "howPerformed": howPerformed }),
    ...(typicalRecoveryTime && { "typicalRecoveryTime": typicalRecoveryTime }),
    "performer": {
      "@type": "Physician",
      "name": "Dr. Michael Hanemann",
      "medicalSpecialty": "Plastic Surgery",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "5233 Dijon Dr",
        "addressLocality": "Baton Rouge",
        "addressRegion": "LA",
        "postalCode": "70808",
        "addressCountry": "US"
      }
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
