'use client';

import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../utils/axiosInstance';
import SectionTitle from '../../../components/section/section-title';
import ViewMoreButton from '../../../components/section/ViewMoreButton';
import ProductCard from '../../../components/cards/ProductCard';

interface CategorySectionProps {
  category: { id: string; name: string; slug: string };
  subtitle?: string;
  productLimit?: number;
}

export default function CategorySection({ category, subtitle, productLimit = 8 }: CategorySectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['category-home-products', category.slug],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/api/categories/slug/${category.slug}?page=1&limit=${productLimit}`,
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.products || data?.data?.products || [];

  if (!products.length && !isLoading) return null;

  return (
    <div className="md:w-[80%] w-[90%] my-12 m-auto">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-8">
        <SectionTitle
          title={category.name}
          subtitle={subtitle}
          alignment="right"
          variant="gradient-fancy"
          showBorder
          className="!mb-0"
        />
        <ViewMoreButton href={`/category/${category.slug}`} className="shrink-0 mt-2" />
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-200 h-[380px] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
