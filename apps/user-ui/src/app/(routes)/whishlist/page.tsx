'use client';
import { SafeImage } from '@/components/media';
import Link from 'next/link';
import {
  Heart,
  ShoppingBag,
  Trash2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useStore } from '@/store';
import toast from 'react-hot-toast';
import useLocationTracking from '@/hooks/useLocationTracking';
import { CleanLocationInfo } from '@/types/Product';
import { formatEGP } from '@/utils/formatEGP';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, addToCart } = useStore();
  const locationData = useLocationTracking();

  const safeLocation: CleanLocationInfo = {
    ip: locationData?.ip ?? '0.0.0.0',
    latitude: locationData?.latitude ?? 0,
    longitude: locationData?.longitude ?? 0,
    country: locationData?.country ?? 'unknown',
    city: locationData?.city ?? 'unknown',
  };

  // Get user and location info for tracking
  const getUserInfo = () => {
    // Get user from localStorage or your auth context
    const userStr = localStorage.getItem('user-storage');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      return parsed.state?.wishlist?.[0]?.trackingInfo?.user || null;
    }
    return null;
  };

  const handleRemoveFromWishlist = (id: string) => {
    const user = getUserInfo();
    const deviceInfo = navigator.userAgent;

    if (user) {
      removeFromWishlist(id, user, safeLocation, deviceInfo);
    } else {
      // Fallback if no user found
      removeFromWishlist(id, null, safeLocation, deviceInfo);
    }
  };

  const handleAddToCart = (product: any) => {
    const user = getUserInfo();
    const deviceInfo = navigator.userAgent;

    if (user) {
      addToCart(product, user, safeLocation, deviceInfo);
      toast.success(`${product.title} added to cart!`);
    } else {
      toast.error('Please login to add items to cart');
    }
  };

  const handleMoveAllToCart = () => {
    const user = getUserInfo();
    const deviceInfo = navigator.userAgent;

    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    let addedCount = 0;
    wishlist.forEach((product) => {
      addToCart(product, user, safeLocation, deviceInfo);
      addedCount++;
    });

    toast.success(`Added ${addedCount} items to cart!`);
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              قائمة الأمنيات فارغة
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              لم تقم بإضافة أي منتجات إلى قائمة الأمنيات بعد. ابدأ باستكشاف
              المنتجات التي تحبها!
            </p>
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                الاستمرار في التسوق
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                قائمة أمنياتي
              </h1>
              <p className="text-gray-600 mt-2">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}{' '}
                saved for later
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleMoveAllToCart}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ShoppingBag className="w-5 h-5 ml-2" />
                نقل الكل إلى السلة
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-gray-500 mt-4">
            <Link href="/" className="hover:text-blue-600">
              الرئيسية
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 rotate-180" />
            <span className="text-gray-900 font-medium">قائمة الأمنيات</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Wishlist Items */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {wishlist.map((item: any) => {
                  const hasSale =
                    (item.sale_price || item.salePrice || 0) > 0 &&
                    (item.sale_price || item.salePrice || 0) <
                      (item.regular_price ||
                        item.regularPrice ||
                        item.price ||
                        0);
                  const regularPrice =
                    item.regular_price || item.regularPrice || item.price || 0;
                  const salePrice = item.sale_price || item.salePrice || 0;
                  const discountPercentage = hasSale
                    ? Math.round(
                        ((regularPrice - salePrice) / regularPrice) * 100
                      )
                    : 0;

                  return (
                    <div
                      key={item.productId || item.id || Math.random()}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Product Image */}
                        <div className="relative w-full sm:w-48 h-48 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <SafeImage
                            src={item.image}
                            alt={item.title || 'Product'}
                            fill
                            sizes="192px"
                            className="object-cover"
                          />
                          {hasSale && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                              {discountPercentage}% خصم
                            </div>
                          )}
                          {(item.stock || 0) <= 5 && (item.stock || 0) > 0 && (
                            <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                              كمية محدودة
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    <Link
                                      href={`/product/${item.slug}`}
                                      className="hover:text-blue-600"
                                    >
                                      {item.title}
                                    </Link>
                                  </h3>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                  <div className="flex items-center gap-2 mb-1">
                                    {hasSale ? (
                                      <>
                                        <span className="text-xl font-bold text-gray-900">
                                          {formatEGP(salePrice)}
                                        </span>
                                        <span className="text-sm text-gray-500 line-through">
                                          {formatEGP(regularPrice)}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-xl font-bold text-gray-900">
                                        {formatEGP(regularPrice)}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {item.stock || 0} في المخزن
                                  </span>
                                </div>
                              </div>

                              {/* Colors and Sizes */}
                              <div className="flex flex-wrap gap-4 mb-4">
                                {/* Display selected options if available */}
                                {item.selectedOptions &&
                                  item.selectedOptions.length > 0 &&
                                  item.selectedOptions.map(
                                    (option: any, idx: number) => (
                                      <div key={idx}>
                                        <p className="text-sm text-gray-600 mb-2">
                                          {option.name}:
                                        </p>
                                        <div className="flex gap-2">
                                          {option.name.toLowerCase() ===
                                          'color' ? (
                                            <div
                                              className="w-6 h-6 rounded-full border border-gray-300 shadow-sm"
                                              style={{
                                                backgroundColor: option.value,
                                              }}
                                              title={option.value}
                                            />
                                          ) : (
                                            <span className="px-2 py-1 text-xs border border-gray-300 rounded">
                                              {option.value}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  )}
                              </div>

                              {/* Added Info */}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                              <button
                                onClick={() => handleAddToCart(item)}
                                disabled={(item.stock || 0) === 0}
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                  (item.stock || 0) > 0
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <ShoppingBag className="w-5 h-5" />
                                {(item.stock || 0) > 0
                                  ? 'إضافة إلى السلة'
                                  : 'نفذت الكمية'}
                              </button>

                              <button
                                onClick={() =>
                                  handleRemoveFromWishlist(
                                    item.productId || item.id || ''
                                  )
                                }
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-5 h-5 ml-2" />
                                حذف
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ملخص قائمة الأمنيات
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">إجمالي المنتجات</span>
                    <span className="font-medium">{wishlist.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">القيمة الإجمالية</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatEGP(
                        wishlist.reduce(
                          (acc, item: any) =>
                            acc +
                            (item.sale_price ||
                              item.salePrice ||
                              item.regular_price ||
                              item.regularPrice ||
                              item.price ||
                              0),
                          0
                        )
                      )}
                    </span>
                  </div>
                  <div className="pt-4 border-t">
                    <button
                      onClick={handleMoveAllToCart}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <ShoppingBag className="w-5 h-5 ml-2" />
                      نقل الكل إلى السلة
                    </button>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  قد يعجبك أيضاً
                </h3>
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    بناءً على قائمة أمنياتك، نعتقد أنك ستحب هذه المنتجات.
                  </p>
                  <Link
                    href="/products"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    تصفح المزيد من المنتجات
                    <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
