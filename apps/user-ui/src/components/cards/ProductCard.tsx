'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SafeImage } from '@/components/media';
import Link from 'next/link';
import {
  ShoppingBag,
  Store,
  Clock,
  Heart,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../store';
import useLocationTracking from '../../hooks/useLocationTracking';
import useDeviceTracking from '../../hooks/useDeviceTracking';
import useUser from '../../hooks/use-user';
import { formatEGP } from '../../utils/formatEGP';
import {
  CartProduct,
  CleanLocationInfo,
  ProductDetailsInfo,
  SelectedOption,
  ProductVariant,
} from '../../types/Product';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: any;
  isEvent?: boolean;
  showShop?: boolean;
}

function ProductCard({
  product,
  isEvent = false,
  showShop = true,
}: ProductCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const router = useRouter();

  // Zustand store
  const { cart, wishlist, addToCart, addToWishlist, removeFromWishlist } =
    useStore();

  // Get user from React Query
  const { user, isLoading: userLoading } = useUser();

  // NEW: Variant-based selection
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all images for the card (variant images or product images)
  const cardImages = React.useMemo(() => {
    const images: any[] = [];

    // For variant products: collect all images (product + all variant images)
    if (product.hasVariants) {
      // Add product images first
      if (product.images && product.images.length > 0) {
        images.push(...product.images);
      }

      // Add all variant images
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant: any) => {
          if (variant.images && variant.images.length > 0) {
            images.push(...variant.images);
          }
        });
      }
    } else {
      // For simple products: just product images
      if (product.images && product.images.length > 0) {
        images.push(...product.images);
      }
    }

    return images;
  }, [product]);

  const imageUrl =
    cardImages[currentImageIndex]?.url || cardImages[0]?.url || '';

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cardImages.length > 1) {
      setCurrentImageIndex((prev) =>
        prev > 0 ? prev - 1 : cardImages.length - 1,
      );
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cardImages.length > 1) {
      setCurrentImageIndex((prev) =>
        prev < cardImages.length - 1 ? prev + 1 : 0,
      );
    }
  };

  // ENRICHMENT LOGIC: Picks the best representative variant
  const { enrichedProduct, bestVariant } = useMemo(() => {
    // If no variants, just return product with basic data
    if (!product.hasVariants || !product.variants?.length) {
      return {
        enrichedProduct: {
          ...product,
          outOfStock: product.stock === 0,
        },
        bestVariant: null,
      };
    }

    // Filter only active variants
    const activeVariants =
      product.variants?.filter((v: any) => v.isActive !== false) || [];

    // If no active variants exist, mark product as out of stock
    if (!activeVariants.length) {
      return {
        enrichedProduct: {
          ...product,
          regular_price: 0,
          sale_price: 0,
          stock: 0,
          outOfStock: true,
        },
        bestVariant: null,
      };
    }

    // Filter variants that are in stock
    const inStockVariants = activeVariants.filter((v: any) => v.stock > 0);

    // If all variants are out of stock, fallback to showing lowest price but mark out of stock
    const variantsToConsider = inStockVariants.length
      ? inStockVariants
      : activeVariants;

    // Pick the variant with the lowest effective price
    const lowestPriceVariant = variantsToConsider.reduce(
      (prev: any, curr: any) => {
        const prevEffective = Number(prev.salePrice ?? prev.price);
        const currEffective = Number(curr.salePrice ?? curr.price);
        return currEffective < prevEffective ? curr : prev;
      },
    );

    return {
      enrichedProduct: {
        ...product,
        regular_price: lowestPriceVariant.price,
        sale_price: lowestPriceVariant.salePrice ?? 0,
        stock: lowestPriceVariant.stock,
        outOfStock: lowestPriceVariant.stock === 0,
      },
      bestVariant: lowestPriceVariant,
    };
  }, [product, product.variants]);

  // Sync selectedVariant with the bestVariant from enrichment
  useEffect(() => {
    if (bestVariant && (!selectedVariant || selectedVariant.id !== bestVariant.id)) {
      setSelectedVariant(bestVariant);
    }
  }, [bestVariant]);

  const locationData = useLocationTracking();
  const deviceData = useDeviceTracking();

  // Check if product is in wishlist
  const isWishlisted = wishlist.some((item) => item.productId === product.id);

  // Check if product is in cart (with quantity)
  const cartItem = cart.find((item) => {
    if (product.hasVariants && selectedVariant) {
      return (
        item.productId === product.id && item.variantId === selectedVariant.id
      );
    }
    return item.productId === product.id;
  });
  const cartQuantity = cartItem?.quantity || 0;

  const safeLocation: CleanLocationInfo = {
    ip: locationData?.ip ?? '0.0.0.0',
    latitude: locationData?.latitude ?? 0,
    longitude: locationData?.longitude ?? 0,
    country: locationData?.country ?? 'unknown',
    city: locationData?.city ?? 'unknown',
  };

  const mapProductToCartProduct = (
    product: ProductDetailsInfo,
    variant?: ProductVariant | null,
  ): CartProduct => {
    // Extract selected options from variant (for display)
    const selectedOptions: SelectedOption[] =
      variant?.optionValues?.map((ov: any) => ({
        name: ov.optionValue.option.name,
        value: ov.optionValue.value,
      })) || [];

    // MINIMAL cart item (OPTION A - BEST)
    return {
      productId: product.id,
      variantId: variant?.id,
      quantity: 1,
      price:
        variant?.salePrice ||
        variant?.price ||
        product.sale_price ||
        product.regular_price,

      // Display data (cached for UI)
      title: product.title,
      slug: product.slug,
      image: variant?.images?.[0]?.url || product.images?.[0]?.url || '',
      selectedOptions,
      stock: variant?.stock || product.stock,
      shopId: product.shopId || product.shop?.id || '',
      sellerId: product.sellerId || '',
    };
  };

  // Check if this is an event (product-level or variant-level)
  const isEventProduct = useMemo(() => {
    // Check product-level event
    if (isEvent || (product.starting_date && product.ending_date)) {
      return true;
    }

    // Check variant-level event
    if (product.hasVariants && selectedVariant) {
      return !!(selectedVariant.starting_date && selectedVariant.ending_date);
    }

    return false;
  }, [isEvent, product, selectedVariant]);

  // Get the ending date (from variant or product)
  const eventEndingDate = useMemo(() => {
    if (product.hasVariants && selectedVariant?.ending_date) {
      return selectedVariant.ending_date;
    }
    return product.ending_date;
  }, [product, selectedVariant]);

  useEffect(() => {
    if (!isEventProduct || !eventEndingDate) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const endingTime = new Date(eventEndingDate).getTime();
      const diff = endingTime - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(intervalId);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isEventProduct, eventEndingDate]);

  const handleWishlistToggle = () => {
    // If user is not logged in, redirect to login
    if (!user) {
      router.push(
        '/login?redirect=' + encodeURIComponent(window.location.pathname),
      );
      return;
    }

    // Prepare cart item for wishlist
    const wishlistItem =
      product.hasVariants && selectedVariant
        ? mapProductToCartProduct(product, selectedVariant)
        : mapProductToCartProduct(product, null);

    if (isWishlisted) {
      removeFromWishlist(product.id, user, safeLocation, deviceData);
    } else {
      addToWishlist(wishlistItem, user, safeLocation, deviceData);
    }
  };

  // const handleQuickAddToCart = (e: React.MouseEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();

  //   if (!user) {
  //     router.push(
  //       '/login?redirect=' + encodeURIComponent(window.location.pathname)
  //     );
  //     return;
  //   }

  //   if (product.stock === 0 || cartQuantity >= product.stock) return;

  //   addToCart(formatProductForCart(product), user, safeLocation, deviceData);
  // };

  const handleAddToCart = () => {
    if (!user) {
      router.push(
        '/login?redirect=' + encodeURIComponent(window.location.pathname),
      );
      return;
    }

    // 🔒 UNIVERSAL RULE: If product has variants, user MUST select one
    if (product.hasVariants && !selectedVariant) {
      console.error('❌ No variant selected for variant product');
      toast.error('يرجى اختيار مواصفات المنتج');
      return;
    }

    // Check if we can add more based on stock
    const availableStock =
      product.hasVariants && selectedVariant
        ? selectedVariant.stock
        : product.stock;

    if (availableStock === 0) {
      toast.error('المنتج غير متوفر في المخزون');
      return;
    }

    if (cartQuantity >= availableStock) {
      toast.success(`يتوفر فقط ${availableStock} قطع في المخزون`);
      return;
    }

    // Prepare cart item with proper variant selection
    const cartItemToAdd =
      product.hasVariants && selectedVariant
        ? mapProductToCartProduct(product, selectedVariant)
        : mapProductToCartProduct(product, null);

    // Use addToCart to increment quantity
    addToCart(cartItemToAdd, user, safeLocation, deviceData);
    toast.success('تمت الإضافة إلى السلة!');
  };

  // Get display price based on variant or product
  const displayPrice = useMemo(() => {
    if (product.hasVariants && selectedVariant) {
      return Number(selectedVariant.salePrice || selectedVariant.price);
    }
    return Number(enrichedProduct.sale_price || enrichedProduct.regular_price);
  }, [product.hasVariants, selectedVariant, enrichedProduct.sale_price, enrichedProduct.regular_price]);

  const regularPrice = useMemo(() => {
    if (product.hasVariants && selectedVariant) {
      return Number(selectedVariant.price);
    }
    return Number(enrichedProduct.regular_price);
  }, [product.hasVariants, selectedVariant, enrichedProduct.regular_price]);

  const hasSale = useMemo(() => {
    if (product.hasVariants && selectedVariant) {
      return Number(selectedVariant.salePrice) &&
        Number(selectedVariant.salePrice) < Number(selectedVariant.price);
    }
    return Number(enrichedProduct.sale_price) > 0 && Number(enrichedProduct.sale_price) < Number(enrichedProduct.regular_price);
  }, [product.hasVariants, selectedVariant, enrichedProduct.sale_price, enrichedProduct.regular_price]);

  const discountPercentage = hasSale
    ? Math.round(((regularPrice - displayPrice) / regularPrice) * 100)
    : 0;

  // Get variant options for display
  const variantOptions =
    selectedVariant?.optionValues?.map((ov: any) => ({
      name: ov.optionValue?.option?.name || '',
      value: ov.optionValue?.value || '',
    })) || [];

  // Out of stock logic using enriched data
  const isOutOfStock = useMemo(() => {
    if (product.hasVariants && selectedVariant) {
      return selectedVariant.stock === 0;
    }
    return enrichedProduct.outOfStock;
  }, [product.hasVariants, selectedVariant, enrichedProduct.outOfStock]);

  const currentStock = useMemo(() => {
    if (product.hasVariants && selectedVariant) {
      return selectedVariant.stock;
    }
    return enrichedProduct.stock;
  }, [product.hasVariants, selectedVariant, enrichedProduct.stock]);

  const maxStockReached = cartQuantity >= currentStock;
  const canAddToCart = !isOutOfStock && !maxStockReached && user;

  let buttonText = '';
  if (!user) buttonText = 'سجل لتضيف';
  else if (isOutOfStock) buttonText = 'نفذت الكمية';
  else if (maxStockReached) buttonText = `الحد الأقصى (${cartQuantity})`;
  else if (cartQuantity > 0)
    buttonText = `${cartQuantity} في السلة • أضف المزيد`;
  else buttonText = 'أضف إلى السلة';

  // Optional: Show loading state while user data is loading
  if (userLoading) {
    return (
      <div className="w-full bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 animate-pulse">
        <div className="h-56 w-full bg-gray-200" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="group w-full bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Image Container */}
      <div className="relative h-56 w-full overflow-hidden bg-gray-100">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {isEventProduct && (
            <span className="bg-linear-to-r from-red-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
              عرض محدود
            </span>
          )}

          {hasSale && (
            <span className="bg-linear-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
              خصم {discountPercentage}%
            </span>
          )}

          {currentStock <= 5 && currentStock > 0 && (
            <span className="bg-linear-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
              كمية محدودة
            </span>
          )}

          {isOutOfStock && (
            <span className="bg-linear-to-r from-gray-600 to-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
              نفذت الكمية
            </span>
          )}
        </div>

        {/* Quick Actions Column */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          {/* Wishlist Heart Icon */}
          <button
            onClick={handleWishlistToggle}
            className="bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all duration-200 shadow-md hover:shadow-lg"
            aria-label={
              isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
            }
            title={!user ? 'Please login to use wishlist' : ''}
          >
            <Heart
              size={18}
              className={`transition-all duration-300 ${
                isWishlisted
                  ? 'fill-red-500 text-red-500 scale-110'
                  : user
                    ? 'text-gray-700 hover:text-red-500'
                    : 'text-gray-400'
              }`}
            />
          </button>
        </div>

        {/* Product Image with Slider */}
        <Link
          href={`/product/${product.slug}`}
          className="block relative w-full h-full"
        >
          <SafeImage
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 300px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Image Navigation Arrows (only show if multiple images) */}
        {cardImages.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft size={16} className="text-gray-700" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight size={16} className="text-gray-700" />
            </button>

            {/* Image Dots Indicator */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex gap-1">
              {cardImages.map((_: any, index: number) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Add to Cart Button at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/60 to-transparent">
          <button
            onClick={handleAddToCart}
            className={`w-full py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              canAddToCart
                ? 'bg-white text-gray-800 hover:bg-gray-50'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!canAddToCart}
            title={!user ? 'Please login to add to cart' : ''}
          >
            <ShoppingBag size={16} />
            {buttonText}
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4">
        {/* Category & Shop */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-700 px-2 py-0.5 bg-slate-100 rounded uppercase tracking-wider">
            {typeof product.category === 'object'
              ? product.category?.name
              : product.category}
          </span>

          {showShop && product.shop && (
            <Link
              href={`/shop/${product.shop.slug || product.shop.id}`}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <Store size={10} />
              {product.shop.name}
            </Link>
          )}
        </div>

        {/* Brand Link */}
        {(() => {
          const brand = product.brand;
          const brandName =
            brand && typeof brand === 'object'
              ? (brand as any).name
              : brand || product.brandName;
          const brandSlug =
            brand && typeof brand === 'object' ? (brand as any).slug : null;
          const isVerified =
            brand && typeof brand === 'object' && (brand as any).verified;

          if (!brandName) return null;

          const linkHref = brandSlug
            ? `/brands/${brandSlug}`
            : `/brands/${brandName
                .toString()
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')}`;

          return (
            <Link
              href={linkHref}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-all uppercase tracking-wide flex items-center gap-1 mb-1"
            >
              {brandName}
              {isVerified && (
                <CheckCircle2
                  size={12}
                  className="text-blue-500 fill-blue-50"
                />
              )}
            </Link>
          );
        })()}

        {/* Product Title */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-10 group-hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Variant Options (if has variants) */}
        {product.hasVariants && variantOptions.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {variantOptions.map((option: any, index: number) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded"
              >
                {option.value}
              </span>
            ))}
          </div>
        )}


        {/* Event Timer */}
        {isEventProduct && timeLeft && timeLeft !== 'Expired' && (
          <div className="flex items-center gap-1 mb-4">
            <span className="inline-flex items-center gap-1 text-xs text-gray-600 px-2 py-1 bg-gray-50 rounded-md">
              <Clock size={10} />
              {timeLeft}
            </span>
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              {hasSale ? (
                <>
                  <span className="text-sm text-gray-500 line-through sm:order-2">
                    {formatEGP(regularPrice)}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900 sm:order-1">
                    {formatEGP(displayPrice)}
                  </span>
                </>
              ) : (
                <span className="text-lg sm:text-xl font-bold text-gray-900">
                  {formatEGP(displayPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
