import './globals.css';
import ReactQueryProvider from './providers/provider';
import { ToasterClient } from './shared/component/toast/ToasterClient';
import { Poppins, Roboto } from 'next/font/google';
import { cookies, headers } from 'next/headers';

export const metadata = {
  title: 'متجرنا | لوحة التحكم',
  description: 'لوحة تحكم إدارة متجرنا',
  icons: {
    icon: '/favicon.png',
  },
};

export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

export const poppins = Poppins({
  weight: ['300', '400', '500', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const cookieStore = await cookies();
  const token =
    headersList.get('x-access-token') || cookieStore.get('token')?.value;
  const hasToken = !!token;

  let initialAdmin = null;
  if (token) {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
    const res = await fetch(`${API}/api/auth/me`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      initialAdmin = data?.user ?? null;
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`min-h-screen font-sans antialiased ${poppins.variable}`}
        suppressHydrationWarning
      >
        <ToasterClient />
        <ReactQueryProvider initialAdmin={initialAdmin} hasToken={hasToken}>
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}