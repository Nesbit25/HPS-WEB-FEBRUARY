import { projectId } from '../../utils/supabase/info';
import { FileText, User, LogOut, Calendar, Mail, Phone, Cake, Download, Printer, Eye } from 'lucide-react';
import { Link } from 'react-router';

export function PatientDashboard() {
  const { user, signOut } = usePatientAuth();
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  useEffect(() => {
    if (user) {
      fetchMyForms();
    }
  }, [user]);

  const fetchMyForms = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${serverUrl}/patient/my-forms`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        }
      });

      const data = await response.json();
      if (data.forms) {
        setForms(data.forms);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'reviewed': 'bg-yellow-100 text-yellow-800',
      'processed': 'bg-green-100 text-green-800',
      'archived': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const viewFormPDF = async (formId: string) => {
    if (!user) return;

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
          'Authorization': `Bearer ${user.accessToken}`
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="font-serif text-2xl text-[#1a1f2e]">
                Hanemann Plastic Surgery
              </Link>
              <Badge className="bg-[#c9b896] text-white">Patient Portal</Badge>
            </div>
            <Button
              onClick={signOut}
              variant="outline"
              className="border-[#1a1f2e] text-[#1a1f2e] hover:bg-[#1a1f2e] hover:text-white rounded-none"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="lg:col-span-1 border-none shadow-md h-fit">
            <CardHeader className="bg-gradient-to-br from-[#1a1f2e] to-[#2d3548] text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="font-serif text-xl mb-1">
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <p className="text-sm text-white/80">Patient</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-[#b8976a]" />
                <span className="text-gray-700">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-[#b8976a]" />
                  <span className="text-gray-700">{user.phone}</span>
                </div>
              )}
              {user.dob && (
                <div className="flex items-center gap-3 text-sm">
                  <Cake className="w-4 h-4 text-[#b8976a]" />
                  <span className="text-gray-700">{formatDate(user.dob)}</span>
                </div>
              )}

              <div className="pt-4 border-t space-y-2">
                <Link to="/patient-forms">
                  <Button
                    className="w-full bg-[#c9b896] text-white hover:bg-[#b8976a] rounded-none"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Submit New Form
                  </Button>
                </Link>
                <Link to="/consultation">
                  <Button
                    variant="outline"
                    className="w-full border-[#1a1f2e] text-[#1a1f2e] hover:bg-[#1a1f2e] hover:text-white rounded-none"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Request Consultation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Forms List */}
          <Card className="lg:col-span-2 border-none shadow-md">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-[#1a1f2e]">
                My Forms & Documents
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Track the status of your submitted forms and documentation
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  Loading your forms...
                </div>
              ) : forms.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-serif text-xl text-[#1a1f2e] mb-2">
                    No Forms Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Get started by submitting your first form
                  </p>
                  <Link to="/patient-forms">
                    <Button className="bg-[#1a1f2e] text-white hover:bg-[#2d3548] rounded-none">
                      Submit a Form
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {forms.map((form) => (
                    <div
                      key={form.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#c9b896] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-[#c9b896]" />
                            <h4 className="font-semibold text-[#1a1f2e]">
                              {form.formTitle || form.formType}
                            </h4>
                            <Badge className={getStatusColor(form.status)}>
                              {form.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            Submitted on {formatDate(form.timestamp)}
                          </p>
                          {form.notes && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-xs text-blue-900">
                                <strong>Staff Note:</strong> {form.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => viewFormPDF(form.id)}
                            className="bg-[#c9b896] text-white hover:bg-[#b8976a] rounded-none"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Link to="/services">
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <h3 className="font-serif text-lg text-[#1a1f2e] mb-2">
                  Explore Procedures
                </h3>
                <p className="text-sm text-gray-600">
                  Learn about our surgical and non-surgical offerings
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/blog">
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <h3 className="font-serif text-lg text-[#1a1f2e] mb-2">
                  Education Center
                </h3>
                <p className="text-sm text-gray-600">
                  Read articles and watch educational videos
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/gallery">
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <h3 className="font-serif text-lg text-[#1a1f2e] mb-2">
                  Before & After Gallery
                </h3>
                <p className="text-sm text-gray-600">
                  View real patient transformation results
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}