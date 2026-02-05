import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { projectId } from '../../utils/supabase/info';
import { FileText, ChevronDown, ChevronRight, Clock, Calendar, User, Eye, Printer, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface PatientFormsManagerProps {
  accessToken: string;
}

interface FormSubmission {
  id: string;
  patientName: string;
  formType: string;
  formTitle: string;
  timestamp: string;
  status: string;
  [key: string]: any;
}

interface PatientGroup {
  patientName: string;
  forms: FormSubmission[];
  lastSubmission: string;
}

export function PatientFormsManager({ accessToken }: PatientFormsManagerProps) {
  const [groupedForms, setGroupedForms] = useState<PatientGroup[]>([]);
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [selectedForm, setSelectedForm] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/patient-forms`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (data.groupedByPatient) {
        setGroupedForms(data.groupedByPatient);
      }
    } catch (error) {
      console.error('Error fetching patient forms:', error);
    }
    setLoading(false);
  };

  const updateFormStatus = async (formId: string, status: string, notes?: string) => {
    try {
      await fetch(`${serverUrl}/patient-forms/${formId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      });
      fetchForms();
      if (selectedForm && selectedForm.id === formId) {
        setSelectedForm({ ...selectedForm, status, notes });
      }
    } catch (error) {
      console.error('Error updating form status:', error);
    }
  };

  const togglePatient = (patientName: string) => {
    const newExpanded = new Set(expandedPatients);
    if (newExpanded.has(patientName)) {
      newExpanded.delete(patientName);
    } else {
      newExpanded.add(patientName);
    }
    setExpandedPatients(newExpanded);
  };

  const viewForm = (form: FormSubmission) => {
    setSelectedForm(form);
    setViewDialogOpen(true);
  };

  const viewFormPDF = async (formId: string) => {
    console.log('Attempting to view PDF for form:', formId);
    const pdfUrl = `${serverUrl}/patient-forms/${formId}/pdf`;
    
    // Open window IMMEDIATELY (before async fetch) to avoid popup blocker
    const pdfWindow = window.open('about:blank', '_blank');
    
    if (!pdfWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site and try again.');
      return;
    }
    
    // Show loading message in the new window
    pdfWindow.document.write(`
      <html>
        <head><title>Loading PDF...</title></head>
        <body style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #faf9f7;">
          <div style="text-align: center;">
            <h2 style="color: #1a1f2e;">Loading Medical Record...</h2>
            <p style="color: #666;">Please wait...</p>
          </div>
        </body>
      </html>
    `);
    
    try {
      console.log('Fetching from:', pdfUrl);
      const response = await fetch(pdfUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        console.error('Response not OK:', response.status);
        const error = await response.json();
        pdfWindow.document.write(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 40px;">
              <h2 style="color: #dc2626;">Error Loading PDF</h2>
              <p>${error.error || 'Unknown error'}</p>
            </body>
          </html>
        `);
        return;
      }

      // Get the HTML content
      const htmlContent = await response.text();
      console.log('Received HTML length:', htmlContent.length);
      
      // Write the PDF content to the window
      pdfWindow.document.open();
      pdfWindow.document.write(htmlContent);
      pdfWindow.document.close();
      
      console.log('PDF loaded successfully');
    } catch (error) {
      console.error('Error fetching PDF:', error);
      pdfWindow.document.write(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px;">
            <h2 style="color: #dc2626;">Error Loading PDF</h2>
            <p>${error}</p>
          </body>
        </html>
      `);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'reviewed': 'bg-yellow-100 text-yellow-800',
      'processed': 'bg-green-100 text-green-800',
      'archived': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getFormTypeLabel = (formType: string) => {
    const labels: Record<string, string> = {
      'demographics': 'Demographics',
      'cosmetic-packet': 'Cosmetic Packet',
      'nicotine': 'Nicotine Statement',
      'privacy-consent': 'HIPAA Consent',
      'medical-clearance': 'Medical Clearance',
      'photo-consent': 'Photo Consent'
    };
    return labels[formType] || formType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const renderFormDetail = (form: FormSubmission) => {
    // Filter out system fields
    const systemFields = ['id', 'patientName', 'normalizedName', 'formType', 'formTitle', 'timestamp', 'status', 'notes'];
    const formFields = Object.entries(form).filter(([key]) => !systemFields.includes(key));

    // Field labels mapping for better display
    const fieldLabels: Record<string, string> = {
      firstName: 'First Name',
      lastName: 'Last Name',
      middleName: 'Middle Name',
      dob: 'Date of Birth',
      ssn: 'Social Security Number',
      address: 'Address',
      city: 'City',
      state: 'State',
      zip: 'ZIP Code',
      phone: 'Phone Number',
      phoneAlt: 'Alternate Phone',
      email: 'Email Address',
      emergencyName: 'Emergency Contact Name',
      emergencyPhone: 'Emergency Contact Phone',
      emergencyRelationship: 'Emergency Contact Relationship',
      primaryCarePhysician: 'Primary Care Physician',
      physicianPhone: 'Physician Phone',
      smokingStatus: 'Smoking Status',
      packYears: 'Pack Years',
      quitDate: 'Quit Date',
      vapeStatus: 'Vaping Status',
      desiredProcedures: 'Desired Procedures',
      concernAreas: 'Areas of Concern',
      medicalHistory: 'Medical History',
      currentMedications: 'Current Medications',
      allergies: 'Allergies',
      previousSurgeries: 'Previous Surgeries',
      nicotineAcknowledgment: 'Nicotine Acknowledgment',
      privacyConsent: 'Privacy Consent',
      photoConsent: 'Photo Consent',
      clearanceNotes: 'Clearance Notes'
    };

    return (
      <div className="space-y-3">
        {formFields.map(([key, value]) => {
          if (!value || value === '') return null;
          
          // Convert value to string if it's an object
          let displayValue: string;
          if (typeof value === 'boolean') {
            displayValue = value ? 'Yes' : 'No';
          } else if (typeof value === 'object') {
            displayValue = JSON.stringify(value, null, 2);
          } else {
            displayValue = String(value);
          }
          
          // Get the proper label
          const label = fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          
          return (
            <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-[#b8976a] mb-2 font-semibold">{label}</p>
              <p className="text-sm text-[#1a1f2e] whitespace-pre-wrap">{displayValue}</p>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading patient forms...</p>
      </div>
    );
  }

  if (groupedForms.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="font-serif text-2xl text-[#1a1f2e] mb-2">No Forms Yet</h3>
          <p className="text-gray-600">Patient form submissions will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl text-[#1a1f2e]">Patient Forms</h2>
          <p className="text-sm text-gray-600 mt-1">
            {groupedForms.length} patient{groupedForms.length !== 1 ? 's' : ''} with form submissions
          </p>
        </div>
        <Button
          onClick={fetchForms}
          variant="outline"
          className="border-[#1a1f2e] text-[#1a1f2e] hover:bg-[#1a1f2e] hover:text-white rounded-none"
        >
          Refresh
        </Button>
      </div>

      {groupedForms.map((patient) => {
        const isExpanded = expandedPatients.has(patient.patientName);
        
        return (
          <Card key={patient.patientName} className="border-l-4 border-l-[#c9b896]">
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => togglePatient(patient.patientName)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#c9b896]/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#c9b896]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[#1a1f2e] mb-1">
                      {patient.patientName}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {patient.forms.length} form{patient.forms.length !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Last: {formatDate(patient.lastSubmission)}
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="border-t">
                <div className="space-y-3 pt-4">
                  {patient.forms.map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-4 h-4 text-[#c9b896]" />
                          <span className="font-semibold text-[#1a1f2e]">
                            {form.formTitle || getFormTypeLabel(form.formType)}
                          </span>
                          <Badge className={getStatusBadge(form.status)}>
                            {form.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          Submitted: {formatDate(form.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={form.status}
                          onValueChange={(value) => updateFormStatus(form.id, value)}
                        >
                          <SelectTrigger className="w-32 rounded-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="processed">Processed</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => viewForm(form)}
                          className="bg-[#1a1f2e] text-white hover:bg-[#2d3548] rounded-none"
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={() => viewFormPDF(form.id)}
                          className="bg-[#1a1f2e] text-white hover:bg-[#2d3548] rounded-none"
                        >
                          View PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Form Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#1a1f2e]">
              {selectedForm?.formTitle || 'Form Details'}
            </DialogTitle>
            <DialogDescription>
              Submitted by {selectedForm?.patientName} on {selectedForm?.timestamp && formatDate(selectedForm.timestamp)}
            </DialogDescription>
          </DialogHeader>

          {selectedForm && (
            <div className="space-y-6">
              {/* Status and Notes */}
              <div className="border-t border-b py-4 space-y-4">
                <div>
                  <Label className="text-[#1a1f2e] mb-2 block">Status</Label>
                  <Select
                    value={selectedForm.status}
                    onValueChange={(value) => updateFormStatus(selectedForm.id, value, selectedForm.notes)}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#1a1f2e] mb-2 block">Admin Notes</Label>
                  <Textarea
                    value={selectedForm.notes || ''}
                    onChange={(e) => setSelectedForm({ ...selectedForm, notes: e.target.value })}
                    onBlur={() => updateFormStatus(selectedForm.id, selectedForm.status, selectedForm.notes)}
                    placeholder="Add internal notes about this submission..."
                    rows={3}
                    className="rounded-none"
                  />
                </div>
              </div>

              {/* Form Data */}
              <div>
                <h4 className="font-serif text-lg text-[#1a1f2e] mb-4">Form Data</h4>
                {renderFormDetail(selectedForm)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}