'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return data as User | null;
  }, []);



// useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session: s } }) => {
//       setSession(s);
//       if (s?.user) {
//         fetchProfile(s.user.id).then(async (profile) => {
//           if (!profile) {
//             await supabase.from('users').insert({
//               id: s.user.id,
//               full_name: s.user.user_metadata?.full_name || s.user.email,
//               email: s.user.email,
//               avatar_url: s.user.user_metadata?.avatar_url || null,
//               role: 'customer',
//             });
//             const newProfile = await fetchProfile(s.user.id);
//             setUser(newProfile);
//           } else {
//             setUser(profile);
//           }
//           setLoading(false);
//         });
//       } else {
//         setLoading(false);
//       }
//     });
useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id).then(async (profile) => {
          if (!profile) {
            await supabase.from('users').upsert({  // ✅ insert → upsert
              id: s.user.id,
              full_name: s.user.user_metadata?.full_name || s.user.email,
              email: s.user.email,
              avatar_url: s.user.user_metadata?.avatar_url || null,
              role: s.user.user_metadata?.role || 'customer',  // ✅ hardcoded fix
            }, { onConflict: 'id', ignoreDuplicates: true });  // ✅ race condition fix
            const newProfile = await fetchProfile(s.user.id);
            setUser(newProfile);
          } else {
            setUser(profile);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
    // const { data: { subscription } } = supabase.auth.onAuthStateChange(
    //   async (_event, s) => {
    //     setSession(s);
    //     if (s?.user) {
    //       let profile = await fetchProfile(s.user.id);
    //       if (!profile) {
    //         await supabase.from('users').insert({
    //           id: s.user.id,
    //           full_name: s.user.user_metadata?.full_name || s.user.email,
    //           email: s.user.email,
    //           avatar_url: s.user.user_metadata?.avatar_url || null,
    //           role: 'customer',
    //         });
    //         profile = await fetchProfile(s.user.id);
    //       }
    //       setUser(profile);
    //     } else {
    //       setUser(null);
    //     }
    //   }
    // );
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (_event, s) => {
    setSession(s);
    if (s?.user) {
      let profile = await fetchProfile(s.user.id);
      if (!profile) {
        await supabase.from('users').upsert({  // insert → upsert
          id: s.user.id,
          full_name: s.user.user_metadata?.full_name || s.user.email,
          email: s.user.email,
          avatar_url: s.user.user_metadata?.avatar_url || null,
          role: s.user.user_metadata?.role || 'customer',  // ✅ yahi tha bug
        }, { onConflict: 'id', ignoreDuplicates: true });  // ✅ race condition fix
        profile = await fetchProfile(s.user.id);
      }
      setUser(profile);
    } else {
      setUser(null);
    }
  }
);

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  // const signUpWithPassword = async (
  //   email: string,
  //   password: string,
  //   fullName: string,
  //   role: UserRole
  // ) => {
  //   const { data, error } = await supabase.auth.signUp({ email, password });
  //   if (error) return { error: error.message };
  //   if (data.user) {
  //     await supabase.from('users').insert({
  //       id: data.user.id,
  //       full_name: fullName,
  //       email,
  //       role,
  //     });
  //   }
  //   return { error: null };
  // };

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
      data: { full_name: fullName, role } // ✅ metadata mein save karo
    }
  });
  if (error) return { error: error.message };
  if (data.user) {
    await supabase.from('users').insert({
      id: data.user.id,
      full_name: fullName,
      email,
      role, // ✅ yeh sahi hai
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    window.location.href = '/';
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




  // useEffect(() => {
  //   supabase.auth.getSession().then(({ data: { session: s } }) => {
  //     setSession(s);
  //     if (s?.user) {
  //       fetchProfile(s.user.id).then((profile) => {
  //         setUser(profile);
  //         setLoading(false);
  //       });
  //     } else {
  //       setLoading(false);
  //     }
  //   });

  //   const { data: { subscription } } = supabase.auth.onAuthStateChange(
  //     (_event, s) => {
  //       setSession(s);
  //       if (s?.user) {
  //         fetchProfile(s.user.id).then((profile) => {
  //           setUser(profile);
  //         });
  //       } else {
  //         setUser(null);
  //       }
  //     }
  //   );

  //   return () => subscription.unsubscribe();
  // }, [fetchProfile]);