import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Only routes that are entirely meaningless without an account.
// Everything else is accessible as a guest; individual pages prompt for
// login only when a specific action requires it (saving progress, purchasing…).
const PROTECTED_ROUTES = [
  '/notifications',
];

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|manifest.json|sw.js|icon|api).*)',
  ],
};
