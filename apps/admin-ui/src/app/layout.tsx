import './globals.css';
import ReactQueryProvider from './providers/provider';
import { ToasterClient } from './shared/component/toast/ToasterClient';
import { Poppins, Roboto } from 'next/font/google';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`min-h-screen font-sans antialiased ${poppins.variable}`}
        suppressHydrationWarning
      >
        <ToasterClient />
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}