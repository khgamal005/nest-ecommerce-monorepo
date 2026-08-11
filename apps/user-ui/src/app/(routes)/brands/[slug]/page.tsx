'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import axiosInstance from '@/utils/axiosInstance';
import ProductCard from '@/components/cards/ProductCard';
import { SafeImage } from '@/components/media';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  verified: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const page = () => {
  const { slug } = useParams<{ slug: string }>();

  const [brand, setBrand] = useState<Brand | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ─── Fetch brand info ──────────────────────────────────────────────────────
  // Fetch brand and products
  useEffect(() => {
    if (!slug) return;
    const fetchBrandAndProducts = async () => {
      setIsProductsLoading(true);
      try {
        const query = new URLSearchParams();
        query.set('page', page.toString());
        query.set('limit', '12');

        const res = await axiosInstance.get(
          `/api/brands/${slug}/products?${query.toString()}`
        );

        if (res.data.success) {
          setBrand(res.data.brand);
          setProducts(res.data.products || []);
          setTotal(res.data.pagination?.total || 0);
          setTotalPages(res.data.pagination?.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to fetch brand and products:', err);
      } finally {
        setIsProductsLoading(false);
      }
    };
    fetchBrandAndProducts();
  }, [slug, page]);

  // ─── Enrich product helper ─────────────────────────────────────────────────

  const enrichProduct = (p: any) => {
    const defaultVariant = p.variants?.find((v: any) => v.isActive) || p.variants?.[0];
    return {
      ...p,
      regular_price: defaultVariant?.price || 0,
      sale_price: defaultVariant?.salePrice || 0,
      stock: defaultVariant?.stock || 0,
    };
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full bg-[#f5f5f5] pb-10 min-h-screen">
      <div className="w-[90%] lg:w-[80%] m-auto">

        {/* Breadcrumb */}
        <div className="py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">الرئيسية</Link>
            <ChevronRight size={14} className="text-gray-400 rotate-180" />
            <Link href="/brands" className="hover:text-blue-600 transition-colors">البراندات</Link>
            <ChevronRight size={14} className="text-gray-400 rotate-180" />
            <span className="text-gray-800">{brand?.name || slug || 'Unknown Brand'}</span>
          </div>
        </div>

        {/* Brand header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center gap-5">
          {/* Logo */}
          <div className="w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden relative">
            {brand?.logo ? (
              <SafeImage
                src={brand.logo}
                alt={brand.name}
                fill
                className="object-contain p-2"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-300 uppercase">
                {(brand?.name || slug)?.toString().charAt(0) || 'B'}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {brand?.name || slug}
              </h1>
              {brand?.verified && (
                <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium border border-blue-100">
                  <ShieldCheck size={12} />
                  براند موثق
                </span>
              )}
            </div>
            {!isProductsLoading && (
              <p className="text-sm text-gray-400 mt-1">
                {total} منتج متاح
              </p>
            )}
          </div>
        </div>

        {/* Products grid */}
        {isProductsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-md mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              لا توجد منتجات لهذا البراند
            </h2>
            <p className="text-sm text-gray-400 mb-4">لم يتم إضافة منتجات بعد</p>
            <Link
              href="/brands"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              العودة للبراندات
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <ProductCard product={enrichProduct(product)} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition text-sm"
                  >
                    السابق
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-md text-sm transition ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition text-sm"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default page;
