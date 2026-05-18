// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
  
//   console.log('MIDDLEWARE HIT:', pathname); // ← yeh add karo
  
//   // ...baaki code same
// }

// // Add any routes you want to redirect to coming-soon
// const COMING_SOON_ROUTES = [
//   '/dashboard',
//   '/admin',
//   '/login',
//   '/signup',
//   '/register',
//   '/account',
//   '/profile',
//   '/orders',
//   '/book',
//   '/track',
//   '/delivery',
//   '/technician',
//   '/track',

// ];

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   const shouldRedirect = COMING_SOON_ROUTES.some(
//     (route) => pathname === route || pathname.startsWith(route + '/')
//   );

//   if (shouldRedirect) {
//     return NextResponse.redirect(new URL('/coming-soon', request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   // Run middleware on all routes except static files and API
//   matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
// };

// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// const COMING_SOON_ROUTES = [
//   '/dashboard',
//   '/admin',
//   '/login',
//   '/signup',
//   '/register',
//   '/account',
//   '/profile',
//   '/orders',
//   '/book',
//   '/track',
//   '/delivery',
//   '/technician',
// ];

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   console.log('MIDDLEWARE HIT:', pathname);

//   const shouldRedirect = COMING_SOON_ROUTES.some(
//     (route) => pathname === route || pathname.startsWith(route + '/')
//   );

//   if (shouldRedirect) {
//     return NextResponse.redirect(new URL('/coming-soon', request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
// };

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COMING_SOON_ROUTES = [
  '/dashboard',
  '/admin',
  '/login',
  '/signup',
  '/register',
  '/account',
  '/profile',
  '/orders',
  '/book',
  '/track',
  '/delivery',
  '/technician',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('MIDDLEWARE HIT:', pathname);

  const shouldRedirect = COMING_SOON_ROUTES.some(
    (route) =>
      pathname === route || pathname.startsWith(route + '/')
  );

  if (shouldRedirect) {
    return NextResponse.redirect(
      new URL('/coming-soon', request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};