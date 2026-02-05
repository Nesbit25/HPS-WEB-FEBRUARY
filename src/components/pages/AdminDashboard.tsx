import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { BarChart3, Users, Image, FileText, LogOut, Upload, Edit2, Trash2, Star, Eye, EyeOff, BookOpen, File } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { PhotoEditDialog } from '../cms/PhotoEditDialog';
import { ImageLocationSelector } from '../cms/ImageLocationSelector';
import { CircleAccent } from '../DecorativeElements';
import { Inbox, Clock, CheckCircle, Calendar, Home } from 'lucide-react';
import { BlogManager } from '../admin/BlogManager';
import { PDFManager } from '../admin/PDFManager';
import { PatientFormsManager } from '../admin/PatientFormsManager';
import { AnalyticsDashboard } from '../admin/AnalyticsDashboard';

interface AdminDashboardProps {
  accessToken: string;
  user: any;
  onLogout: () => void;
  onBackToWebsite?: () => void;
}

export function AdminDashboard({ accessToken, user, onLogout, onBackToWebsite }: AdminDashboardProps) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCategory, setPhotoCategory] = useState('before-after');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoDisplayLocation, setPhotoDisplayLocation] = useState('gallery');
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoStatus, setPhotoStatus] = useState('published');
  const [photoFeatured, setPhotoFeatured] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('inquiries');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // New event form
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    patient: '',
    procedure: '',
    notes: ''
  });

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  useEffect(() => {
    if (activeTab === 'inquiries') {
      fetchInquiries();
    } else if (activeTab === 'schedule') {
      fetchSchedule();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'photos') {
      fetchPhotos();
    }
  }, [activeTab]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/inquiries`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (data.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
    setLoading(false);
  };

  const updateInquiryStatus = async (id: string, status: string) => {
    try {
      await fetch(`${serverUrl}/inquiries/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      fetchInquiries();
    } catch (error) {
      console.error('Error updating inquiry:', error);
    }
  };

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/schedule`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (data.events) {
        setSchedule(data.events);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
    setLoading(false);
  };

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${serverUrl}/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEvent)
      });
      setNewEvent({ title: '', date: '', time: '', patient: '', procedure: '', notes: '' });
      fetchSchedule();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await fetch(`${serverUrl}/schedule/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      fetchSchedule();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      console.log('[AdminDashboard] Fetching analytics...');
      const response = await fetch(`${serverUrl}/analytics`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        console.error('[AdminDashboard] Analytics fetch failed:', response.status, response.statusText);
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[AdminDashboard] Analytics data received:', data);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty analytics to show zeros
      setAnalytics({
        totalInquiries: 0,
        newInquiries: 0,
        contactedInquiries: 0,
        inquiriesByProcedure: {},
        pageViews: {}
      });
    }
    setLoading(false);
  };

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/photos`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (data.photos) {
        setPhotos(data.photos);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
    setLoading(false);
  };

  const uploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile && !editingPhoto) return;

    try {
      if (editingPhoto) {
        // Update existing photo
        await fetch(`${serverUrl}/photos/${editingPhoto.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            category: photoCategory,
            caption: photoCaption,
            displayLocation: photoDisplayLocation,
            title: photoTitle,
            status: photoStatus,
            featured: photoFeatured
          })
        });

        setEditingPhoto(null);
        setPhotoFile(null);
        setPhotoTitle('');
        setPhotoCaption('');
        setPhotoCategory('before-after');
        setPhotoDisplayLocation('gallery');
        setPhotoStatus('published');
        setPhotoFeatured(false);
        fetchPhotos();
      } else {
        // Upload new photo
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          
          await fetch(`${serverUrl}/photos/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileName: photoFile.name,
              fileData: base64,
              category: photoCategory,
              caption: photoCaption,
              displayLocation: photoDisplayLocation,
              title: photoTitle,
              status: photoStatus,
              featured: photoFeatured
            })
          });

          setPhotoFile(null);
          setPhotoTitle('');
          setPhotoCaption('');
          setPhotoCategory('before-after');
          setPhotoDisplayLocation('gallery');
          setPhotoStatus('published');
          setPhotoFeatured(false);
          fetchPhotos();
        };
        reader.readAsDataURL(photoFile);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const deletePhoto = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      const response = await fetch(`${serverUrl}/photos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Delete failed: ${response.status}`);
      }
      
      alert('✅ Photo deleted successfully!');
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert(`❌ Failed to delete photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteAllPhotos = async () => {
    if (!confirm(`⚠️ This will delete ALL ${photos.length} photos. This cannot be undone. Continue?`)) return;
    
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const photo of photos) {
        try {
          const response = await fetch(`${serverUrl}/photos/${photo.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to delete photo ${photo.id}:`, response.status);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error deleting photo ${photo.id}:`, error);
        }
      }
      
      alert(`✅ Deleted ${successCount} photos successfully.\n${errorCount > 0 ? `❌ Failed to delete ${errorCount} photos.` : ''}`);
      fetchPhotos();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      alert('❌ Bulk delete failed');
    } finally {
      setLoading(false);
    }
  };

  const startEditPhoto = (photo: any) => {
    setEditingPhoto(photo);
    setEditDialogOpen(true);
  };

  const clearCorruptedImageData = async () => {
    if (!confirm('This will clear all corrupted image assignments. Continue?')) return;
    
    try {
      const response = await fetch(`${serverUrl}/content-debug/clear-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const result = await response.json();
      alert(result.message || 'Cleared corrupted data');
      console.log('Clear result:', result);
    } catch (error) {
      console.error('Error clearing corrupted data:', error);
      alert('Failed to clear corrupted data');
    }
  };

  const cancelEdit = () => {
    setEditingPhoto(null);
    setPhotoFile(null);
    setPhotoTitle('');
    setPhotoCaption('');
    setPhotoCategory('before-after');
    setPhotoDisplayLocation('gallery');
    setPhotoStatus('published');
    setPhotoFeatured(false);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CircleAccent size="sm" />
              <div>
                <h2 className="mb-0">Admin Portal</h2>
                <p className="text-sm text-muted-foreground">Hanemann Plastic Surgery</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm">{user.user_metadata?.name || user.email}</p>
                <p className="text-xs text-muted-foreground">Office Manager</p>
              </div>
              {onBackToWebsite && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackToWebsite}
                  className="rounded-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Website
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="rounded-full border-secondary text-secondary hover:bg-secondary hover:text-card"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-card p-1 rounded-2xl border border-border mb-8">
            <TabsTrigger value="inquiries" className="rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-card">
              <Inbox className="w-4 h-4 mr-2" />
              Inquiries
            </TabsTrigger>
            <TabsTrigger value="patient-forms" className="rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-card">
              <FileText className="w-4 h-4 mr-2" />
              Patient Forms
            </TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-card">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-card">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="blog" className="rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-card">
              <BookOpen className="w-4 h-4 mr-2" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="pdfs" className="rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-card">
              <File className="w-4 h-4 mr-2" />
              PDFs
            </TabsTrigger>
            <TabsTrigger value="photos" className="rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-card">
              <Upload className="w-4 h-4 mr-2" />
              Photos
            </TabsTrigger>
          </TabsList>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries">
            <Card className="border-border rounded-2xl">
              <CardHeader className="border-b border-border p-6">
                <h3>Website Inquiries</h3>
                <p className="text-sm text-muted-foreground mt-1">Manage contact form submissions</p>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading...</p>
                ) : inquiries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No inquiries yet</p>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <Card key={inquiry.id} className="border-border rounded-xl overflow-hidden">
                        <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              inquiry.status === 'new' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              {inquiry.status === 'new' ? (
                                <Clock className="w-5 h-5 text-blue-600" />
                              ) : (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{inquiry.name}</p>
                              <p className="text-sm text-muted-foreground">{new Date(inquiry.timestamp).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Select value={inquiry.status} onValueChange={(value) => updateInquiryStatus(inquiry.id, value)}>
                            <SelectTrigger className="w-40 rounded-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm">{inquiry.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Phone</p>
                              <p className="text-sm">{inquiry.phone}</p>
                            </div>
                          </div>
                          {inquiry.interestedIn && (
                            <div>
                              <p className="text-xs text-muted-foreground">Interested In</p>
                              <p className="text-sm">{inquiry.interestedIn}</p>
                            </div>
                          )}
                          {inquiry.message && (
                            <div>
                              <p className="text-xs text-muted-foreground">Message</p>
                              <p className="text-sm">{inquiry.message}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patient Forms Tab */}
          <TabsContent value="patient-forms">
            <PatientFormsManager accessToken={accessToken} />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-border rounded-2xl">
                  <CardHeader className="border-b border-border p-6">
                    <h3>Upcoming Appointments</h3>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <p className="text-center text-muted-foreground py-8">Loading...</p>
                    ) : schedule.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No appointments scheduled</p>
                    ) : (
                      <div className="space-y-3">
                        {schedule.map((event) => (
                          <Card key={event.id} className="border-border rounded-xl p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="w-4 h-4 text-secondary" />
                                  <p className="font-medium">{event.title}</p>
                                </div>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <p>Patient: {event.patient}</p>
                                  <p>Date: {event.date} at {event.time}</p>
                                  <p>Procedure: {event.procedure}</p>
                                  {event.notes && <p>Notes: {event.notes}</p>}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteEvent(event.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="border-border rounded-2xl">
                  <CardHeader className="border-b border-border p-6">
                    <h3>Add Event</h3>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={addEvent} className="space-y-4">
                      <div>
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                          id="title"
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                          className="rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="patient">Patient Name</Label>
                        <Input
                          id="patient"
                          value={newEvent.patient}
                          onChange={(e) => setNewEvent({ ...newEvent, patient: e.target.value })}
                          className="rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newEvent.date}
                          onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                          className="rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={newEvent.time}
                          onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                          className="rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="procedure">Procedure</Label>
                        <Input
                          id="procedure"
                          value={newEvent.procedure}
                          onChange={(e) => setNewEvent({ ...newEvent, procedure: e.target.value })}
                          className="rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={newEvent.notes}
                          onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                          className="rounded-xl"
                          rows={3}
                        />
                      </div>
                      <Button type="submit" className="w-full rounded-full bg-secondary hover:bg-secondary/90">
                        Add Event
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard accessToken={accessToken} />
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog">
            <BlogManager accessToken={accessToken} />
          </TabsContent>

          {/* PDFs Tab */}
          <TabsContent value="pdfs">
            <PDFManager accessToken={accessToken} />
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <div className="grid grid-cols-1 gap-6">
              {/* Info Card */}
              <Card className="border-border rounded-2xl bg-blue-50/50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Image className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="mb-2">📷 Before/After Gallery Management</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        To manage before/after gallery images with professional cropping tools, please use the Gallery page with Edit Mode enabled.
                      </p>
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">How to manage gallery images:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                          <li>Click "Back to Website" and navigate to the Gallery page</li>
                          <li>Click the "Edit Mode" toggle in the top navigation</li>
                          <li>Use the "Before" and "After" buttons on each case to upload images with cropping</li>
                          <li>Click the "Add New Case" card at the end to create new cases</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="border-border rounded-2xl">
                    <CardHeader className="border-b border-border p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3>Other Website Photos</h3>
                          <p className="text-xs text-muted-foreground mt-1">For facility, team, and other non-gallery images</p>
                        </div>
                        {photos.length > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={deleteAllPhotos}
                            disabled={loading}
                            className="rounded-full"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete All ({photos.length})
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {loading ? (
                        <p className="text-center text-muted-foreground py-8">Loading...</p>
                      ) : photos.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No photos uploaded yet</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {photos.map((photo) => (
                            <Card key={photo.id} className="border-border rounded-xl overflow-hidden group">
                              <div className="aspect-square bg-muted relative">
                                <img 
                                  src={photo.publicUrl} 
                                  alt={photo.caption}
                                  className="w-full h-full object-cover"
                                />
                                {/* Featured Star */}
                                {photo.featured && (
                                  <div className="absolute top-2 right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                                    <Star className="w-5 h-5 text-white fill-white" />
                                  </div>
                                )}
                                {/* Status Badge */}
                                {photo.status === 'draft' && (
                                  <div className="absolute top-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                                    Draft
                                  </div>
                                )}
                                {photo.displayLocation === 'hidden' && (
                                  <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                    Hidden
                                  </div>
                                )}
                                {photo.status === 'published' && photo.displayLocation !== 'hidden' && !photo.featured && (
                                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                                    Published
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditPhoto(photo)}
                                    className="text-card hover:text-card hover:bg-card/20"
                                  >
                                    <Edit2 className="w-5 h-5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deletePhoto(photo.id)}
                                    className="text-card hover:text-card hover:bg-card/20"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </Button>
                                </div>
                              </div>
                              <div className="p-3 space-y-1">
                                {photo.title && (
                                  <p className="text-sm font-medium truncate">{photo.title}</p>
                                )}
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-muted-foreground capitalize">{photo.category}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{photo.displayLocation}</p>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{photo.caption || photo.fileName}</p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card className="border-border rounded-2xl">
                    <CardHeader className="border-b border-border p-6">
                      <h3>Upload Photo</h3>
                      <p className="text-xs text-muted-foreground mt-1">For facility, team, or other images</p>
                    </CardHeader>
                    <CardContent className="p-6">
                      <form onSubmit={uploadPhoto} className="space-y-4">
                        <div>
                          <Label htmlFor="photo">Select Photo</Label>
                          <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            className="rounded-xl"
                            required={!editingPhoto}
                          />
                        </div>
                        <div>
                          <Label htmlFor="title">Photo Title</Label>
                          <Input
                            id="title"
                            value={photoTitle}
                            onChange={(e) => setPhotoTitle(e.target.value)}
                            className="rounded-xl"
                            placeholder="e.g., Waiting Room"
                          />
                        </div>
                        <div>
                          <Label htmlFor="display-location">Display Location</Label>
                          <ImageLocationSelector
                            value={photoDisplayLocation}
                            onChange={setPhotoDisplayLocation}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Choose where this photo appears on the website</p>
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select value={photoCategory} onValueChange={setPhotoCategory}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="facility">Facility</SelectItem>
                              <SelectItem value="team">Team</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">⚠️ Not for before/after gallery images</p>
                        </div>
                        <div>
                          <Label htmlFor="status">Visibility Status</Label>
                          <Select value={photoStatus} onValueChange={setPhotoStatus}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="published">Published (Visible)</SelectItem>
                              <SelectItem value="draft">Draft (Hidden)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">Control if photo is visible on the website</p>
                        </div>
                        <div>
                          <Label htmlFor="caption">Caption / Description</Label>
                          <Textarea
                            id="caption"
                            value={photoCaption}
                            onChange={(e) => setPhotoCaption(e.target.value)}
                            className="rounded-xl"
                            rows={3}
                            placeholder="Add details about this photo..."
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full rounded-full bg-secondary hover:bg-secondary/90"
                          disabled={!photoFile && !editingPhoto}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {editingPhoto ? 'Update Photo' : 'Upload Photo'}
                        </Button>
                        {editingPhoto && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEdit}
                            className="mt-2"
                          >
                            Cancel Edit
                          </Button>
                        )}
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Photo Edit Dialog */}
      <PhotoEditDialog
        photo={editingPhoto}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingPhoto(null);
        }}
        onSave={() => {
          fetchPhotos();
          setEditDialogOpen(false);
          setEditingPhoto(null);
        }}
        accessToken={accessToken}
      />
    </div>
  );
}