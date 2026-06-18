import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Next.js Edge Middleware — runs on EVERY request before it hits the page.
 * 
 * This is our FIRST line of defense:
 * 1. Reads the Supabase session from cookies
 * 2. Redirects unauthenticated users to /login for protected routes
 * 3. Blocks role-mismatched access (e.g. customer visiting /admin)
 * 4. Handles "coming soon" redirects
 */

// ── Route-to-Role Mapping ────────────────────────────────────────────────
// Routes that require authentication + specific roles
const ROLE_PROTECTED_ROUTES: { pathPrefix: string; allowedRoles: string[] }[] = [
  { pathPrefix: '/admin', allowedRoles: ['admin'] },
  { pathPrefix: '/shop-admin', allowedRoles: ['admin', 'shop_admin'] },
  { pathPrefix: '/technician', allowedRoles: ['admin', 'shop_admin', 'technician'] },
  { pathPrefix: '/delivery', allowedRoles: ['admin', 'shop_admin', 'delivery'] },
  { pathPrefix: '/dashboard', allowedRoles: ['customer', 'admin'] },
  { pathPrefix: '/book', allowedRoles: ['customer', 'admin'] },
];

// Routes that require authentication but no specific role
const AUTH_REQUIRED_ROUTES = [
  '/dashboard',
  '/book',
];

// Routes that redirect to coming-soon
const COMING_SOON_ROUTES = [
  '/register',
  '/account',
  '/profile',
  '/orders',
];

// Public routes that should NOT redirect authenticated users
const PUBLIC_ROUTES = [
  '/',
  '/home',
  '/login',
  '/signup',
  '/track',
  '/coming-soon',
  '/complete-profile',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Coming Soon Redirects ──────────────────────────────────────────
  const shouldRedirectComingSoon = COMING_SOON_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  if (shouldRedirectComingSoon) {
    return NextResponse.redirect(new URL('/coming-soon', request.url));
  }

  // ── Skip non-page requests ────────────────────────────────────────
  // Static files, images, API routes, etc. don't need auth checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // files like favicon.ico, images
  ) {
    return NextResponse.next();
  }

  // ── Create Supabase client for this edge request ──────────────────
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh the session (important for token refresh)
  const { data: { user } } = await supabase.auth.getUser();

  // ── Check if this path needs role protection ──────────────────────
  const matchedRoute = ROLE_PROTECTED_ROUTES.find(
    (r) => pathname === r.pathPrefix || pathname.startsWith(r.pathPrefix + '/')
  );

  if (matchedRoute) {
    // Route needs auth — redirect to login if not authenticated
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      console.info(`[MIDDLEWARE:AUTH] Unauthenticated access to ${pathname} — redirecting to /login`);
      return NextResponse.redirect(loginUrl);
    }

    // Try JWT claims first, fall back to DB query
    let role: string = user.app_metadata?.role || '';
    let hasPhone = !!user.app_metadata?.phone || !!user.phone;

    if (!role) {
      // JWT claims hook didn't populate — fetch from DB (server-side, no deadlock risk)
      const { data: profile } = await supabase
        .from('users')
        .select('role, is_active, phone')
        .eq('id', user.id)
        .single();

      if (!profile) {
        console.warn(`[MIDDLEWARE:AUTH] No profile found for user ${user.id}`);
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (!profile.is_active) {
        console.warn(`[MIDDLEWARE:AUTH] Inactive user ${user.id} blocked from ${pathname}`);
        return NextResponse.redirect(new URL('/login', request.url));
      }

      role = profile.role;
      hasPhone = !!profile.phone;
    }

    // Check role authorization
    if (!matchedRoute.allowedRoles.includes(role)) {
      console.warn(
        `[MIDDLEWARE:ROLE] User ${user.id} (role: ${role}) blocked from ${pathname} (requires: ${matchedRoute.allowedRoles.join(', ')})`
      );
      const redirectMap: Record<string, string> = {
        admin: '/admin',
        shop_admin: '/shop-admin',
        technician: '/technician',
        delivery: '/delivery',
        customer: '/dashboard',
      };
      const redirectTo = redirectMap[role] || '/';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // Check if customer needs to complete their profile (add phone)
    if (role === 'customer' && !hasPhone) {
      return NextResponse.redirect(new URL('/complete-profile', request.url));
    }
  }

  // ── Check auth-only routes (no specific role) ────────────────────
  const needsAuth = AUTH_REQUIRED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  if (needsAuth && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Redirect authenticated users away from login/signup ──────────
  if (user && (pathname === '/login' || pathname === '/signup')) {
    let role: string = user.app_metadata?.role || '';
    let hasPhone = !!user.app_metadata?.phone || !!user.phone;

    if (!role) {
      const { data: profile } = await supabase
        .from('users')
        .select('role, phone')
        .eq('id', user.id)
        .single();
      role = profile?.role || 'customer';
      hasPhone = !!profile?.phone;
    }

    if (role === 'customer' && !hasPhone) {
      return NextResponse.redirect(new URL('/complete-profile', request.url));
    }

    const redirectMap: Record<string, string> = {
      admin: '/admin',
      shop_admin: '/shop-admin',
      technician: '/technician',
      delivery: '/delivery',
      customer: '/dashboard',
    };
    const redirectTo = redirectMap[role] || '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};