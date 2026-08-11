'use client';

import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/utils/axiosInstance';
import { ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo } from 'react';
import BrandCard from '@/components/cards/BrandCard';
import useLayout from '@/hooks/useLayout';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export default function Page() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isMounted, setIsMounted] = useState(false);
  const { categories: hierarchicalCategories } = useLayout();

  // Fix hydration issues by waiting for mount
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // 1. Fetch all brands for the default view (All Brands)
  const { data: allBrandsData, isLoading: isAllBrandsLoading } = useQuery<Brand[]>({
    queryKey: ['allBrands'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/brands');
      return res.data.brands || res.data || [];
    },
    enabled: selectedCategories.length === 0,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch grouped brands when categories are selected
  // Added selectedCategories to queryKey to ensure 'this route call when user select from sidebar'
  const { data: groupedBrandsData, isLoading: isGroupedLoading } = useQuery<any[]>({
    queryKey: ['brandsGroupedByCategory', selectedCategories],
    queryFn: async () => {
      const query = selectedCategories.length > 0 ? `?categories=${selectedCategories.join(',')}` : '';
      const res = await axiosInstance.get(`/api/brands/grouped-by-category${query}`);
      return res.data.data || [];
    },
    enabled: selectedCategories.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Filter brands based on selection
  const displayBrands = useMemo(() => {
    if (selectedCategories.length === 0) {
      return allBrandsData || [];
    }
    
    // Server already filtered the data by categories, so we just flatten the brands
    const matchedBrandsMap = new Map<string, any>();
    (groupedBrandsData || []).forEach((group: any) => {
      group.brands.forEach((brand: any) => {
        matchedBrandsMap.set(brand.id || brand._id, brand);
      });
    });

    return Array.from(matchedBrandsMap.values());
  }, [allBrandsData, groupedBrandsData, selectedCategories]);

  const isLoading = selectedCategories.length === 0 ? isAllBrandsLoading : isGroupedLoading;

  if (!isMounted) {
    return (
      <div className="w-full bg-[#f5f5f5] pb-7 min-h-screen">
        <div className="w-[90%] lg:w-[80%] m-auto py-8">
          <div className="animate-pulse flex gap-6">
            <div className="w-64 bg-white h-96 rounded-lg opacity-50"></div>
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-white rounded-lg w-1/4 opacity-50"></div>
              <div className="grid grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-48 bg-white rounded-lg opacity-50"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f5f5f5] pb-7">
      <div className="w-[90%] lg:w-[80%] m-auto">
        <div className="py-4">
          <h1 className="font-medium text-2xl mb-4 font-jots">كل الماركات</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              الرئيسية
            </Link>
            <ChevronRight size={14} className="text-gray-400 rotate-180" />
            <span className="text-gray-800">كل الماركات</span>
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar - Mirrored from products/page.tsx */}
          <aside className="w-full lg:w-[25%] shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-20">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                <h3 className="font-medium text-lg text-gray-800">الفئات</h3>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    مسح الكل
                  </button>
                )}
              </div>

              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
                {hierarchicalCategories?.map((category: any) => (
                  <div key={category.id} className="space-y-1">
                    {/* Level 1 Category */}
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, category.id]);
                            } else {
                              setSelectedCategories(selectedCategories.filter((c) => c !== category.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 pointer-events-none"
                        />
                        <span className="mr-3 text-gray-800 font-medium text-sm">
                          {category.name}
                        </span>
                      </label>
                      {category.children && category.children.length > 0 && (
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="p-1 hover:bg-gray-100 rounded transition"
                        >
                          <ChevronDown
                            size={16}
                            className={`text-gray-500 transition-transform ${
                              expandedCategories[category.id] ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Level 2 & 3 Categories (Hidden by default, following product page style) */}
                    {expandedCategories[category.id] && category.children?.map((child: any) => (
                      <div key={child.id} className="mr-6">
                        <label className="flex items-center cursor-pointer group p-1.5 rounded-lg hover:bg-gray-50 transition">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(child.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, child.id]);
                              } else {
                                setSelectedCategories(selectedCategories.filter((c) => c !== child.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                          />
                          <span className="mr-3 text-gray-700 text-sm">{child.name}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-md mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : displayBrands.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center py-24 text-center">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">لا توجد ماركات</h2>
                <p className="text-sm text-gray-400">
                  {selectedCategories.length === 0 ? 'لا توجد ماركات متاحة حالياً' : 'لا توجد ماركات في الفئات المختارة'}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <p className="text-gray-600">
                    عرض <span className="font-semibold text-gray-900">{displayBrands.length}</span> ماركة
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayBrands.map((brand: any) => (
                    <div key={brand.id || brand._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <BrandCard brand={brand} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



