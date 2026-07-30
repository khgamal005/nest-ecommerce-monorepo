import './globals.css';

export const metadata = {
  title: 'Shop',
  description: 'Ecommerce storefront',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
