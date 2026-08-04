import './globals.css';
import Providers from './providers';
import HeaderClient from './shared/header/HeaderClient';
import Footer from './shared/footer/Footer';

export const metadata = {
  title: 'Shop',
  description: 'Ecommerce storefront',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-screen flex-col bg-gray-50">
        <Providers>
          <HeaderClient />
          <main className="min-h-screen flex flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}