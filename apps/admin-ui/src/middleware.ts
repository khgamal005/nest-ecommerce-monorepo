import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public path — the login page lives at the root "/"
  const isLoginPath = pathname === '/';

  const protectedPaths = ['/dashboard'];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  const token = request.cookies.get('token')?.value;

  // Forward the token to the render pass so the server layout can seed the admin
  // synchronously on reload (no first-render flash / missing name).
  const requestHeaders = new Headers(request.headers);
  if (token) {
    requestHeaders.set('x-access-token', token);
  }

  if (!isLoginPath && !token) {
    if (isProtectedPath) {
      const redirectUrl = new URL('/', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};