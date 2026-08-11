import axiosInstance from '@/utils/axiosInstance';
import CategoryPageClient from './CategoryPageClient';

const fetchCategoryWithProducts = async (slug: string) => {
  try {
    const res = await axiosInstance.get(`/api/categories/slug/${slug}`);
    return res.data;
  } catch (error) {
    return null;
  }
};

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryData = await fetchCategoryWithProducts(slug);
  const categoryDetails = categoryData?.category;

  if (!categoryDetails) {
    return {
      title: 'الفئة غير موجودة - mhawed',
    };
  }

  return {
    title: `${categoryDetails.name} - mhawed`,
    description: `تصفح منتجات فئة ${categoryDetails.name} على mhawed. اكتشف أفضل المنتجات بأسعار مميزة.`,
    openGraph: {
      title: `${categoryDetails.name} - mhawed`,
      description: `تصفح منتجات فئة ${categoryDetails.name} على mhawed.`,
    },
  };
}

const page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const categoryData = await fetchCategoryWithProducts(slug);
  const categoryDetails = categoryData?.category;
  const products = categoryData?.products || [];
  const total = categoryData?.pagination?.total || 0;

  if (!categoryDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-gray-300 mb-4">404</h1>
          <p className="text-gray-600 text-lg mb-6">الفئة غير موجودة</p>
          <a
            href="/products"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            تسوق الآن
          </a>
        </div>
      </div>
    );
  }

  return (
    <CategoryPageClient
      category={categoryDetails}
      initialProducts={products}
      total={total}
      slug={slug}
    />
  );
};

// Add revalidation to cache the page (Next.js requires static number in prod)
export const revalidate = 3600;

export default page;
