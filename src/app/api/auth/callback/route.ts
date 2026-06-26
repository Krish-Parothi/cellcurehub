import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { UserRole } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session?.user) {
      const authUser = session.user;

      // Check if this user already has a profile (e.g., they were invited by an admin, or are returning)
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!existingProfile) {
        // --- NEW CUSTOMER LOGIC ---
        // They are a brand new user signing up for the first time via OAuth.
        await supabase.from('users').upsert({
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email || 'User',
          email: authUser.email,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          role: 'customer',
        }, { onConflict: 'id', ignoreDuplicates: true });
      }

      // Check role from app_metadata first, fallback to existingProfile
      const role = authUser.app_metadata?.role || existingProfile?.role || 'customer';
      const hasPhone = !!authUser.app_metadata?.phone || !!existingProfile?.phone;

      let redirectPath = '/dashboard';
      if (role === 'admin') redirectPath = '/admin';
      else if (role === 'shop_admin') redirectPath = '/shop-admin';
      else if (role === 'technician') redirectPath = '/technician';
      else if (role === 'delivery') redirectPath = '/delivery';
      else if (!hasPhone && role === 'customer') redirectPath = '/complete-profile';

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Return to home or generic fallback if no code or error
  return NextResponse.redirect(`${origin}${next}`);
}
