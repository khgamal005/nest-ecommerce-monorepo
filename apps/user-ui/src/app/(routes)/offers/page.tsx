'use client';
import axiosInstance from '@/utils/axiosInstance';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/cards/ProductCard';
import { formatEGP } from '@/utils/formatEGP';

import useLayout from '@/hooks/useLayout';
import { ChevronDown } from 'lucide-react';

const page = () => {
  const router = useRouter();
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [tempPriceRange, setTempPriceRange] = useState([0, 100000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const { categories: hierarchicalCategories, allCategories } = useLayout();

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };
  const MIN = 0;
  const MAX = 100000;
  const COLORS = [
    'red',
    'blue',
    'green',
    'black',
    'white',
    'yellow',
    'orange',
    'purple',
    'pink',
    'brown',
    'gray',
    'beige',
    'navy',
    'turquoise',
    'maroon',
    'gold',
    'silver',
    'cream',
    'olive',
    'teal',
  ];

  // Initialize tempPriceRange when priceRange changes from URL or other sources
  useEffect(() => {
    setTempPriceRange(priceRange);
  }, [priceRange]);

  // Initialize filters from URL (supports sharing links)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const priceRangeParam = searchParams.get('priceRange');
    const categoriesParam = searchParams.get('categories');
    const colorsParam = searchParams.get('colors');
    const pageParam = searchParams.get('page');

    if (priceRangeParam) {
      const [min, max] = priceRangeParam.split(',').map((n) => parseInt(n, 10));
      if (!Number.isNaN(min) && !Number.isNaN(max)) {
        setTempPriceRange([min, max]);
        setPriceRange([min, max]);
      }
    }

    if (categoriesParam) {
      const slugs = categoriesParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (slugs.length > 0) setSelectedCategories(slugs);
    }

    if (colorsParam) {
      const colors = colorsParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (colors.length > 0) setSelectedColors(colors);
    }

    if (pageParam) {
      const parsed = parseInt(pageParam, 10);
      if (!Number.isNaN(parsed) && parsed > 0) setPage(parsed);
    }

    setIsInitialized(true);
  }, []);

  const updateUrl = () => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('priceRange', priceRange.join(','));
    if (selectedCategories.length > 0)
      searchParams.set('categories', selectedCategories.join(','));
    if (selectedColors.length > 0)
      searchParams.set('colors', selectedColors.join(','));
    searchParams.set('limit', '12');
    searchParams.set('page', page.toString());
    // Stay on `/offers` while syncing filters to the URL.
    router.replace(`/offers?${decodeURIComponent(searchParams.toString())}`);
  };

  const fetchFilteredProducts = async () => {
    setIsProductsLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('priceRange', priceRange.join(','));

      // Convert category slugs to IDs
      if (selectedCategories.length > 0) {
        // Prefer the category ID when we have the category data,
        // but fall back to slugs so direct URLs like `categories=kids-fashion` still work.
        const categoryIds = selectedCategories
          .map((slug) => {
            const cat = allCategories?.find((c) => c.slug === slug);
            return cat ? cat.id : slug;
          })
          .filter(Boolean);

        if (categoryIds.length > 0) {
          query.set('categories', categoryIds.join(','));
        }
      }

      if (selectedColors.length > 0)
        query.set('colors', selectedColors.join(','));
      query.set('limit', '12');
      query.set('page', page.toString());

      const res = await axiosInstance.get(
        `/api/products?${query.toString()}`,
      );

      setProducts(res.data.products);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching recommended products:', error);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const handleApplyFilter = () => {
    // Update the actual price range and trigger API call
    setPriceRange(tempPriceRange);
    // Reset to page 1 when applying new filters
    setPage(1);
  };

  const handleResetFilter = () => {
    // Reset to default price range
    setTempPriceRange([0, 100000]);
    setPriceRange([0, 100000]);
    setPage(1);
  };

  useEffect(() => {
    if (!isInitialized) return;
    updateUrl();
    fetchFilteredProducts();
  }, [
    isInitialized,
    priceRange,
    page,
    selectedCategories,
    selectedColors,
    allCategories,
  ]);

  return (
    <div className="w-full bg-[#f5f5f5] pb-7">
      <div className="w-[90%] lg:w-[80%] m-auto">
        <div className="py-4">
          <h1 className="font-medium text-2xl mb-4 font-jots">كل العروض</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              الرئيسية
            </Link>
            <ChevronRight size={14} className="text-gray-400 rotate-180" />
            <span className="text-gray-800">كل العروض</span>
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-[25%]">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              {/* Price Filter Section */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg text-gray-800">
                    فلتر السعر
                  </h3>
                  {(tempPriceRange[0] !== 0 ||
                    tempPriceRange[1] !== 100000) && (
                    <button
                      onClick={handleResetFilter}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      إعادة ضبط
                    </button>
                  )}
                </div>

                {/* Range Slider */}
                <div className="px-4 py-8">
                  <div className="relative">
                    {/* Track Background */}
                    <div className="absolute w-full h-2 bg-gray-200 rounded-full top-4"></div>

                    {/* Active Track */}
                    <div
                      className="absolute h-2 bg-blue-500 rounded-full top-4"
                      style={{
                        left: `${((tempPriceRange[0] - MIN) / (MAX - MIN)) * 100}%`,
                        right: `${100 - ((tempPriceRange[1] - MIN) / (MAX - MIN)) * 100}%`,
                      }}
                    ></div>

                    {/* Thumbs */}
                    <div className="relative h-10">
                      {/* Min Thumb */}
                      <div
                        className="absolute w-8 h-8 bg-white border-4 border-blue-500 rounded-full shadow-lg cursor-grab active:cursor-grabbing z-20 -ml-4 -mt-2"
                        style={{
                          left: `${((tempPriceRange[0] - MIN) / (MAX - MIN)) * 100}%`,
                          top: '50%',
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const startX = e.clientX;
                          const startValue = tempPriceRange[0];
                          const trackWidth =
                            e.currentTarget.parentElement?.parentElement
                              ?.offsetWidth || 1;

                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            const deltaX = moveEvent.clientX - startX;
                            const deltaValue =
                              (deltaX / trackWidth) * (MAX - MIN);
                            const newValue = Math.max(
                              MIN,
                              Math.min(
                                tempPriceRange[1] - 1,
                                startValue + deltaValue,
                              ),
                            );
                            setTempPriceRange([
                              Math.round(newValue),
                              tempPriceRange[1],
                            ]);
                          };

                          const handleMouseUp = () => {
                            document.removeEventListener(
                              'mousemove',
                              handleMouseMove,
                            );
                            document.removeEventListener(
                              'mouseup',
                              handleMouseUp,
                            );
                          };

                          document.addEventListener(
                            'mousemove',
                            handleMouseMove,
                          );
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          const touch = e.touches[0];
                          const startX = touch.clientX;
                          const startValue = tempPriceRange[0];
                          const trackWidth =
                            e.currentTarget.parentElement?.parentElement
                              ?.offsetWidth || 1;

                          const handleTouchMove = (moveEvent: TouchEvent) => {
                            moveEvent.preventDefault();
                            const touch = moveEvent.touches[0];
                            const deltaX = touch.clientX - startX;
                            const deltaValue =
                              (deltaX / trackWidth) * (MAX - MIN);
                            const newValue = Math.max(
                              MIN,
                              Math.min(
                                tempPriceRange[1] - 1,
                                startValue + deltaValue,
                              ),
                            );
                            setTempPriceRange([
                              Math.round(newValue),
                              tempPriceRange[1],
                            ]);
                          };

                          const handleTouchEnd = () => {
                            document.removeEventListener(
                              'touchmove',
                              handleTouchMove,
                            );
                            document.removeEventListener(
                              'touchend',
                              handleTouchEnd,
                            );
                          };

                          document.addEventListener(
                            'touchmove',
                            handleTouchMove,
                            { passive: false },
                          );
                          document.addEventListener('touchend', handleTouchEnd);
                        }}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {formatEGP(tempPriceRange[0])}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>

                      {/* Max Thumb */}
                      <div
                        className="absolute w-8 h-8 bg-white border-4 border-blue-500 rounded-full shadow-lg cursor-grab active:cursor-grabbing z-20 -ml-4 -mt-2"
                        style={{
                          left: `${((tempPriceRange[1] - MIN) / (MAX - MIN)) * 100}%`,
                          top: '50%',
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const startX = e.clientX;
                          const startValue = tempPriceRange[1];
                          const trackWidth =
                            e.currentTarget.parentElement?.parentElement
                              ?.offsetWidth || 1;

                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            const deltaX = moveEvent.clientX - startX;
                            const deltaValue =
                              (deltaX / trackWidth) * (MAX - MIN);
                            const newValue = Math.max(
                              tempPriceRange[0] + 1,
                              Math.min(MAX, startValue + deltaValue),
                            );
                            setTempPriceRange([
                              tempPriceRange[0],
                              Math.round(newValue),
                            ]);
                          };

                          const handleMouseUp = () => {
                            document.removeEventListener(
                              'mousemove',
                              handleMouseMove,
                            );
                            document.removeEventListener(
                              'mouseup',
                              handleMouseUp,
                            );
                          };

                          document.addEventListener(
                            'mousemove',
                            handleMouseMove,
                          );
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          const touch = e.touches[0];
                          const startX = touch.clientX;
                          const startValue = tempPriceRange[1];
                          const trackWidth =
                            e.currentTarget.parentElement?.parentElement
                              ?.offsetWidth || 1;

                          const handleTouchMove = (moveEvent: TouchEvent) => {
                            moveEvent.preventDefault();
                            const touch = moveEvent.touches[0];
                            const deltaX = touch.clientX - startX;
                            const deltaValue =
                              (deltaX / trackWidth) * (MAX - MIN);
                            const newValue = Math.max(
                              tempPriceRange[0] + 1,
                              Math.min(MAX, startValue + deltaValue),
                            );
                            setTempPriceRange([
                              tempPriceRange[0],
                              Math.round(newValue),
                            ]);
                          };

                          const handleTouchEnd = () => {
                            document.removeEventListener(
                              'touchmove',
                              handleTouchMove,
                            );
                            document.removeEventListener(
                              'touchend',
                              handleTouchEnd,
                            );
                          };

                          document.addEventListener(
                            'touchmove',
                            handleTouchMove,
                            { passive: false },
                          );
                          document.addEventListener('touchend', handleTouchEnd);
                        }}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {formatEGP(tempPriceRange[1])}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Range Inputs */}
                <div className="flex gap-3 mt-6">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-2 font-medium">
                      الأدنى (ج.م)
                    </label>
                    <input
                      type="number"
                      min={MIN}
                      max={tempPriceRange[1]}
                      value={tempPriceRange[0]}
                      onChange={(e) => {
                        const value = Math.min(
                          Math.max(Number(e.target.value), MIN),
                          tempPriceRange[1] - 1,
                        );
                        setTempPriceRange([value, tempPriceRange[1]]);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-2 font-medium">
                      الأقصى (ج.م)
                    </label>
                    <input
                      type="number"
                      min={tempPriceRange[0]}
                      max={MAX}
                      value={tempPriceRange[1]}
                      onChange={(e) => {
                        const value = Math.max(
                          Math.min(Number(e.target.value), MAX),
                          tempPriceRange[0] + 1,
                        );
                        setTempPriceRange([tempPriceRange[0], value]);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Apply/Cancel Buttons */}
                <div className="flex flex-col gap-2 mt-6 w-full">
                  {JSON.stringify(tempPriceRange) !==
                    JSON.stringify(priceRange) && (
                    <button
                      onClick={handleApplyFilter}
                      className="w-full py-3 px-4 bg-blue-600 text-white font-bold text-sm lg:text-base rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-[0.98] min-h-11 flex items-center justify-center"
                    >
                      تطبيق الفلتر
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setTempPriceRange(priceRange);
                    }}
                    disabled={
                      JSON.stringify(tempPriceRange) ===
                      JSON.stringify(priceRange)
                    }
                    className={`w-full py-3 px-4 font-bold text-sm lg:text-base rounded-lg transition-all min-h-11 flex items-center justify-center ${
                      JSON.stringify(tempPriceRange) ===
                      JSON.stringify(priceRange)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:scale-[0.98]'
                    }`}
                  >
                    إلغاء
                  </button>
                </div>
              </div>

              {/* Category Filter Section */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
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

                <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                  {hierarchicalCategories?.map((category) => (
                    <div key={category.id} className="space-y-1">
                      {/* Level 1 Category */}
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.slug)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([
                                  ...selectedCategories,
                                  category.slug,
                                ]);
                              } else {
                                setSelectedCategories(
                                  selectedCategories.filter(
                                    (c) => c !== category.slug,
                                  ),
                                );
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
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
                                expandedCategories[category.id]
                                  ? 'rotate-180'
                                  : ''
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Level 2 Categories */}
                      {expandedCategories[category.id] &&
                        category.children &&
                        category.children.length > 0 && (
                          <div className="mr-6 space-y-1">
                            {category.children.map((level2) => (
                              <div key={level2.id} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <label className="flex-1 flex items-center cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition">
                                    <input
                                      type="checkbox"
                                      checked={selectedCategories.includes(
                                        level2.slug,
                                      )}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedCategories([
                                            ...selectedCategories,
                                            level2.slug,
                                          ]);
                                        } else {
                                          setSelectedCategories(
                                            selectedCategories.filter(
                                              (c) => c !== level2.slug,
                                            ),
                                          );
                                        }
                                      }}
                                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="mr-3 text-gray-700 text-sm">
                                      {level2.name}
                                    </span>
                                  </label>
                                  {level2.children &&
                                    level2.children.length > 0 && (
                                      <button
                                        onClick={() =>
                                          toggleCategory(level2.id)
                                        }
                                        className="p-1 hover:bg-gray-100 rounded transition"
                                      >
                                        <ChevronDown
                                          size={16}
                                          className={`text-gray-500 transition-transform ${
                                            expandedCategories[level2.id]
                                              ? 'rotate-180'
                                              : ''
                                          }`}
                                        />
                                      </button>
                                    )}
                                </div>

                                {/* Level 3 Categories */}
                                {expandedCategories[level2.id] &&
                                  level2.children &&
                                  level2.children.length > 0 && (
                                    <div className="mr-6 space-y-1">
                                      {level2.children.map((level3) => (
                                        <label
                                          key={level3.id}
                                          className="flex items-center cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(
                                              level3.slug,
                                            )}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedCategories([
                                                  ...selectedCategories,
                                                  level3.slug,
                                                ]);
                                              } else {
                                                setSelectedCategories(
                                                  selectedCategories.filter(
                                                    (c) => c !== level3.slug,
                                                  ),
                                                );
                                              }
                                            }}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                          />
                                          <span className="mr-3 text-gray-600 text-sm">
                                            {level3.name}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Filter Section */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg text-gray-800">الألوان</h3>
                  {selectedColors.length > 0 && (
                    <button
                      onClick={() => setSelectedColors([])}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      مسح الكل
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => {
                    const active = selectedColors.includes(color);

                    return (
                      <button
                        key={color}
                        onClick={() =>
                          setSelectedColors(
                            active
                              ? selectedColors.filter((c) => c !== color)
                              : [...selectedColors, color],
                          )
                        }
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-200 ${
                          active
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span
                          className="w-8 h-8 rounded-full border border-gray-300 shadow-inner"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs capitalize text-gray-700">
                          {color}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="w-full lg:w-[75%]">
            {/* Active Filters Display */}
            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gray-600">الفلاتر النشطة:</span>

                {/* Price Filter Badge */}
                {(priceRange[0] !== 0 || priceRange[1] !== 100000) && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    السعر: {formatEGP(priceRange[0])} -{' '}
                    {formatEGP(priceRange[1])}
                    <button
                      onClick={() => {
                        setPriceRange([0, 100000]);
                        setTempPriceRange([0, 100000]);
                        setSelectedCategories([]);
                        setSelectedColors([]);
                        setPage(1);
                      }}
                    >
                      ×
                    </button>
                  </span>
                )}

                {/* Category Badges */}
                {selectedCategories.map((categorySlug) => {
                  const category = allCategories?.find(
                    (c) => c.slug === categorySlug,
                  );
                  return (
                    <span
                      key={categorySlug}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {category?.name || categorySlug}
                      <button
                        onClick={() => {
                          setSelectedCategories(
                            selectedCategories.filter(
                              (c) => c !== categorySlug,
                            ),
                          );
                        }}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}

                {/* Color Badges */}
                {selectedColors.map((color) => (
                  <span
                    key={color}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                  >
                    {color}
                    <button
                      onClick={() => {
                        setSelectedColors(
                          selectedColors.filter((c) => c !== color),
                        );
                      }}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {isProductsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm p-4 animate-pulse"
                  >
                    <div className="h-48 bg-gray-200 rounded-md mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-gray-600">
                    عرض {products.length} من {products.length} منتج
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <ProductCard product={product} isEvent={true} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        السابق
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }).map(
                        (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`w-10 h-10 rounded-md ${
                                page === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'border hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}
                      <button
                        onClick={() =>
                          setPage((prev) => Math.min(prev + 1, totalPages))
                        }
                        disabled={page === totalPages}
                        className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        التالي
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default page;
