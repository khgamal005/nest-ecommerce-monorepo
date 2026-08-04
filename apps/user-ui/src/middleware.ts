import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Storefront middleware: locale detection, cart cookie checks, etc.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
