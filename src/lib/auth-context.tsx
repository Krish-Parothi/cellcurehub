'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/lib/types';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  needsPhone: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Helper: build a User object from various sources ─────────────────
function buildProfile(
  authUser: SupabaseUser,
  role: UserRole,
  extras?: { shop_id?: string | null; full_name?: string | null; phone?: string | null }
): User {
  return {
    id: authUser.id,
    email: authUser.email || null,
    phone: extras?.phone || authUser.app_metadata?.phone || authUser.phone || null,
    full_name: extras?.full_name || authUser.app_metadata?.full_name || authUser.user_metadata?.full_name || authUser.email || 'User',
    avatar_url: authUser.user_metadata?.avatar_url || null,
    role,
    shop_id: extras?.shop_id || authUser.app_metadata?.shop_id || null,
    created_at: authUser.created_at || new Date().toISOString(),
    is_active: true,
    phone_verified: !!authUser.phone,
    firebase_uid: null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const DEBUG = process.env.NODE_ENV === 'development';
  const needsPhone = !!user && !user.phone;

  // ── Cache: prevents infinite loops and redundant DB calls ────────
  // Once we resolve a user's role via DB, we cache it here keyed by user ID.
  // Subsequent TOKEN_REFRESHED events with stale JWTs will use this cache
  // instead of re-fetching and re-triggering refreshSession().
  const resolvedCacheRef = useRef<{ userId: string; profile: User } | null>(null);

  // Tracks whether a DB fallback fetch is already in flight (prevents races)
  const fetchInFlightRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        if (DEBUG) console.log(`[Auth] ${event} hasUser=${!!s?.user}`);

        setSession(s);

        if (!s?.user) {
          // Signed out — clear everything
          setUser(null);
          setLoading(false);
          resolvedCacheRef.current = null;
          fetchInFlightRef.current = false;
          return;
        }

        const authUser = s.user;

        // ── Path 1: JWT has role from Custom Claims hook (ideal) ──
        const jwtRole = authUser.app_metadata?.role as UserRole | undefined;
        if (jwtRole) {
          if (DEBUG) console.log('[Auth] JWT has role:', jwtRole);
          const profile = buildProfile(authUser, jwtRole);
          resolvedCacheRef.current = { userId: authUser.id, profile };
          setUser(profile);
          setLoading(false);
          return;
        }

        // ── Path 2: Cache hit — we already resolved this user via DB ──
        if (resolvedCacheRef.current?.userId === authUser.id) {
          if (DEBUG) console.log('[Auth] Using cached profile (role:', resolvedCacheRef.current.profile.role, ')');
          setUser(resolvedCacheRef.current.profile);
          setLoading(false);
          return;
        }

        // ── Path 3: No JWT role, no cache — need DB fallback (runs once) ──
        if (fetchInFlightRef.current) {
          if (DEBUG) console.log('[Auth] DB fetch already in flight, skipping');
          return; // Don't double-fetch
        }

        fetchInFlightRef.current = true;
        if (DEBUG) console.log('[Auth] DB fallback: fetching profile for', authUser.id);

        // IMPORTANT: We do NOT await this inside onAuthStateChange.
        // We fire-and-forget to avoid Web Locks deadlock, but we track
        // completion via the ref so it only runs once.
        const fetchProfileWithRetry = async (retries = 3) => {
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              const { data: dbProfile, error } = await supabase
                .from('users')
                .select('role, shop_id, full_name, phone')
                .eq('id', authUser.id)
                .maybeSingle();

              if (error) throw error;

              const role = (dbProfile?.role as UserRole) || 'customer';
              if (DEBUG) console.log(`[Auth] DB fallback resolved role: ${role} (attempt ${attempt})`);

              const profile = buildProfile(authUser, role, {
                shop_id: dbProfile?.shop_id,
                full_name: dbProfile?.full_name,
                phone: dbProfile?.phone,
              });

              resolvedCacheRef.current = { userId: authUser.id, profile };
              setUser(profile);
              setLoading(false);
              fetchInFlightRef.current = false;
              return; // success — exit
            } catch (err) {
              console.warn(`[Auth] DB fallback attempt ${attempt}/${retries} failed:`, err);
              if (attempt < retries) {
                await new Promise((r) => setTimeout(r, 1000)); // wait 1s before retry
              }
            }
          }

          // All retries exhausted — keep loading state so RoleGuard shows spinner, not 404
          console.error('[Auth] DB fallback failed after all retries. User will see loading state.');
          fetchInFlightRef.current = false;
        };

        fetchProfileWithRetry();
      }
    );

    return () => subscription.unsubscribe();
  }, [DEBUG]);

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithPassword = async (
    email: string,
    password: string,
    fullName: string,
    phone: string
  ) => {
    // SECURITY FIX: Client-side signups are always 'customer'
    const role: UserRole = 'customer';

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
        phone: `+91${phone.replace(/^\+91/, '')}`,
        role,
        phone_verified: false,
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
      const { data: existing } = await supabase.from('users').select('id').eq('id', data.user.id).maybeSingle();
      if (!existing) {
        await supabase.from('users').insert({
          id: data.user.id,
          full_name: phone,
          phone,
          role: 'customer',
          phone_verified: true,
        });
      } else {
        await supabase.from('users').update({ phone_verified: true }).eq('id', data.user.id);
      }
    }
    return { error: null };
  };

  const signInWithGoogle = async () => {
    // Clear cache so re-login fetches fresh data
    resolvedCacheRef.current = null;
    fetchInFlightRef.current = false;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`
      }
    });
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      // handled by finally
    } finally {
      resolvedCacheRef.current = null;
      fetchInFlightRef.current = false;
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
        needsPhone,
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