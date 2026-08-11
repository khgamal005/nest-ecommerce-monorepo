'use client';

import ProductCard from '../cards/ProductCard';
interface ProductImage {
  id: number;
  url: string;
  file_id: string;
}

interface Shop {
  id: string;
  name: string;
  category: string;
  address: string;
  ratings: number;
}
interface Product {
  id: string;
  title: string;
  slug: string;
  category: string;
  subCategory: string;
  short_description: string;
  stock: number;
  regular_price: number;
  sale_price: number;
  rating: number;
  colors: string[];
  tags: string[];
  brand: string;
  warranty: number;
  sizes: string[];
  cashOnDelivery: string;
  images: ProductImage[];
  shop: Shop;
  createdAt: string;
  ending_date: Date;
}

interface SuggestedProductsProps {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
}

export default function SuggestedProducts({
  products,
  isLoading,
  isError,
}: SuggestedProductsProps) {
  // Handle error state
  if (isError) {
    return (
      <div className="text-center py-8 text-red-500">
        فشل تحميل المنتجات. يرجى المحاولة مرة أخرى.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {isLoading
        ? [...Array(10)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-200 rounded-xl h-[380px] w-full"
            ></div>
          ))
        : products.map((product) => {
            const categoryName = product.category;
            return (
              <ProductCard
                key={product.id}
                product={product}
                isEvent={categoryName === 'Electronics'} // Example condition
                showShop={true}
              />
            );
          })}
    </div>
  );
}
