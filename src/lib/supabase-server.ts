import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

/**
 * Server-side Supabase client for use in:
 *  - Server Actions ('use server')
 *  - Server Components
 *  - Route Handlers
 * 
 * This client reads auth cookies set by the browser client,
 * so it automatically knows which user is making the request.
 * 
 * IMPORTANT: This must be called inside a request context (not at module level).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from Server Components where
            // cookies can't be set. This is expected and can be safely ignored
            // if you're only reading the session in a Server Component.
            logger.debug('SUPABASE_SERVER', 'Cookie set skipped (read-only context)');
          }
        },
      },
    }
  );
}
