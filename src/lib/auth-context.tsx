'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/lib/types';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: string | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      return data as User | null;
    } catch {
      return null;
    }
  }, []);

  /** Ensure a users row exists for the given auth user */
  const ensureProfile = useCallback(async (authUser: { id: string; email?: string; user_metadata?: Record<string, any> }): Promise<User | null> => {
    let profile = await fetchProfile(authUser.id);
    if (!profile) {
      await supabase.from('users').upsert({
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.email || 'User',
        email: authUser.email || null,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        role: authUser.user_metadata?.role || 'customer',
      }, { onConflict: 'id', ignoreDuplicates: true });
      profile = await fetchProfile(authUser.id);
    }
    return profile;
  }, [fetchProfile]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // 1. Bootstrap from existing session (fast, synchronous-ish)
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        const profile = await ensureProfile(s.user);
        setUser(profile);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // 2. Listen for future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s);
        if (s?.user) {
          // If a user just signed in or their metadata updated, fetch the profile.
          // (We don't do this on TOKEN_REFRESHED to avoid unnecessary DB calls)
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            const profile = await ensureProfile(s.user);
            setUser(profile);
            setLoading(false);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [ensureProfile]);

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithPassword = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        full_name: fullName,
        email,
        role,
      });
    }
    return { error: null };
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error: error?.message ?? null };
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) return { error: error.message };
    if (data.user) {
      const existing = await fetchProfile(data.user.id);
      if (!existing) {
        await supabase.from('users').insert({
          id: data.user.id,
          full_name: phone,
          phone,
          role: 'customer',
        });
      }
    }
    return { error: null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) { /* sign out error — handled by finally block */ }
    } catch (e) {
      // sign out exception — handled by finally block
    } finally {
      setUser(null);
      setSession(null);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithPassword,
        signUpWithPassword,
        signInWithPhone,
        verifyOtp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}