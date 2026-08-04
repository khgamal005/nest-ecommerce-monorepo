import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const baseUrl = process.env.INTERNAL_API_URL || API_URL;
          const res = await fetch(`${baseUrl}/api/google-auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              image: user.image,
            }),
          });

          if (!res.ok) {
            console.error(
              'Failed to authenticate with backend:',
              await res.text()
            );
            return false;
          }

          const isProd = process.env.NODE_ENV === 'production';
          const cookieStore = await cookies();

          const setCookieHeaders = res.headers.getSetCookie?.() || [];
          for (const header of setCookieHeaders) {
            const parsed = parseSetCookie(header);
            if (parsed.name) {
              cookieStore.set(parsed.name, parsed.value, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'none' : 'lax',
                domain: isProd ? '.mahawed.com' : undefined,
                path: parsed.path || '/',
                maxAge: parsed.maxAge ?? undefined,
              });
            }
          }

          return true;
        } catch (error) {
          console.error('Google auth error:', error);
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
};

function parseSetCookie(header: string) {
  const parts = header.split(';').map((p) => p.trim());
  const [nameValue, ...attrs] = parts;
  const eqIdx = nameValue.indexOf('=');
  const name = eqIdx >= 0 ? nameValue.slice(0, eqIdx) : '';
  const value = eqIdx >= 0 ? nameValue.slice(eqIdx + 1) : '';
  let path = '/';
  let maxAge: number | undefined;
  for (const attr of attrs) {
    const lower = attr.toLowerCase();
    if (lower.startsWith('path=')) {
      path = attr.slice(5);
    } else if (lower.startsWith('max-age=')) {
      const v = parseInt(attr.slice(8), 10);
      if (!isNaN(v)) maxAge = v > 0 ? v * 1000 : 0;
    }
  }
  return { name, value, path, maxAge };
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
