'use client';

import { useAtom } from 'jotai';
import { atom } from 'jotai';
import { useEffect, useState } from 'react';

// Store atoms
const activeSidebarItemAtom = atom<string>('/dashboard');
const isSidebarOpenAtom = atom<boolean>(true);

export const useSidebar = () => {
  const [activeItem, setActiveItem] = useAtom(activeSidebarItemAtom);
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(isSidebarOpenAtom);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Optional: you might want to close sidebar by default on mobile if it was open
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    // Set initial value
    checkIsMobile();

    // Add resize listener
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [setIsSidebarOpen]);

  const setActive = (itemId: string) => {
    setActiveItem(itemId);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return {
    activeItem,
    setActive,
    isSidebarOpen,
    isMobile,
    toggleSidebar,
    openSidebar,
    closeSidebar,
  };
};
