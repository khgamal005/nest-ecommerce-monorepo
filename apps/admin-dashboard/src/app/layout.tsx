import './globals.css';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Ecommerce admin dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Sidebar + topbar shell wraps dashboard route group; auth routes render standalone */}
        {children}
      </body>
    </html>
  );
}
