'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import HeaderBottom from './HeaderBottom';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const HeaderDynamic = dynamic(() => import('./Header'), {
  loading: () => <HeaderSkeleton />,
});

function HeaderSkeleton() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <>
      <div className="w-full h-20 bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="w-[90%] py-5 h-full mx-auto flex items-center justify-between">
          <div className="flex-1 lg:flex-1">
            <Link href="/">
              <div className="w-24 h-20 bg-gray-200 rounded animate-pulse"></div>
            </Link>
          </div>
          <div className="hidden lg:flex flex-1 justify-end">
            <div className="flex items-center gap-6">
              <div className="w-28 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      {isHomePage && <HeaderBottom />}
    </>
  );
}

export default function HeaderClient() {
  return <HeaderDynamic />;
}
