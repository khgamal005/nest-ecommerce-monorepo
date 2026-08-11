import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip auth check for public auth paths
  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/forget-password',
  ];
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const protectedPaths = [
    '/profile',
    '/cart',
    '/checkout',
    '/whishlist',
    '/chat',
    '/success',
    '/payment-failed',
  ];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));


  // Extract tokens from cookies
  const token = request.cookies.get('accessToken')?.value;


  // Check if access token is expired

  if (!token) {
    // Token valid, proceed
    return NextResponse.next();
  }

  // Token expired, attempt silent refresh
  if (!token) {
    if (isProtectedPath) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname + search);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  try {
    // Call refresh endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    const refreshResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/api/refresh-token`,
      {
        method: 'POST',
        headers: {
          Cookie: `refreshToken=${token}`,
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!refreshResponse.ok) {
      throw new Error('Refresh failed');
    }

    // Extract Set-Cookie headers
    const setCookieHeaders = refreshResponse.headers.getSetCookie();

    // Extract new access token value for x-access-token header
    const newAccessToken = setCookieHeaders
      .find((c) => c.startsWith('token='))
      ?.split(';')[0]
      ?.split('=')[1]
      ?.trim();

    const requestHeaders = new Headers(request.headers);
    if (newAccessToken) {
      requestHeaders.set('x-access-token', newAccessToken);
    }

    // Create response and append cookies
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    setCookieHeaders.forEach((cookie) => {
      response.headers.append('Set-Cookie', cookie);
    });

    if (newAccessToken) {
      response.headers.set('x-access-token', newAccessToken);
    }

    return response;
  } catch (error) {
    if (isProtectedPath) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname + search);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Clear invalid cookies
    const response = NextResponse.next();
    response.cookies.delete('token');

    return response;
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};