'use client';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  WalletMinimal,
  Maximize2,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { SafeImage, SafeVideo } from '@/components/media';
import { useEffect, useState, useMemo, useRef } from 'react';
import { CursorImageZoom } from './CursorImageZoom';
import Ratings from './Ratings';
import ProductReviews from './ProductReviews';
import { ImageModal } from '../image-placeholder/ImageModal';
import { useStore } from '../../store';
import useLocationTracking from '../../hooks/useLocationTracking';
import useDeviceTracking from '../../hooks/useDeviceTracking';
import useUser from '../../hooks/use-user';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  CartProduct,
  CleanLocationInfo,
  ProductDetailsInfo,
  SelectedOption,
  ProductVariant,
} from '../../types/Product';
import ProductCard from '../cards/ProductCard';
import axiosInstance from '../../utils/axiosInstance';
import useLayout from '../../hooks/useLayout';
import { formatEGP } from '../../utils/formatEGP';

const ProductDetails = ({ productDetails }: { productDetails: any }) => {
  const {
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    addToWishlist,
    removeFromWishlist,
    decreaseQuantity,
  } = useStore();
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();

  const locationData = useLocationTracking();
  const deviceData = useDeviceTracking();

  const safeLocation: CleanLocationInfo = {
    ip: locationData?.ip ?? '0.0.0.0',
    latitude: locationData?.latitude ?? 0,
    longitude: locationData?.longitude ?? 0,
    country: locationData?.country ?? 'unknown',
    city: locationData?.city ?? 'unknown',
  };

  // Check if product is in wishlist
  const isWishlisted = wishlist.some(
    (item) => item.productId === productDetails.id
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  // ── FIX 1: Remove redundant currentMedia state ──────────────────────────
  // currentMedia is now DERIVED from currentIndex + currentMediaItems
  // This eliminates the dual-state problem that caused 2 re-renders per tap.

  const [showImageModal, setShowImageModal] = useState(false);

  // NEW: Variant-based selection
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Get images and videos based on selected variant or product media
  const allMedia = useMemo(() => {
    const media: Array<{
      url: string;
      type: 'image' | 'video';
      variantId?: string;
    }> = [];
    const uniqueUrls = new Set<string>();

    const addMedia = (url: string, type: 'image' | 'video', variantId?: string) => {
      if (!url) return;
      if (!uniqueUrls.has(url)) {
        uniqueUrls.add(url);
        media.push({ url, type, variantId });
      }
    };

    // 1. Basic product images (array)
    if (productDetails.images && productDetails.images.length > 0) {
      productDetails.images.forEach((img: any) => {
        addMedia(img.url, 'image');
      });
    }

    // 1.5 Fallback for single product image
    if (productDetails.image) {
      addMedia(productDetails.image, 'image');
    }

    // 2. Basic product videos (array)
    if (productDetails.videos && productDetails.videos.length > 0) {
      productDetails.videos.forEach((vid: any) => {
        addMedia(vid.cdn_url || vid.url, 'video');
      });
    }

    // 2.5 Fallback for single product video (singular/legacy field)
    if (productDetails.video_Url) {
      addMedia(productDetails.video_Url, 'video');
    }

    // 3. Variant media
    if (productDetails.variants && productDetails.variants.length > 0) {
      productDetails.variants.forEach((variant: any) => {
        if (variant.images && variant.images.length > 0) {
          variant.images.forEach((img: any) => {
            addMedia(img.url, 'image', variant.id);
          });
        }
        if (variant.videos && variant.videos.length > 0) {
          variant.videos.forEach((vid: any) => {
            addMedia(vid.cdn_url || vid.url, 'video', variant.id);
          });
        }
      });
    }

    return media;
  }, [productDetails]);

  const currentMediaItems = allMedia;

  // ── FIX 1 (continued): Derive currentMedia from index ───────────────────
  const currentMedia = useMemo(() => {
    if (currentMediaItems.length === 0) {
      // Fallback to first available media from productDetails
      if (productDetails.images?.[0]?.url) {
        return { url: productDetails.images[0].url, type: 'image' as const };
      }
      if (productDetails.videos?.[0]?.cdn_url || productDetails.videos?.[0]?.url) {
        return {
          url: productDetails.videos[0].cdn_url || productDetails.videos[0].url,
          type: 'video' as const,
        };
      }
      return { url: productDetails.image || '', type: 'image' as const };
    }
    const item = currentMediaItems[currentIndex] || currentMediaItems[0];
    return { url: item.url, type: item.type };
  }, [currentIndex, currentMediaItems, productDetails]);

  // ── FIX 3: Preload adjacent images to eliminate load delay ──────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Preload next image
    if (currentIndex < currentMediaItems.length - 1) {
      const next = currentMediaItems[currentIndex + 1];
      if (next.type === 'image') {
        const img = new window.Image();
        img.src = next.url;
      }
    }
    // Preload previous image
    if (currentIndex > 0) {
      const prev = currentMediaItems[currentIndex - 1];
      if (prev.type === 'image') {
        const img = new window.Image();
        img.src = prev.url;
      }
    }
  }, [currentIndex, currentMediaItems]);

  // Event detection and countdown timer
  const [eventTimeLeft, setEventTimeLeft] = useState<string>('');
  const [isSaleActive, setIsSaleActive] = useState<boolean>(false);

  // Check if this is an event (product-level or variant-level)
  const isEventProduct = useMemo(() => {
    if (productDetails.starting_date && productDetails.ending_date) {
      return true;
    }
    if (productDetails.hasVariants && selectedVariant) {
      return !!(selectedVariant.starting_date && selectedVariant.ending_date);
    }
    return false;
  }, [productDetails, selectedVariant]);

  // Get the event dates (from variant or product)
  const eventDates = useMemo(() => {
    if (
      productDetails.hasVariants &&
      selectedVariant?.starting_date &&
      selectedVariant?.ending_date
    ) {
      return {
        starting: selectedVariant.starting_date,
        ending: selectedVariant.ending_date,
      };
    }
    if (productDetails.starting_date && productDetails.ending_date) {
      return {
        starting: productDetails.starting_date,
        ending: productDetails.ending_date,
      };
    }
    return null;
  }, [productDetails, selectedVariant]);

  /** Noon-style spec tables */
  const specSections = useMemo(() => {
    const cs = productDetails.custom_specifications;
    if (!cs || typeof cs !== 'object') return [];

    if (Array.isArray((cs as any).groups)) {
      return (cs as { groups: { label?: string; specs?: { key?: string; value?: string }[] }[] })
        .groups.map((g) => ({
          title: g.label?.trim() || undefined,
          rows: (g.specs || [])
            .map((s) => ({
              key: String(s?.key ?? '').trim(),
              value: String(s?.value ?? '').trim(),
            }))
            .filter((r) => r.key || r.value),
        }))
        .filter((g) => g.rows.length > 0);
    }

    const entries = Object.entries(cs as Record<string, unknown>).filter(
      ([k]) => k !== 'groups'
    );
    if (entries.length === 0) return [];

    return [
      {
        title: undefined as string | undefined,
        rows: entries.map(([key, value]) => ({
          key,
          value:
            typeof value === 'object' && value !== null
              ? String(
                  (value as { label?: string }).label ?? JSON.stringify(value)
                )
              : String(value ?? ''),
        })),
      },
    ];
  }, [productDetails.custom_specifications]);

  // Countdown timer effect
  useEffect(() => {
    if (!isEventProduct || !eventDates) {
      setEventTimeLeft('');
      const hasSalePrice = productDetails.hasVariants && selectedVariant
        ? !!selectedVariant.salePrice
        : !!productDetails.sale_price;
      setIsSaleActive(hasSalePrice);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const startTime = new Date(eventDates.starting).getTime();
      const endTime = new Date(eventDates.ending).getTime();

      if (now < startTime) {
        const diff = startTime - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        setEventTimeLeft(`يبدأ في ${days}ي ${hours}س`);
        setIsSaleActive(false);
        return;
      }

      if (now > endTime) {
        setEventTimeLeft('انتهى العرض');
        setIsSaleActive(false);
        return;
      }

      setIsSaleActive(true);
      const diff = endTime - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setEventTimeLeft(`${days}ي ${hours}س ${minutes}د ${seconds}ث`);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [isEventProduct, eventDates, productDetails.hasVariants, selectedVariant, productDetails.sale_price]);

  // Find variant that matches selected options
  const findMatchingVariant = (
    options: Record<string, string>
  ): ProductVariant | null => {
    if (!productDetails.variants || productDetails.variants.length === 0)
      return null;

    const selectedOptionKeys = Object.keys(options);
    if (selectedOptionKeys.length === 0) return null;

    return (
      productDetails.variants.find((variant: any) => {
        const variantOptions = variant.optionValues || [];
        return selectedOptionKeys.every((key) => {
          const variantOption = variantOptions.find(
            (vo: any) =>
              vo.optionValue.option.name === key &&
              vo.optionValue.value === options[key]
          );
          return !!variantOption;
        });
      }) || null
    );
  };

  // Auto-select first variant on page load if product has variants
  useEffect(() => {
    if (
      productDetails.hasVariants &&
      productDetails.variants &&
      productDetails.variants.length > 0
    ) {
      const firstVariant = productDetails.variants[0];
      setSelectedVariant(firstVariant);

      const options: Record<string, string> = {};
      firstVariant.optionValues?.forEach((ov: any) => {
        options[ov.optionValue.option.name] = ov.optionValue.value;
      });
      setSelectedOptions(options);
    }
  }, [productDetails.hasVariants, productDetails.variants]);

  // Reset to first media when allMedia changes
  // ── FIX 1 (continued): Only update index, no more setCurrentMedia ────────
  useEffect(() => {
    if (allMedia.length > 0) {
      setCurrentIndex(0);
    }
  }, [allMedia]);

  const [quantity, setQuantity] = useState(1);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0,
    productDetails.sale_price || 1199,
  ]);

  const cartItem = cart.find((item) => {
    if (productDetails.hasVariants && selectedVariant) {
      return (
        item.productId === productDetails.id &&
        item.variantId === selectedVariant.id
      );
    }
    return item.productId === productDetails.id;
  });
  const currentCartQuantity = cartItem?.quantity || 0;

  const availableStock =
    productDetails.hasVariants && selectedVariant
      ? selectedVariant.stock
      : productDetails.stock;

  const maxQuantityToAdd = Math.max(0, availableStock - currentCartQuantity);

  const mapProductToCartProduct = (
    product: ProductDetailsInfo,
    variant?: ProductVariant | null
  ): CartProduct => {
    const selectedOptions: SelectedOption[] =
      variant?.optionValues?.map((ov: any) => ({
        name: ov.optionValue.option.name,
        value: ov.optionValue.value,
      })) || [];

    return {
      productId: product.id,
      variantId: variant?.id,
      quantity: 1,
      price: isSaleActive
        ? variant?.salePrice || product.sale_price || variant?.price || product.regular_price
        : variant?.price || product.regular_price,
      title: product.title,
      slug: product.slug,
      image: variant?.images?.[0]?.url || product.images?.[0]?.url || '',
      selectedOptions,
      stock: variant?.stock || product.stock,
      shopId: product.shopId,
      sellerId: product.sellerId,
    };
  };

  const cartItems = mapProductToCartProduct(productDetails, selectedVariant);

  // ── FIX 1 (continued): Navigation only updates index ────────────────────
  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const nextImage = () => {
    if (currentIndex < currentMediaItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // ── FIX 2: Touch/swipe support ───────────────────────────────────────────
  // Using refs instead of state to avoid re-renders during touch tracking.
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchMovingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchMovingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    // Only treat as swipe if horizontal movement dominates
    if (deltaX > deltaY && deltaX > 10) {
      touchMovingRef.current = true;
      e.preventDefault(); // Prevent scroll during horizontal swipe
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Only fire swipe if horizontal movement dominates and exceeds threshold
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        prevImage(); // Swipe right → previous
      } else {
        nextImage(); // Swipe left → next
      }
    }

    touchStartRef.current = null;
    touchMovingRef.current = false;
  };

  const handleWishlistToggle = () => {
    if (!user) {
      router.push(
        '/login?redirect=' + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    if (isWishlisted) {
      removeFromWishlist(productDetails.id, user, safeLocation, deviceData);
    } else {
      addToWishlist(cartItems, user, safeLocation, deviceData);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      router.push(
        '/login?redirect=' + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    if (productDetails.hasVariants && !selectedVariant) {
      toast.error('Please select product options');
      return;
    }

    if (currentCartQuantity >= availableStock) {
      toast.success(`فقط ${availableStock} قطع متوفرة في المخزن`);
      return;
    }

    addToCart(cartItems, user, safeLocation, deviceData);
    toast.success('تمت الإضافة إلى السلة!');
  };

  const handleDecrement = () => {
    if (!user) {
      router.push(
        '/login?redirect=' + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    if (currentCartQuantity > 1) {
      decreaseQuantity(
        productDetails.id,
        selectedVariant?.id,
        user,
        safeLocation,
        deviceData
      );
    } else if (currentCartQuantity === 1) {
      removeFromCart(
        productDetails.id,
        selectedVariant?.id,
        user,
        safeLocation,
        deviceData
      );
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push(
        '/login?redirect=' + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    if (productDetails.hasVariants && !selectedVariant) {
      toast.error('Please select product options');
      return;
    }

    if (availableStock === 0 || maxQuantityToAdd <= 0) return;

    addToCart(cartItems, user, safeLocation, deviceData);
    router.push('/cart');
  };

  const handleOptionSelect = (optionName: string, optionValue: string) => {
    const isColorOption =
      optionName.toLowerCase() === 'color' ||
      optionName.toLowerCase() === 'colour';
    const isFirstOption = productDetails.options?.[0]?.name === optionName;

    let newOptions: Record<string, string>;

    if (isColorOption || isFirstOption) {
      newOptions = { [optionName]: optionValue };
    } else {
      newOptions = { ...selectedOptions, [optionName]: optionValue };
    }

    setSelectedOptions(newOptions);

    const matchingVariant = findMatchingVariant(newOptions);
    let newlySelectedVariant = null;

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
      newlySelectedVariant = matchingVariant;
    } else {
      const partialMatch = productDetails.variants?.find((variant: any) => {
        return Object.entries(newOptions).every(([key, val]) =>
          variant.optionValues?.some(
            (ov: any) =>
              ov.optionValue.option.name === key && ov.optionValue.value === val
          )
        );
      });

      if (partialMatch) {
        setSelectedVariant(partialMatch);
        newlySelectedVariant = partialMatch;
      }
    }

    // ── FIX 1 (continued): Only update index when switching variant media ──
    if (newlySelectedVariant) {
      const firstVariantMedia =
        newlySelectedVariant.images?.[0] || newlySelectedVariant.videos?.[0];

      if (firstVariantMedia) {
        const mediaUrl = firstVariantMedia.cdn_url || firstVariantMedia.url;
        const mediaIndex = currentMediaItems.findIndex(
          (m) => m.url === mediaUrl
        );
        if (mediaIndex !== -1) {
          setCurrentIndex(mediaIndex);
        }
      }
    }
  };

  const fetchRecommendedProducts = async () => {
    try {
      const query = new URLSearchParams();
      query.set('priceRange', priceRange.join(','));
      query.set('limit', '4');
      query.set('page', '1');

      const res = await axiosInstance.get(
        `/api/products?${query.toString()}`
      );

      setRecommendedProducts(res.data.products);
    } catch (error) {
      console.error('Error fetching recommended products:', error);
    }
  };

  useEffect(() => {
    fetchRecommendedProducts();
  }, [priceRange]);

  return (
    <div className="w-full bg-slate-50 py-8 min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="w-[92%] max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-2 text-[13px] text-slate-500 font-medium flex-wrap">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            الرئيسية
          </Link>

          {productDetails.category?.parent?.parent && (
            <>
              <ChevronRight size={14} className="text-slate-400 rotate-180" />
              <Link
                href={`/products?category=${encodeURIComponent(
                  productDetails.category.parent.parent.slug
                )}`}
                className="hover:text-indigo-600 transition-colors"
              >
                {productDetails.category.parent.parent.name}
              </Link>
            </>
          )}

          {productDetails.category?.parent && (
            <>
              <ChevronRight size={14} className="text-slate-400 rotate-180" />
              <Link
                href={`/products?category=${encodeURIComponent(
                  productDetails.category.parent.slug
                )}`}
                className="hover:text-indigo-600 transition-colors"
              >
                {productDetails.category.parent.name}
              </Link>
            </>
          )}

          {productDetails.category && (
            <>
              <ChevronRight size={14} className="text-slate-400 rotate-180" />
              <Link
                href={`/products?category=${encodeURIComponent(
                  productDetails.category.slug
                )}`}
                className="hover:text-indigo-600 transition-colors"
              >
                {productDetails.category.name}
              </Link>
            </>
          )}

          <ChevronRight size={14} className="text-slate-400 rotate-180" />
          <span className="text-slate-800 font-semibold truncate max-w-[200px]">
            {productDetails.title}
          </span>
        </div>

        {!hasMounted ? (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-h-[600px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">جاري التحميل...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-10 lg:grid-cols-12 gap-10 p-6 lg:p-8">
          {/* Left Column - Images (4 columns) */}
          <div className="md:col-span-5 lg:col-span-4">
            {/* Main Image/Video */}
            <div className="relative border border-slate-200/60 rounded-2xl bg-white p-3 mb-5 shadow-sm min-h-[400px] flex items-center justify-center">
              {currentMedia.url && (
                // ── FIX 2 (continued): Touch handlers on the image container ──
                <div
                  className="w-full h-full flex items-center justify-center"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ touchAction: 'pan-y' }}
                >
                  {currentMedia.type === 'video' ? (
                    <div className="w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center relative z-0">
                      <SafeVideo
                        src={currentMedia.url}
                        controls
                        playsInline
                        muted
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {/* Desktop Zoom */}
                      <div className="hidden lg:block w-full">
                        <CursorImageZoom
                          src={currentMedia.url}
                          alt="Product Image"
                        />
                      </div>
                      {/* Mobile Image */}
                      <div className="lg:hidden relative w-full aspect-square rounded-2xl overflow-hidden">
                        <SafeImage
                          src={currentMedia.url}
                          alt="Mobile Product Image"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                          className="object-contain"
                          priority
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Media Navigation Arrows */}
              {currentMediaItems.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    disabled={currentIndex === 0}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-md bg-white/70 hover:bg-white border border-slate-200/50 shadow-md transition-all z-10 ${
                      currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                  >
                    <ChevronLeft
                      size={20}
                      className="text-slate-700 rotate-180"
                    />
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={currentIndex === currentMediaItems.length - 1}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-md bg-white/70 hover:bg-white border border-slate-200/50 shadow-md transition-all z-10 ${
                      currentIndex === currentMediaItems.length - 1
                        ? 'opacity-30 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <ChevronRight size={20} className="text-slate-700" />
                  </button>
                </>
              )}

              {/* Fullscreen Button - Only for images */}
              {currentMedia.type === 'image' && (
                <button
                  onClick={() => setShowImageModal(true)}
                  className="absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md bg-white/60 hover:bg-white border border-white/40 shadow-sm z-10 cursor-pointer transition-all active:scale-95"
                  title="تكبير الصورة"
                >
                  <Maximize2 size={18} className="text-slate-700" />
                </button>
              )}

              {/* Media Counter */}
              {currentMediaItems.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 backdrop-blur-md bg-slate-900/70 text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide z-10">
                  {currentIndex + 1} / {currentMediaItems.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery - Grid Layout */}
            <div className="grid grid-cols-4 gap-3">
              {currentMediaItems.map((media: any, index: number) => (
                <div
                  key={index}
                  // ── FIX 1 (continued): Thumbnail only sets index ───────────
                  className="relative cursor-pointer group"
                  onClick={() => setCurrentIndex(index)}
                >
                  <div
                    className={`relative w-full h-22 rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
                      currentIndex === index
                        ? 'border-2 border-indigo-500 ring-4 ring-indigo-500/10 scale-100'
                        : 'border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                        <Play size={24} className="text-white opacity-90 fill-white" />
                        <div className="absolute inset-0 bg-black/20" />
                      </div>
                    ) : (
                      <SafeImage
                        src={media?.url}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 25vw, 100px"
                        className="object-contain p-1"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Column - Product Info (5 columns) */}
          <div className="md:col-span-5 lg:col-span-5 space-y-7">
            {/* Product Title */}
            <div>
              <h1 className="text-2xl lg:text-[32px] font-bold text-slate-900 mb-2 tracking-tight leading-snug">
                {productDetails.title}
              </h1>

              {/* Brand Link directly under title */}
              {(() => {
                const brand = productDetails.brand;
                const brandName = (brand && typeof brand === 'object') ? (brand as any).name : (brand || productDetails.brandName);
                const brandSlug = (brand && typeof brand === 'object') ? (brand as any).slug : null;
                const isVerified = (brand && typeof brand === 'object') && (brand as any).verified;

                if (!brandName) return null;

                const linkHref = brandSlug
                  ? `/brands/${brandSlug}`
                  : `/brands/${brandName
                      .toString()
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '')}`;

                return (
                  <div className="mb-4 flex items-center gap-2">
                    <Link
                      href={linkHref}
                      className="text-[15px] font-bold text-indigo-600 hover:text-indigo-700 transition-all uppercase tracking-wide flex items-center gap-1.5"
                    >
                      {brandName}
                      {isVerified && (
                        <CheckCircle2 size={16} className="text-blue-500 fill-blue-50" />
                      )}
                    </Link>
                  </div>
                );
              })()}

              {/* Stock and Ratings Status */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span
                  className={`text-sm font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
                    productDetails.stockStatus === 'In Stock' ||
                    productDetails.stock > 0 ||
                    availableStock > 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${availableStock > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                  {productDetails.stockStatus === 'In Stock'
                    ? 'في المخزن'
                    : productDetails.stockStatus || 'متوفر'}
                </span>
              </div>

              {/* Ratings and Reviews */}
              <div className="inline-flex items-center gap-4 mt-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <div className="flex items-center">
                  <Ratings rating={productDetails.rating || 0} />
                  <span className="ml-2 text-sm text-slate-600 font-medium">
                    ({productDetails.reviewCount || 0} تقييمات)
                  </span>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="space-y-3 p-5 bg-linear-to-br from-slate-50 to-white border border-slate-200/60 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 flex-wrap">
                {productDetails.hasVariants && selectedVariant ? (
                  <>
                    <span className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                      <span className="text-xl lg:text-2xl text-slate-500 font-medium mr-1 tracking-normal">EGP</span>
                      {formatEGP(
                        (isSaleActive && selectedVariant.salePrice) || selectedVariant.price || 0
                      )}
                    </span>
                    {isSaleActive && selectedVariant.salePrice &&
                      selectedVariant.salePrice < selectedVariant.price && (
                        <div className="flex flex-col">
                          <span className="text-lg text-slate-400 line-through decoration-slate-300 font-medium">
                            EGP {formatEGP(selectedVariant.price || 0)}
                          </span>
                          <span className="text-rose-600 text-sm font-bold bg-rose-50 px-2.5 py-0.5 rounded-md w-fit">
                            وفر{' '}
                            {formatEGP(
                              (selectedVariant.price || 0) -
                                (selectedVariant.salePrice || 0)
                            )}
                          </span>
                        </div>
                      )}
                  </>
                ) : (
                  <>
                    <span className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                      <span className="text-xl lg:text-2xl text-slate-500 font-medium mr-1 tracking-normal">EGP</span>
                      {formatEGP(
                        (isSaleActive && productDetails.sale_price) ||
                          productDetails.regular_price ||
                          0
                      )}
                    </span>
                    {isSaleActive && productDetails.sale_price &&
                      productDetails.sale_price <
                        productDetails.regular_price && (
                        <div className="flex flex-col">
                          <span className="text-lg text-slate-400 line-through decoration-slate-300 font-medium">
                            EGP {formatEGP(productDetails.regular_price || 0)}
                          </span>
                          <span className="text-rose-600 text-sm font-bold bg-rose-50 px-2.5 py-0.5 rounded-md w-fit">
                            وفر{' '}
                            {formatEGP(
                              (productDetails.regular_price || 0) -
                                (productDetails.sale_price || 0)
                            )}
                          </span>
                        </div>
                      )}
                  </>
                )}
              </div>
              <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block"></span> شامل كل الضرائب</p>
            </div>

            {/* Event Timer */}
            {isEventProduct &&
              eventTimeLeft &&
              eventTimeLeft !== 'Event Ended' && (
                <div className="p-5 bg-linear-to-l from-rose-50 to-pink-50/50 border border-rose-200/60 rounded-2xl shadow-[0_2px_10px_rgb(225,29,72,0.05)]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-1.5">
                        <span className="animate-pulse">●</span> عرض محدود
                      </div>
                      <div className="text-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 mb-0.5">
                          ينتهي في
                        </p>
                        <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                          {eventTimeLeft}
                        </p>
                      </div>
                    </div>
                    {eventDates && (
                      <div className="text-start sm:text-end text-sm text-slate-500 bg-white/60 px-3 py-2 rounded-xl">
                        <p className="font-medium text-slate-700">
                          {new Date(eventDates.ending).toLocaleDateString()}
                        </p>
                        <p className="text-xs mt-0.5">
                          {new Date(eventDates.ending).toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Event Ended Message */}
            {isEventProduct && eventTimeLeft === 'Event Ended' && (
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                    انتهى العرض
                  </div>
                  <p className="text-slate-600 font-medium">انتهت صلاحية هذا العرض الخاص</p>
                </div>
              </div>
            )}

            {/* Option-based Variant Selection */}
            {productDetails.hasVariants &&
            productDetails.options &&
            productDetails.options.length > 0 ? (
              <div className="space-y-5">
                <h3 className="text-slate-900 font-bold text-lg border-b border-slate-100 pb-2">
                  اختر الخيارات
                </h3>

                {productDetails.options.map((option: any) => {
                  const optionNameLC = option.name.toLowerCase().trim();
                  const isColorOption =
                    optionNameLC === 'color' ||
                    optionNameLC === 'colour' ||
                    optionNameLC === 'اللون' ||
                    optionNameLC === 'لون';

                  const getAvailableValues = (optionName: string) => {
                    if (isColorOption) {
                      return option.values.map((value: any) => {
                        const hasStock = productDetails.variants?.some(
                          (variant: any) =>
                            variant.optionValues?.some(
                              (ov: any) =>
                                ov.optionValue.option.name === optionName &&
                                ov.optionValue.value === value.value &&
                                variant.stock > 0
                            )
                        );
                        return { ...value, hasStock };
                      });
                    }

                    if (Object.keys(selectedOptions).length === 0) {
                      return option.values.filter((value: any) =>
                        productDetails.variants?.some((variant: any) =>
                          variant.optionValues?.some(
                            (ov: any) =>
                              ov.optionValue.option.name === optionName &&
                              ov.optionValue.value === value.value &&
                              variant.stock > 0
                          )
                        )
                      );
                    }

                    const otherSelectedOptions = { ...selectedOptions };
                    delete otherSelectedOptions[optionName];

                    const matchingVariants = productDetails.variants?.filter(
                      (variant: any) => {
                        return Object.entries(otherSelectedOptions).every(
                          ([key, val]) =>
                            variant.optionValues?.some(
                              (ov: any) =>
                                ov.optionValue.option.name === key &&
                                ov.optionValue.value === val
                            )
                        );
                      }
                    );

                    const availableValues = new Set();
                    matchingVariants?.forEach((variant: any) => {
                      if (variant.stock > 0) {
                        variant.optionValues?.forEach((ov: any) => {
                          if (ov.optionValue.option.name === optionName) {
                            availableValues.add(ov.optionValue.value);
                          }
                        });
                      }
                    });

                    return option.values.filter((value: any) =>
                      availableValues.has(value.value)
                    );
                  };

                  const availableValues = getAvailableValues(option.name);

                  const displayValues = option.values.map((value: any) => {
                    const hasStock = isColorOption
                      ? productDetails.variants?.some((variant: any) =>
                          variant.optionValues?.some(
                            (ov: any) =>
                              ov.optionValue.option.name === option.name &&
                              ov.optionValue.value === value.value &&
                              variant.stock > 0
                          )
                        )
                      : availableValues.some(
                          (av: any) => av.value === value.value
                        );
                    return { ...value, hasStock };
                  });

                  return (
                    <div key={option.id} className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900">
                          {option.name}
                        </h4>
                        {selectedOptions[option.name] && (
                          <span className="text-sm text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                            {selectedOptions[option.name]}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {displayValues.map((value: any) => {
                          const isSelected =
                            selectedOptions[option.name] === value.value;
                          const isAvailable = value.hasStock;

                          return (
                            <button
                              key={value.id}
                              disabled={!isAvailable}
                              onClick={() =>
                                isAvailable &&
                                handleOptionSelect(option.name, value.value)
                              }
                              className={`
                                px-4 py-2.5 rounded-xl border text-[14px] font-semibold transition-all duration-200
                                ${
                                  isSelected
                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-600 ring-offset-1'
                                    : isAvailable
                                    ? 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700'
                                    : `border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed decoration-slate-300/70 ${!isColorOption ? 'line-through' : ''}`
                                }
                              `}
                            >
                              {value.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Show selected variant info */}
                {selectedVariant && (
                  <div className="mt-5 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-indigo-900 mb-1 opacity-80">
                          المحدد:{' '}
                          {Object.entries(selectedOptions)
                            .map(([key, val]) => `${key}: ${val}`)
                            .join('، ')}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[17px] font-bold text-slate-900">
                            EGP{' '}
                            {Number(
                              (isSaleActive && selectedVariant.salePrice) || selectedVariant.price
                            ).toFixed(2)}
                          </span>
                          {isSaleActive && selectedVariant.salePrice &&
                            Number(selectedVariant.salePrice) <
                              Number(selectedVariant.price) && (
                              <span className="text-sm text-slate-400 line-through decoration-slate-300 font-medium">
                                EGP {Number(selectedVariant.price).toFixed(2)}
                              </span>
                            )}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                          selectedVariant.stock > 0
                            ? 'bg-emerald-100/50 text-emerald-700'
                            : 'bg-rose-100/50 text-rose-700'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedVariant.stock > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                        {selectedVariant.stock > 0
                          ? `${selectedVariant.stock} في المخزن`
                          : 'غير متوفر'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Short Description */}
            {productDetails.short_description && (
              <div>
                <h3 className="text-lg font-bold mb-2 text-slate-900">
                  الوصف
                </h3>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  {productDetails.short_description}
                </p>
              </div>
            )}

            {/* Detailed Description */}
            {productDetails.detailed_description && (
              <div>
                <h3 className="text-lg font-bold mb-2 text-slate-900">
                  وصف تفصيلي
                </h3>
                <div className="overflow-x-auto">
                  <div
                    className="text-slate-600 text-sm md:text-base leading-relaxed break-words 
                    [&>img]:max-w-full [&>img]:h-auto 
                    [&>table]:w-full [&>table]:border-collapse 
                    [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pr-6 [&>ol]:list-decimal [&>ol]:pr-6 
                    [&>h1]:text-xl [&>h2]:text-lg [&>h3]:text-base [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-bold 
                    [&>h1]:mt-4 [&>h2]:mt-3 [&>h3]:mt-3 [&>h1]:mb-2 [&>h2]:mb-2 [&>h3]:mb-2 
                    [&>a]:text-blue-600 [&>a]:underline 
                    [&>blockquote]:border-r-4 [&>blockquote]:border-blue-500 [&>blockquote]:pr-4 [&>blockquote]:my-3 [&>blockquote]:italic"
                    dangerouslySetInnerHTML={{
                      __html: productDetails.detailed_description,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Brand */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-slate-900">
                العلامة التجارية
              </h3>
              <p className="text-slate-600 text-[15px] leading-relaxed flex items-center gap-2">
                {(() => {
                  const brand = productDetails.brand;
                  const brandName = (brand && typeof brand === 'object') ? (brand as any).name : (brand || productDetails.brandName);
                  const isVerified = (brand && typeof brand === 'object') && (brand as any).verified;

                  if (!brandName) return 'غير متوفر';

                  return (
                    <>
                      {brandName}
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 text-[13px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 size={14} className="fill-blue-50" />
                          موثق
                        </span>
                      )}
                    </>
                  );
                })()}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">الكمية</p>
                {!user && (
                  <p className="text-sm font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">
                    يرجى تسجيل الدخول لتعديل الكمية
                  </p>
                )}
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={handleDecrement}
                    disabled={currentCartQuantity <= 0 || !user}
                    className="px-4 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors font-medium text-lg"
                  >
                    -
                  </button>
                  <span className="px-5 py-2.5 border-x border-slate-200 min-w-[64px] text-center font-bold text-slate-800">
                    {currentCartQuantity || 0}
                  </span>
                  <button
                    onClick={handleAddToCart}
                    disabled={
                      currentCartQuantity >= availableStock ||
                      !user ||
                      availableStock === 0
                    }
                    className="px-4 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors font-medium text-lg"
                  >
                    +
                  </button>
                </div>
                <span className="text-[15px] text-slate-500 font-medium">
                  {availableStock > 0 ? (
                    <>
                      متوفر {availableStock} قطع
                      {currentCartQuantity > 0 && (
                        <span className="text-indigo-600 ml-1.5 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md text-sm">
                          ({currentCartQuantity} في السلة)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-md">غير متوفر</span>
                  )}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 pt-6 border-t border-slate-100">
              <button
                onClick={handleAddToCart}
                disabled={
                  !user ||
                  availableStock === 0 ||
                  maxQuantityToAdd <= 0 ||
                  (productDetails.hasVariants && !selectedVariant)
                }
                className="flex-4 flex items-center justify-center gap-2.5 bg-indigo-600 text-white py-3.5 px-6 rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/25 active:scale-[0.98] transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed"
                title={
                  !user
                    ? 'يرجى تسجيل الدخول للإضافة إلى السلة'
                    : productDetails.hasVariants && !selectedVariant
                    ? 'يرجى اختيار خيارات المنتج'
                    : availableStock === 0
                    ? 'غير متوفر'
                    : ''
                }
              >
                <ShoppingBag size={20} strokeWidth={2.5} />
                {!user
                  ? 'سجل الدخول للإضافة'
                  : productDetails.hasVariants && !selectedVariant
                  ? 'اختر الخيارات'
                  : availableStock > 0
                  ? maxQuantityToAdd > 0
                    ? currentCartQuantity > 0
                      ? 'إضافة المزيد للسلة'
                      : 'أضف للسلة'
                    : 'الحد الأقصى'
                  : 'غير متوفر'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={
                  !user ||
                  availableStock === 0 ||
                  maxQuantityToAdd <= 0 ||
                  (productDetails.hasVariants && !selectedVariant)
                }
                className="flex-4 flex items-center justify-center gap-2.5 bg-emerald-600 text-white py-3.5 px-6 rounded-xl font-bold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/25 active:scale-[0.98] transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed"
                title={
                  !user
                    ? 'يرجى تسجيل الدخول للشراء الآن'
                    : productDetails.hasVariants && !selectedVariant
                    ? 'يرجى اختيار خيارات المنتج'
                    : availableStock === 0
                    ? 'غير متوفر'
                    : ''
                }
              >
                {!user
                  ? 'سجل الدخول للشراء'
                  : productDetails.hasVariants && !selectedVariant
                  ? 'اختر الخيارات'
                  : availableStock === 0
                  ? 'غير متوفر'
                  : currentCartQuantity > 0
                  ? 'إتمام الشراء'
                  : 'اشتري الآن'}
              </button>

              <button
                onClick={handleWishlistToggle}
                disabled={!user}
                className="flex-none p-3.5 w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all hover:shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                aria-label={
                  isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
                }
                title={!user ? 'Please login to use wishlist' : ''}
              >
                <Heart
                  size={24}
                  strokeWidth={2}
                  className={`transition-colors duration-300 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400 group-hover:text-rose-400'}`}
                />
              </button>
            </div>
          </div>

          {/* Right Column - Seller & Product Info (3 columns) */}
          <div className="md:col-span-10 lg:col-span-3 space-y-6">
            {/* Tags Card */}
            {productDetails.tags && productDetails.tags.length > 0 && (
              <div className="border border-slate-200/60 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">الضمان</h3>
                <div className="flex flex-wrap gap-2.5">
                  {productDetails.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3.5 py-1.5 bg-indigo-50/80 text-indigo-700 rounded-full text-sm font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Warranty Card */}
            {productDetails.warranty && (
              <div className="border border-slate-200/60 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">
                  الضمان
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                      <WalletMinimal size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-none mb-1">الضمان متوفر</p>
                      <p className="text-[13px] text-slate-500 font-medium">
                        {productDetails.warranty}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

        {/* Product Details & Reviews Section */}
        <div className="mt-12 space-y-8">
          {/* Specifications */}
          {specSections.length > 0 && (
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  المواصفات
                </h3>
              </div>

              {specSections.map((section, si) => (
                <div key={si}>
                  {section.title ? (
                    <h4 className="px-6 py-3.5 text-base font-semibold text-slate-800 bg-white border-b border-slate-50">
                      {section.title}
                    </h4>
                  ) : null}

                  <div className="overflow-x-auto">
                    <table
                      className="w-full min-w-[260px] border-collapse text-start"
                      dir="rtl"
                    >
                      <tbody>
                        {section.rows.map((row, ri) => (
                          <tr
                            key={`${si}-${ri}`}
                            className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors"
                          >
                            <th
                              scope="row"
                              className="w-[40%] max-w-[220px] align-top py-4 px-6 text-[15px] font-semibold text-slate-700 bg-slate-50/30 border-e border-slate-100"
                            >
                              {row.key}
                            </th>
                            <td className="align-top py-4 px-6 text-[15px] text-slate-700 leading-relaxed bg-white">
                              {row.value || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Return Policy Info */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                سياسة الإرجاع
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table
                className="w-full min-w-[260px] border-collapse text-start"
                dir="rtl"
              >
                <tbody>
                  <tr className="border-b border-slate-50 last:border-b-0">
                    <th
                      scope="row"
                      className="w-[40%] max-w-[220px] align-top py-4 px-6 text-[15px] font-semibold text-slate-700 bg-slate-50/30 border-e border-slate-100"
                    >
                      قابل للإرجاع
                    </th>
                    <td className="align-top py-4 px-6 text-[15px] text-slate-700 leading-relaxed bg-white">
                      <span className={`font-semibold px-2.5 py-1 rounded-md ${productDetails.isReturnable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {productDetails.isReturnable ? 'نعم قابل للإرجاع' : 'لا غير قابل للإرجاع'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Reviews Section */}
          <ProductReviews
            productId={productDetails.id}
            productTitle={productDetails.title}
            userId={user?.id}
          />

          {/* Recommended Products */}
          {recommendedProducts.length > 0 && (
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">
                قد يعجبك أيضاً
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {recommendedProducts.map((product: ProductDetailsInfo) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showShop={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && currentMedia.type === 'image' && (
        <ImageModal
          selectedImage={currentMedia.url}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
};

export default ProductDetails;
