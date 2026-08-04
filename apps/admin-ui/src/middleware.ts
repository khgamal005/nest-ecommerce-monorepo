import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Restricts the whole app to admin/staff roles only.
// Reads the JWT (cookie or header), checks role claim, redirects to /login if not authorized.
export function middleware(request: NextRequest) {
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
  const token = request.cookies.get('admin_token')?.value;

  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // TODO: decode JWT, verify role is 'admin' | 'staff', else redirect/deny.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
