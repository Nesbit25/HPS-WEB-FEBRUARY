import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit2, Trash2, Download, FileText, Upload } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface PDFManagerProps {
  accessToken: string;
}

interface PDFResource {
  id: string;
  title: string;
  description: string;
  category: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  uploadedAt: string;
  downloadCount: number;
}

export function PDFManager({ accessToken }: PDFManagerProps) {
  const [pdfs, setPdfs] = useState<PDFResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Pre-Op Guide',
    file: null as File | null
  });

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/pdf-resources`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (data.pdfs) {
        setPdfs(data.pdfs);
      }
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleUploadPDF = async () => {
    if (!formData.title || !formData.file) {
      alert('Please provide a title and select a PDF file');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(formData.file);
      
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        const response = await fetch(`${serverUrl}/pdf-resources`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            fileName: formData.file!.name,
            fileData: base64Data,
            fileSize: formatFileSize(formData.file!.size)
          })
        });

        if (response.ok) {
          alert('PDF uploaded successfully!');
          setUploadDialogOpen(false);
          resetForm();
          fetchPDFs();
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
      };

      reader.onerror = () => {
        alert('Error reading file');
      };
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Failed to upload PDF');
    }
    setLoading(false);
  };

  const handleDeletePDF = async (id: string) => {
    if (!confirm('Are you sure you want to delete this PDF?')) {
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/pdf-resources/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        alert('PDF deleted!');
        fetchPDFs();
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Pre-Op Guide',
      file: null
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const categories = [
    'Pre-Op Guide',
    'Post-Op Instructions',
    'Financing Information',
    'Procedure Overview',
    'Recovery Timeline',
    'General Information'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2">PDF Resources</h2>
          <p className="text-muted-foreground">Manage patient education PDFs</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Upload PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload PDF Resource</DialogTitle>
              <DialogDescription>
                Upload a PDF document to the Resources section. Patients can view and download these files.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Pre-Op Instructions for Rhinoplasty"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed pre-operative instructions for patients undergoing rhinoplasty..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>PDF File * (Max 10MB)</Label>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/20 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-2 text-muted-foreground" />
                      {formData.file ? (
                        <div className="text-center">
                          <p className="text-sm">{formData.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(formData.file.size)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Click to select PDF or drag and drop
                        </p>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="application/pdf"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleUploadPDF} 
                  disabled={loading || !formData.file}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setUploadDialogOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* PDFs List */}
      {loading ? (
        <p>Loading...</p>
      ) : pdfs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No PDF resources yet. Upload your first document!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pdfs.map((pdf) => (
            <Card key={pdf.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="mb-2">{pdf.title}</h3>
                    {pdf.description && (
                      <p className="text-sm text-muted-foreground mb-3">{pdf.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="px-2 py-1 bg-secondary/20 rounded">{pdf.category}</span>
                      <span>{pdf.fileSize}</span>
                      <span>{pdf.downloadCount || 0} downloads</span>
                      <span>Uploaded {new Date(pdf.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(pdf.fileUrl, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePDF(pdf.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
