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

      // If they don't have a profile with their REAL Google UUID, it means they are either a completely
      // new customer, OR they are a pre-provisioned staff member who was assigned a Fake UUID.
      if (!existingProfile) {
        
        // Use the ADMIN client to bypass RLS and find the pre-provisioned fake UUID using their email
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: preProvisionedProfile } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .neq('id', authUser.id)
          .maybeSingle();

        if (preProvisionedProfile) {
          // --- MERGE LOGIC ---
          // 1. Create their real profile based on the pre-provisioned data
          await supabaseAdmin.from('users').upsert({
            id: authUser.id,
            full_name: authUser.user_metadata?.full_name || preProvisionedProfile.full_name || authUser.email || 'User',
            email: authUser.email,
            phone: preProvisionedProfile.phone || authUser.user_metadata?.phone || null,
            avatar_url: authUser.user_metadata?.avatar_url || null,
            role: preProvisionedProfile.role,
            shop_id: preProvisionedProfile.shop_id,
            is_active: preProvisionedProfile.is_active ?? true,
          }, { onConflict: 'id', ignoreDuplicates: true });

          // 2. Migrate all foreign keys from the Fake UUID to the Real UUID
          await Promise.all([
            supabaseAdmin.from('repairs').update({ technician_id: authUser.id }).eq('technician_id', preProvisionedProfile.id),
            supabaseAdmin.from('repairs').update({ customer_id: authUser.id }).eq('customer_id', preProvisionedProfile.id),
            supabaseAdmin.from('delivery_assignments').update({ delivery_boy_id: authUser.id }).eq('delivery_boy_id', preProvisionedProfile.id),
            supabaseAdmin.from('attendance').update({ employee_id: authUser.id }).eq('employee_id', preProvisionedProfile.id),
            supabaseAdmin.from('salary_config').update({ employee_id: authUser.id }).eq('employee_id', preProvisionedProfile.id),
            supabaseAdmin.from('technician_details').update({ user_id: authUser.id }).eq('user_id', preProvisionedProfile.id)
          ]);

          // 3. Delete the old Fake UUID profile
          await supabaseAdmin.from('users').delete().eq('id', preProvisionedProfile.id);

        } else {
          // --- NEW CUSTOMER LOGIC ---
          // They are a brand new user signing up for the first time.
          await supabase.from('users').upsert({
            id: authUser.id,
            full_name: authUser.user_metadata?.full_name || authUser.email || 'User',
            email: authUser.email,
            avatar_url: authUser.user_metadata?.avatar_url || null,
            role: 'customer',
          }, { onConflict: 'id', ignoreDuplicates: true });
        }
      }

      // Force a session refresh to re-mint the JWT so the Custom Claims hook picks up the newly merged profile!
      await supabase.auth.refreshSession();

      // Determine redirect based on role (fetch it fresh after merge)
      const { data: finalProfile } = await supabase.from('users').select('role, phone').eq('id', authUser.id).maybeSingle();
      const role = finalProfile?.role || 'customer';

      let redirectPath = '/dashboard';
      if (role === 'admin') redirectPath = '/admin';
      else if (role === 'shop_admin') redirectPath = '/shop-admin';
      else if (role === 'technician') redirectPath = '/technician';
      else if (role === 'delivery') redirectPath = '/delivery';
      else if (!finalProfile?.phone && role === 'customer') redirectPath = '/complete-profile';

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Return to home or generic fallback if no code or error
  return NextResponse.redirect(`${origin}${next}`);
}
