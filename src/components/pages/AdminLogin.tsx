import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';
import { CircleAccent, GeometricPattern, AccentLine } from '../DecorativeElements';
import { Lock, Mail, UserPlus, ArrowLeft } from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLoginProps {
  onLoginSuccess: (accessToken: string, user: any) => void;
  onBackToWebsite?: () => void;
}

export function AdminLogin({ onLoginSuccess, onBackToWebsite }: AdminLoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleCreateTestUser = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc862019/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: 'test@hanemannplasticsurgery.com',
          password: 'Password',
          name: 'Test User'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('already registered') || data.error?.includes('already been registered')) {
          setSuccessMessage('Test user already exists! You can now log in.');
        } else {
          setError(data.error || 'Failed to create test user');
        }
      } else {
        setSuccessMessage('Test user created successfully! You can now log in.');
      }
    } catch (err: any) {
      console.error('Create user error:', err);
      setError('Failed to create test user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email, password: '***' });

      await login(email, password);
      
      console.log('Login successful via Auth context');
      
      // Get the session to pass to the callback
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        onLoginSuccess(session.access_token, session.user);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-secondary/10 to-muted flex items-center justify-center p-6 relative overflow-hidden">
      <GeometricPattern opacity={0.04} />
      
      {/* Back to Website Button */}
      {onBackToWebsite && (
        <Button
          variant="ghost"
          onClick={onBackToWebsite}
          className="absolute top-6 left-6 rounded-full hover:bg-card/80 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Website
        </Button>
      )}
      
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <CircleAccent size="md" className="mx-auto mb-4" />
          <h1 className="mb-2">Admin Portal</h1>
          <AccentLine className="mx-auto mb-4 max-w-xs" />
          <p className="text-muted-foreground">Hanemann Plastic Surgery</p>
        </div>

        <Card className="border-2 border-secondary/20 rounded-2xl overflow-hidden shadow-2xl relative">
          {/* Gold accent corners */}
          <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-transparent"></div>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-secondary to-transparent"></div>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-secondary to-transparent"></div>
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-secondary to-transparent"></div>
          </div>

          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-secondary" />
              </div>
            </div>
            <h2 className="text-center mb-2">Sign In</h2>
            <p className="text-center text-muted-foreground text-sm">Enter your credentials to access the portal</p>
          </CardHeader>

          <CardContent className="p-8 pt-4">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert className="bg-red-50 border-red-200 text-red-800">
                  <p className="text-sm">{error}</p>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@hanemannplasticsurgery.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-xl border-border focus:border-secondary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 rounded-xl border-border focus:border-secondary"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 relative group overflow-hidden"
                disabled={loading}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-card/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" style={{ transitionDuration: '1s' }}></span>
                <span className="relative">{loading ? 'Signing In...' : 'Sign In'}</span>
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                For security purposes, please contact IT if you need access credentials.
              </p>
              <div className="mt-3 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                <p className="text-xs font-medium text-secondary mb-1">Demo Account</p>
                <p className="text-xs text-muted-foreground">
                  Email: <span className="font-mono">test@hanemannplasticsurgery.com</span><br />
                  Password: <span className="font-mono">Password</span>
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-2 w-full rounded-full bg-secondary hover:bg-secondary/90 transition-all duration-300 hover:scale-105 relative group overflow-hidden"
                  disabled={loading}
                  onClick={handleCreateTestUser}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-card/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" style={{ transitionDuration: '1s' }}></span>
                  <span className="relative flex items-center">
                    <UserPlus className="w-4 h-4 mr-2" />
                    {loading ? 'Creating...' : 'Create Test User'}
                  </span>
                </Button>
                {successMessage && (
                  <Alert className="bg-green-50 border-green-200 text-green-800 mt-2">
                    <p className="text-sm">{successMessage}</p>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hanemann Plastic Surgery. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}