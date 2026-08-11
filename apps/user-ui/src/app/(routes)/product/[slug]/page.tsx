import ProductDetails from '@/components/modules/ProductDetails';
import axiosInstance from '@/utils/axiosInstance';

const fetchProductDetails = async (slug: string) => {
  try {
    const res = await axiosInstance.get(`/api/products/${slug}`);
    return res.data.product;
  } catch (error) {
    return null;
  }
};

// ✅ correct name + async params
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const productDetails = await fetchProductDetails(slug);

  if (!productDetails) {
    return {
      title: 'المنتج غير موجود - EasyShop',
    };
  }

  return {
    title: productDetails.title || 'EasyShop marketPlace',
    description:
      productDetails.short_description || 'discover high products on EasyShop',
    openGraph: {
      images: [productDetails.images?.[0]?.url],
      title: productDetails.title || 'EasyShop marketPlace',
      description:
        productDetails.short_description ||
        'discover high products on EasyShop',
    },
  };
}

// ✅ same fix here + add revalidation for caching
const page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const productDetails = await fetchProductDetails(slug);

  if (!productDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-gray-300 mb-4">404</h1>
          <p className="text-gray-600 text-lg mb-6">المنتج غير موجود</p>
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

  return <ProductDetails productDetails={productDetails} />;
};

// Add revalidation to cache the page (Next.js requires static number in prod)
export const revalidate = 3600;

export default page;
