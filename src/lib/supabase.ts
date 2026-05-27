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
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
