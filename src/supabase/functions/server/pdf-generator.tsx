// PDF Generation Utility for Patient Forms
// Generates professional, print-ready PDFs for medical records

export function generateFormPDF(formData: any): string {
  const timestamp = new Date(formData.timestamp).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const patientName = formData.patientName || 
    `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 
    'Unknown Patient';

  // HTML template for PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      margin: 0;
      padding: 40px;
      color: #1a1f2e;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #c9b896;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-text {
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 2px;
      color: #1a1f2e;
      margin-bottom: 5px;
    }
    .tagline {
      font-size: 11px;
      letter-spacing: 4px;
      color: #c9b896;
      text-transform: uppercase;
    }
    .form-title {
      font-size: 24px;
      font-weight: bold;
      color: #1a1f2e;
      margin: 30px 0 10px 0;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 10px;
    }
    .form-meta {
      background: #faf9f7;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .meta-item {
      font-size: 13px;
    }
    .meta-label {
      font-weight: bold;
      color: #666;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1a1f2e;
      margin: 20px 0 15px 0;
      padding-bottom: 5px;
      border-bottom: 1px solid #c9b896;
    }
    .field {
      margin: 15px 0;
      page-break-inside: avoid;
    }
    .field-label {
      font-weight: bold;
      font-size: 13px;
      color: #555;
      margin-bottom: 5px;
    }
    .field-value {
      font-size: 14px;
      color: #1a1f2e;
      padding: 8px 12px;
      background: #f9f9f9;
      border-left: 3px solid #c9b896;
      min-height: 20px;
    }
    .checkbox-field {
      display: flex;
      align-items: center;
      margin: 10px 0;
    }
    .checkbox {
      width: 16px;
      height: 16px;
      border: 2px solid #1a1f2e;
      margin-right: 10px;
      display: inline-block;
      position: relative;
    }
    .checkbox.checked::after {
      content: "✓";
      position: absolute;
      top: -2px;
      left: 2px;
      font-size: 14px;
      font-weight: bold;
      color: #1a1f2e;
    }
    .signature-section {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    .signature-line {
      border-bottom: 2px solid #1a1f2e;
      margin: 30px 0 10px 0;
      width: 400px;
    }
    .signature-label {
      font-size: 12px;
      color: #666;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
      text-align: center;
      font-size: 11px;
      color: #999;
    }
    .disclaimer {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .page-break { page-break-after: always; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-text">HANEMANN</div>
    <div class="tagline">PLASTIC SURGERY</div>
    <div style="font-size: 12px; color: #666; margin-top: 10px;">
      Baton Rouge, Louisiana | (225) 766-2166
    </div>
  </div>

  <div class="form-title">${formData.formTitle || formData.formType || 'Patient Form'}</div>

  <div class="form-meta">
    <div class="meta-item">
      <span class="meta-label">Patient Name:</span> ${patientName}
    </div>
    <div class="meta-item">
      <span class="meta-label">Submission Date:</span> ${timestamp}
    </div>
    <div class="meta-item">
      <span class="meta-label">Form Type:</span> ${formData.formType || 'N/A'}
    </div>
    <div class="meta-item">
      <span class="meta-label">Form ID:</span> ${formData.id || 'N/A'}
    </div>
  </div>

  ${generateFormContent(formData)}

  <div class="signature-section">
    <p><strong>Electronic Signature Confirmation</strong></p>
    <p style="font-size: 13px; color: #666;">
      This form was completed and submitted electronically on ${timestamp}.
      ${formData.userId ? 'Submitted by authenticated patient account.' : 'Submitted as guest.'}
    </p>
    <div class="signature-line"></div>
    <div class="signature-label">Patient Signature (Electronic Submission)</div>
    <div style="margin-top: 30px;">
      <div class="signature-line"></div>
      <div class="signature-label">Date</div>
    </div>
  </div>

  <div class="footer">
    <p><strong>HANEMANN PLASTIC SURGERY</strong></p>
    <p>Baton Rouge, Louisiana | (225) 766-2166</p>
    <p>This is a legal medical record. Retain for compliance purposes.</p>
    <p style="margin-top: 10px;">Generated: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `;

  return html;
}

function generateFormContent(formData: any): string {
  let content = '';
  let currentSection = '';

  // Get all form fields excluding metadata and internal fields
  const excludeFields = ['id', 'formType', 'formTitle', 'timestamp', 'status', 'notes', 'userId', 'patientName', 'normalizedName', 'pdfUrl'];
  
  // Group fields by type for better organization
  const personalInfo = ['firstName', 'lastName', 'middleName', 'dob', 'ssn', 'email', 'phone', 'phoneAlt'];
  const contactInfo = ['address', 'city', 'state', 'zip'];
  const emergencyInfo = ['emergencyName', 'emergencyRelationship', 'emergencyPhone'];

  // Personal Information Section
  if (personalInfo.some(field => formData[field])) {
    content += `<div class="section">`;
    content += `<div class="section-title">Personal Information</div>`;
    personalInfo.forEach(field => {
      if (formData[field]) {
        content += formatField(field, formData[field]);
      }
    });
    content += `</div>`;
  }

  // Contact Information Section
  if (contactInfo.some(field => formData[field])) {
    content += `<div class="section">`;
    content += `<div class="section-title">Contact Information</div>`;
    contactInfo.forEach(field => {
      if (formData[field]) {
        content += formatField(field, formData[field]);
      }
    });
    content += `</div>`;
  }

  // Emergency Contact Section
  if (emergencyInfo.some(field => formData[field])) {
    content += `<div class="section">`;
    content += `<div class="section-title">Emergency Contact</div>`;
    emergencyInfo.forEach(field => {
      if (formData[field]) {
        content += formatField(field, formData[field]);
      }
    });
    content += `</div>`;
  }

  // Medical History & Other Fields
  const allPersonalFields = [...personalInfo, ...contactInfo, ...emergencyInfo, ...excludeFields];
  const otherFields = Object.keys(formData).filter(key => !allPersonalFields.includes(key));

  if (otherFields.length > 0) {
    content += `<div class="section">`;
    content += `<div class="section-title">Additional Information</div>`;
    otherFields.forEach(field => {
      content += formatField(field, formData[field]);
    });
    content += `</div>`;
  }

  return content;
}

function formatField(fieldName: string, value: any): string {
  const label = formatFieldLabel(fieldName);
  
  // Handle boolean/checkbox fields
  if (typeof value === 'boolean') {
    return `
      <div class="checkbox-field">
        <span class="checkbox ${value ? 'checked' : ''}"></span>
        <span>${label}</span>
      </div>
    `;
  }

  // Handle regular fields
  return `
    <div class="field">
      <div class="field-label">${label}</div>
      <div class="field-value">${escapeHtml(String(value))}</div>
    </div>
  `;
}

function formatFieldLabel(fieldName: string): string {
  // Convert camelCase to Title Case
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '&quot;',
    "'": '&#039;',
    '\n': '<br>'
  };
  return text.replace(/[&<>"'\n]/g, m => map[m]);
}