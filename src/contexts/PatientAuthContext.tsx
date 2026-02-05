import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface PatientUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dob?: string;
  accessToken: string;
}

interface PatientAuthContextType {
  user: PatientUser | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { firstName: string; lastName: string; phone?: string; dob?: string }) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<PatientUser>) => Promise<{ error?: any }>;
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

export function PatientAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PatientUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient(); // Use singleton client

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          firstName: session.user.user_metadata?.firstName,
          lastName: session.user.user_metadata?.lastName,
          phone: session.user.user_metadata?.phone,
          dob: session.user.user_metadata?.dob,
          accessToken: session.access_token
        });
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: { firstName: string; lastName: string; phone?: string; dob?: string }
  ) => {
    try {
      const response = await fetch(`${serverUrl}/patient/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          ...userData
        })
      });

      const data = await response.json();

      if (data.error) {
        return { error: data.error };
      }

      // Sign in immediately after signup
      return await signIn(email, password);
    } catch (error) {
      console.error('Signup error:', error);
      return { error: 'Failed to create account' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          firstName: session.user.user_metadata?.firstName,
          lastName: session.user.user_metadata?.lastName,
          phone: session.user.user_metadata?.phone,
          dob: session.user.user_metadata?.dob,
          accessToken: session.access_token
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Failed to sign in' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (data: Partial<PatientUser>) => {
    try {
      if (!user) return { error: 'Not authenticated' };

      const response = await fetch(`${serverUrl}/patient/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.error) {
        return { error: result.error };
      }

      // Update local user state
      setUser({ ...user, ...data });
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: 'Failed to update profile' };
    }
  };

  return (
    <PatientAuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() {
  const context = useContext(PatientAuthContext);
  if (context === undefined) {
    throw new Error('usePatientAuth must be used within PatientAuthProvider');
  }
  return context;
}