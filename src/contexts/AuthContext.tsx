import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';

interface AuthContextType {
  isAdmin: boolean;
  user: any | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  user: null,
  accessToken: null,
  login: async () => {},
  logout: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => getSupabaseClient());

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.access_token) {
          setUser(session.user);
          setAccessToken(session.access_token);
          setIsAdmin(true);
          localStorage.setItem('admin_token', session.access_token);
          localStorage.setItem('admin_user', JSON.stringify(session.user));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAccessToken(null);
        setIsAdmin(false);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.access_token) {
        // Verify the token is still valid by checking the user
        const { data: { user }, error: userError } = await supabase.auth.getUser(session.access_token);
        
        if (user && !userError) {
          setUser(session.user);
          setAccessToken(session.access_token);
          setIsAdmin(true);
          
          // Store in localStorage for persistence
          localStorage.setItem('admin_token', session.access_token);
          localStorage.setItem('admin_user', JSON.stringify(session.user));
        } else {
          // Token is invalid, clear everything
          console.log('Token validation failed, clearing session');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          setAccessToken(null);
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        // No active session, clear everything
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setAccessToken(null);
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // Clear on error
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setAccessToken(null);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (session) {
        setUser(session.user);
        setAccessToken(session.access_token);
        setIsAdmin(true);
        
        // Store in localStorage
        localStorage.setItem('admin_token', session.access_token);
        localStorage.setItem('admin_user', JSON.stringify(session.user));
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
      setIsAdmin(false);
      
      // Clear localStorage
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAdmin, user, accessToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}