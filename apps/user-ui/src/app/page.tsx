'use client';

import React from 'react';
import Hero from '@/components/modules/Hero';
import CategorySection from '@/app/shared/home/CategorySection';
import useLayout from '@/hooks/useLayout';
import { Category } from '@/hooks/useLayout';

export default function HomePage() {
  const { categories, isLoading } = useLayout();

  return (
    <main>
      <Hero />
      <div className="py-8">
        {isLoading ? (
          <div className="md:w-[80%] w-[90%] mx-auto space-y-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[380px] bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          (categories as Category[]).map((category) => (
            <CategorySection key={category.id} category={category} />
          ))
        )}
      </div>
    </main>
  );
}
