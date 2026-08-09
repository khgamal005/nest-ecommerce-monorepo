'use client';

import { SideWrapper } from '../../shared/components/Sidebar/sidebar.style';
import SidebarWrapper from '../../shared/components/Sidebar/SidebarWrapper';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAdmin from '../../hooks/useAdmin';
import { useSidebar } from '../../hooks/useSidebar';
import { Menu } from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { admin, isLoading } = useAdmin();
  const { isSidebarOpen, isMobile, closeSidebar, toggleSidebar } = useSidebar();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push('/');
    }
  }, [admin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="flex h-full min-h-screen w-full max-w-full overflow-x-hidden bg-linear-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <SideWrapper
        className={`transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarWrapper />
      </SideWrapper>

      {/* Main Content */}
      <main
        className={`min-w-0 max-w-full flex-1 transition-all duration-300 ease-in-out ${
          isMobile ? 'pl-0' : isSidebarOpen ? 'lg:pl-70' : 'pl-0'
        }`}
      >
        <div className="max-w-full overflow-x-hidden overflow-y-auto min-h-dvh bg-linear-to-b from-slate-50 to-slate-100 p-4 md:p-8">
          {/* Toggle Sidebar Button - Fixed Position - Only render on client */}
          {isMounted && (
            <button
              onClick={toggleSidebar}
              className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          )}
          
          {/* Desktop Toggle Button - Inside content area - Only render on client */}
          {isMounted && (
            <button
              onClick={toggleSidebar}
              className="mb-4 p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors hidden lg:block"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          )}
          
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMounted && isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-80 md:hidden"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

export default Layout;
