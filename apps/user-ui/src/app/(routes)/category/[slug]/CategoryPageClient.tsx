'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/cards/ProductCard';

interface CategoryPageClientProps {
  category: any;
  initialProducts: any[];
  total: number;
  slug: string;
}

const CategoryPageClient = ({
  category,
  initialProducts,
  total,
  slug,
}: CategoryPageClientProps) => {
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchProducts = async (newPage: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || ''
        }/api/categories/slug/${slug}?page=${newPage}&limit=${limit}`
      );
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setPage(newPage);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      fetchProducts(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      fetchProducts(page + 1);
    }
  };

  return (
    <div className="w-full bg-[#f5f5f5] pb-7">
      <div className="w-[90%] lg:w-[80%] m-auto">
        <div className="py-4">
          <h1 className="font-medium text-2xl mb-4 font-jots">
            {category.name}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              الرئيسية
            </Link>
            <ChevronRight size={14} className="text-gray-400 rotate-180" />
            <Link
              href="/products"
              className="hover:text-blue-600 transition-colors"
            >
              المنتجات
            </Link>
            <ChevronRight size={14} className="text-gray-400 rotate-180" />
            <span className="text-gray-800">{category.name}</span>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-gray-600">
          عرض {products.length} من {total} منتج
        </div>

        {products.length > 0 ? (
          <>
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${
                loading ? 'opacity-50' : ''
              }`}
            >
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={page === 1 || loading}
                    className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                  >
                    <ChevronRight size={16} />
                    السابق
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchProducts(pageNum)}
                          disabled={loading}
                          className={`w-10 h-10 rounded-md transition-colors ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={page === totalPages || loading}
                    className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                  >
                    التالي
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg">لا توجد منتجات في هذه الفئة</p>
            <Link
              href="/products"
              className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              تصفح جميع المنتجات
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPageClient;
