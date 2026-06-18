import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client.
 * 
 * This is ONLY safe for:
 *  - Realtime subscriptions
 *  - Reading public/pricing data
 *  - Auth operations (signIn, signUp, signOut)
 * 
 * All data mutations MUST go through server actions.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options) => {
      const fetchId = Math.random().toString(36).slice(2, 6);
      console.log(`[SUPABASE_FETCH_START] [${fetchId}] ${options?.method || 'GET'} ${url}`);
      try {
        const res = await fetch(url, { ...options, cache: 'no-store' });
        console.log(`[SUPABASE_FETCH_DONE] [${fetchId}] status: ${res.status}`);
        return res;
      } catch (e) {
        console.error(`[SUPABASE_FETCH_ERROR] [${fetchId}]`, e);
        throw e;
      }
    }
  }
});
