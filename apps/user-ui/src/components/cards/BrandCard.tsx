'use client';

import React from 'react';
import { SafeImage } from '@/components/media';
import Link from 'next/link';

interface BrandCardProps {
  brand: {
    id: string;
    name: string;
    logo?: string;
    slug: string;
    verified?: boolean;
    count?: number;
  };
}

function BrandCard({ brand }: BrandCardProps) {
  return (
    <Link href={`/brands/${brand.slug}`} className="block h-full group">
      <div className="flex flex-col items-center p-6 text-center">
        <div className="w-24 h-24 relative mb-4 bg-white flex items-center justify-center">
          <SafeImage
            src={brand.logo}
            alt={brand.name}
            fill
            sizes="96px"
            useNextImage={false}
            className="object-contain"
          />
        </div>
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors uppercase text-sm tracking-wide">
          {brand.name}
        </h3>
        {brand.count !== undefined && (
          <p className="text-xs text-gray-500 mt-1">
            {brand.count} {brand.count === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>
    </Link>
  );
}

export default BrandCard;


