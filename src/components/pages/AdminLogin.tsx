import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';
import { CircleAccent, GeometricPattern, AccentLine } from '../DecorativeElements';
import { Lock, Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLoginProps {
  onLoginSuccess: (accessToken: string, user: any) => void;
  onBackToWebsite?: () => void;
}

type Mode = 'otp-email' | 'otp-code' | 'password';

export function AdminLogin({ onLoginSuccess, onBackToWebsite }: AdminLoginProps) {
  const { login, sendLoginCode, verifyLoginCode } = useAuth();
  const [mode, setMode] = useState<Mode>('otp-email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const finishLogin = async () => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      onLoginSuccess(session.access_token, session.user);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await sendLoginCode(email.trim());
      setInfo(`We sent a 6-digit code to ${email.trim()}. Check your inbox (and spam folder).`);
      setMode('otp-code');
    } catch (err: any) {
      console.error('Send code error:', err);
      const msg = err?.message || 'Could not send a code to that address.';
      if (/signups not allowed|user not found|not allowed/i.test(msg)) {
        setError("That email isn't set up for admin access yet. Contact your administrator.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyLoginCode(email.trim(), code.trim());
      await finishLogin();
    } catch (err: any) {
      console.error('Verify code error:', err);
      setError(err?.message || 'That code didn’t work. Try again or request a new one.');
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      await finishLogin();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-secondary/10 to-muted flex items-center justify-center p-6 relative overflow-hidden">
      <GeometricPattern opacity={0.04} />

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
                {mode === 'password' ? (
                  <Lock className="w-6 h-6 text-secondary" />
                ) : (
                  <KeyRound className="w-6 h-6 text-secondary" />
                )}
              </div>
            </div>
            <h2 className="text-center mb-2">
              {mode === 'otp-email' && 'Sign In'}
              {mode === 'otp-code' && 'Enter Your Code'}
              {mode === 'password' && 'Sign In with Password'}
            </h2>
            <p className="text-center text-muted-foreground text-sm">
              {mode === 'otp-email' && "We'll email you a 6-digit code."}
              {mode === 'otp-code' && 'Type the 6-digit code we just emailed you.'}
              {mode === 'password' && 'Enter your email and password.'}
            </p>
          </CardHeader>

          <CardContent className="p-8 pt-4">
            {error && (
              <Alert className="bg-red-50 border-red-200 text-red-800 mb-4">
                <p className="text-sm">{error}</p>
              </Alert>
            )}
            {info && (
              <Alert className="bg-green-50 border-green-200 text-green-800 mb-4">
                <p className="text-sm">{info}</p>
              </Alert>
            )}

            {mode === 'otp-email' && (
              <form onSubmit={handleSendCode} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@hanemannplasticsurgery.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-xl border-border focus:border-secondary"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full bg-primary hover:bg-primary/90 transition-all duration-300"
                  disabled={loading || !email.trim()}
                >
                  {loading ? 'Sending code…' : 'Send me a code'}
                </Button>
              </form>
            )}

            {mode === 'otp-code' && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-foreground">6-Digit Code</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-[0.5em] rounded-xl border-border focus:border-secondary"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Sent to <span className="font-medium">{email}</span>.{' '}
                    <button
                      type="button"
                      className="underline hover:text-secondary"
                      onClick={() => {
                        setCode('');
                        setError('');
                        setInfo('');
                        setMode('otp-email');
                      }}
                    >
                      Use a different email
                    </button>
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full bg-primary hover:bg-primary/90 transition-all duration-300"
                  disabled={loading || code.length !== 6}
                >
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </Button>
              </form>
            )}

            {mode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@hanemannplasticsurgery.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-xl border-border focus:border-secondary"
                      autoComplete="email"
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
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full bg-primary hover:bg-primary/90 transition-all duration-300"
                  disabled={loading || !email.trim() || !password}
                >
                  {loading ? 'Signing In…' : 'Sign In'}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-secondary underline"
                onClick={() => {
                  setError('');
                  setInfo('');
                  setCode('');
                  setPassword('');
                  setMode(mode === 'password' ? 'otp-email' : 'password');
                }}
              >
                {mode === 'password' ? 'Use a 6-digit code instead' : 'Use a password instead'}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Need access? Contact your administrator.
            </p>
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
