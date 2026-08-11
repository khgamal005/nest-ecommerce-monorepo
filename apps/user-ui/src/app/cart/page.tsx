// app/cart/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { SafeImage } from '@/components/media';
import Link from 'next/link';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ChevronRight,
  Shield,
  Truck,
  Package,
  CreditCard,
  Check,
} from 'lucide-react';
import { useStore } from '../../store';
import useUser from '../../hooks/use-user';
import { formatEGP } from '../../utils/formatEGP';
import useLocationTracking from '../../hooks/useLocationTracking';
import useDeviceTracking from '../../hooks/useDeviceTracking';
import toast from 'react-hot-toast';
import { CleanLocationInfo } from '../../types/Product';
import axiosInstance from '../../utils/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const phoneSchema = z.object({
  phone: z
    .string()
    .regex(
      /^01[0125][0-9]{8}$/,
      'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)'
    ),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

// ✅ Single shipping fee constant — change here to update everywhere
const SHIPPING_FEE_EGP = 50;

export default function CartPage() {
  const { cart, removeFromCart, decreaseQuantity, addToCart, clearCart } =
    useStore();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    discount_code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    sellerId: string;
    discountAmount: number;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    'online' | 'cash-on-delivery'
  >('online');

  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    getValues,
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: '',
    },
  });

  const locationData = useLocationTracking();
  const deviceData = useDeviceTracking();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const safeLocation: CleanLocationInfo = {
    ip: locationData?.ip ?? '0.0.0.0',
    latitude: locationData?.latitude ?? 0,
    longitude: locationData?.longitude ?? 0,
    country: locationData?.country ?? 'unknown',
    city: locationData?.city ?? 'unknown',
  };

  // Calculate totals
  const subtotal = cart.reduce((sum: number, item: any) => {
    const price = item.price;
    const quantity = Number(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);

  // Customer pays shipping fee per shop (courier picks up from each shop separately)
  const uniqueShops = new Set(cart.map((item) => item.shopId));
  const shipping =
    uniqueShops.size > 0 ? SHIPPING_FEE_EGP * uniqueShops.size : 0;

  const discount = appliedCoupon?.discountAmount ?? 0;

  const total = Math.max(subtotal + shipping - discount, 0);

  const sellerIds = [
    ...new Set(
      cart
        .map((item) => item.sellerId)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['shippingAddress', user?.id],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/users/addresses');
      return response.data;
    },
    enabled: !!user?.id && cart.length > 0, // Only fetch when user is logged in and cart has items
  });

  const {
    data: discountCodes = [],
    isLoading: isCouponsLoading,
    error: couponsError,
  } = useQuery({
    queryKey: ['discount-codes', sellerIds],
    queryFn: async () => {
      const res = await axiosInstance.post(
        '/api/promotions/active-discount-codes',
        {
          sellerIds,
        }
      );
      return res.data.codes || [];
    },
    enabled: cart.length > 0, // Only fetch if there are items in cart
  });

  // Auto-select default address when addresses are loaded
  React.useEffect(() => {
    if (
      addresses?.addresses &&
      addresses.addresses.length > 0 &&
      !selectedAddressId
    ) {
      const defaultAddress = addresses.addresses.find(
        (addr: any) => addr.isDefault
      );
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else {
        // If no default, select the first address
        setSelectedAddressId(addresses.addresses[0].id);
      }
    }
  }, [addresses, selectedAddressId]);

  const createPaymentSession = async (phone: string) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        '/api/payments/session',
        {
          cart,
          selectAddressId: selectedAddressId,
          coupon: appliedCoupon,
          phone,
          shippingFee: shipping,
        }
      );
      const sessionId = response.data.sessionId;
      router.push(`/checkout?session_id=${sessionId}`);
    } catch (error) {
      toast.error('فشل في إنشاء جلسة الدفع');
    } finally {
      setLoading(false);
    }
  };
  // Handler functions
  const handleIncrement = (productId: string, variantId?: string) => {
    const item = cart.find(
      (item) => item.productId === productId && item.variantId === variantId
    );
    if (!item) return;

    // Check stock
    if (item.quantity >= (item.stock || 0)) {
      toast.success(`Only ${item.stock} items available in stock`);
      return;
    }

    // Use addToCart to increment quantity
    addToCart(item, user, safeLocation, deviceData);
  };

  const handleDecrement = (productId: string, variantId?: string) => {
    const item = cart.find(
      (item) => item.productId === productId && item.variantId === variantId
    );
    if (!item) return;

    if (item.quantity > 1) {
      decreaseQuantity(productId, variantId, user, safeLocation, deviceData);
    } else {
      removeFromCart(productId, variantId, user, safeLocation, deviceData);
    }
  };

  const handleRemoveItem = (productId: string, variantId?: string) => {
    removeFromCart(productId, variantId, user, safeLocation, deviceData);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();

    const coupon = discountCodes.find(
      (c: any) => c.discount_code.toUpperCase() === code
    );

    if (!coupon) {
      toast.error('كود الخصم غير صالح');
      return;
    }

    const sellerItems = cart.filter(
      (item) => !coupon.sellerId || item.sellerId === coupon.sellerId
    );

    if (sellerItems.length === 0) {
      toast.error('الكوبون غير صالح لمنتجات السلة');
      return;
    }

    const sellerTotal = sellerItems.reduce((sum: number, item: any) => {
      const price = item.price;
      const quantity = Number(item.quantity) || 0;
      return sum + price * quantity;
    }, 0);

    let discountAmount = 0;

    if (coupon.discount_type === 'percentage') {
      discountAmount = (sellerTotal * Number(coupon.discount_value)) / 100;
    }

    if (coupon.discount_type === 'fixed') {
      discountAmount = Number(coupon.discount_value);
    }

    setAppliedCoupon({
      ...coupon,
      discountAmount,
    });

    toast.success('تم تطبيق الكوبون بنجاح 🎉');
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cart.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(
        new Set(cart.map((item) => item.productId + (item.variantId || '')))
      );
    }
  };

  const handleToggleItem = (productId: string, variantId?: string) => {
    const itemKey = productId + (variantId || '');
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemKey)) {
      newSelected.delete(itemKey);
    } else {
      newSelected.add(itemKey);
    }
    setSelectedItems(newSelected);
  };

  const selectedSubtotal = cart
    .filter((item) =>
      selectedItems.has(item.productId + (item.variantId || ''))
    )
    .reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!selectedAddressId) {
      toast.error('الرجاء اختيار عنوان الشحن');
      return;
    }

    // Validate phone via react-hook-form so the inline error is shown
    const phoneValid = await trigger('phone');
    if (!phoneValid) {
      const message = errors.phone?.message ?? 'يرجى إدخال رقم الهاتف';
      toast.error(message);
      document
        .getElementById('phone')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const phone = getValues('phone');

    setLoading(true);

    try {
      // 👉 CASH ON DELIVERY FLOW
      if (paymentMethod === 'cash-on-delivery') {
        // Create COD order directly without session
        const codResponse = await axiosInstance.post(
          '/api/payments/cod',
          {
            cart,
            selectAddressId: selectedAddressId,
            coupon: appliedCoupon,
            phone,
            userId: user?.id,
            shippingFee: shipping,
          }
        );

        if (codResponse.data.success) {
          toast.success('Order placed successfully! 🎉');
          clearCart();

          // Redirect to success page with order ID
          const orderId = codResponse.data.orderId;
          router.push(`/success?orderIds=${orderId}&payment=cod`);
        }
        return;
      }

      // 👉 ONLINE PAYMENT FLOW
      const response = await axiosInstance.post(
        '/api/payments/session',
        {
          cart,
          selectAddressId: selectedAddressId,
          coupon: appliedCoupon,
          phone,
          shippingFee: shipping,
        }
      );
      const sessionId = response.data.sessionId;
      router.push(`/checkout?session_id=${sessionId}`);
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'فشل في معالجة الطلب');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              حقيبة التسوق فارغة
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              يبدو أنك لم تضف أي منتجات إلى حقيبتك بعد. ابدأ التسوق الآن!
            </p>
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                ابدأ التسوق
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center px-8 py-4 border-2 border-blue-600 text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-colors ml-4"
              >
                <Package className="w-5 h-5 ml-2" />
                تصفح المنتجات
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">سلة التسوق</h1>
              <p className="text-gray-600 mt-2">
                {cart.length} {cart.length === 1 ? 'منتج' : 'منتجات'} فى السلة
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleClearCart}
                className="flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-5 h-5 ml-2" />
                مسح السلة
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-gray-500 mt-4">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              الرئيسية
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 rotate-180" />
            <span className="text-gray-900 font-medium">السلة</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {/* Cart Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={handleSelectAll}
                    className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors ${
                      selectedItems.size === cart.length
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedItems.size === cart.length && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    تحديد الكل ({selectedItems.size}/{cart.length})
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  الإجمالي
                </span>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              {cart.map((item) => {
                const itemKey = item.productId + (item.variantId || '');
                const itemTotal = item.price * item.quantity;
                const isSelected = selectedItems.has(itemKey);

                return (
                  <div
                    key={itemKey}
                    className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                      isSelected
                        ? 'border-blue-500 shadow-blue-100'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Selection and Image */}
                        <div className="flex items-start">
                          <button
                            onClick={() =>
                              handleToggleItem(item.productId, item.variantId)
                            }
                            className={`w-5 h-5 rounded border-2 mt-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </button>
                          <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-gray-100 ml-4">
                            <SafeImage
                              src={item.image}
                              alt={item.title || 'Product'}
                              fill
                              sizes="128px"
                              className="object-cover"
                            />
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    <Link
                                      href={`/product/${
                                        item.slug || item.productId
                                      }`}
                                      className="hover:text-blue-600 transition-colors"
                                    >
                                      {item.title || 'Product'}
                                    </Link>
                                  </h3>

                                  {/* Product Meta - Removed since not in minimal cart */}
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl font-bold text-gray-900">
                                      {formatEGP(item.price)}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {formatEGP(item.price)} × {item.quantity}
                                  </div>
                                </div>
                              </div>

                              {/* NEW: Generic Selected Options Display */}
                              {item.selectedOptions &&
                                item.selectedOptions.length > 0 && (
                                  <div className="flex flex-wrap gap-4 mb-4">
                                    {item.selectedOptions.map(
                                      (option: any, idx: number) => {
                                        const isColorOption =
                                          option.name.toLowerCase() === 'color';

                                        return (
                                          <div key={idx}>
                                            <p className="text-sm text-gray-600 mb-2">
                                              {option.name}:
                                            </p>
                                            <div className="flex gap-2">
                                              {isColorOption ? (
                                                <div
                                                  className="w-6 h-6 rounded-full border border-gray-300 shadow-sm"
                                                  style={{
                                                    backgroundColor:
                                                      option.value,
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
                                        );
                                      }
                                    )}
                                  </div>
                                )}

                              {/* Stock Status */}
                              <div className="flex items-center gap-2">
                                {(item.stock || 0) > 0 ? (
                                  <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-green-600">
                                      {item.stock} في المخزن
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-sm text-red-600">
                                      غير متوفر
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col items-end gap-4">
                              {/* Quantity Control */}
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() =>
                                    handleDecrement(
                                      item.productId,
                                      item.variantId
                                    )
                                  }
                                  disabled={item.quantity <= 1}
                                  className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="px-4 py-2 border-x border-gray-300 min-w-[40px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleIncrement(
                                      item.productId,
                                      item.variantId
                                    )
                                  }
                                  disabled={item.quantity >= (item.stock || 0)}
                                  className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Item Total */}
                              <div className="text-right">
                                <p className="text-sm text-gray-500">
                                  إجمالي المنتج
                                </p>
                                <p className="text-xl font-bold text-gray-900">
                                  {formatEGP(itemTotal)}
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleRemoveItem(
                                      item.productId,
                                      item.variantId
                                    )
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue Shopping */}
            <div className="mt-8">
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 border-2 border-blue-600 text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                الاستمرار في التسوق
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
                    ملخص الطلب
                  </h3>

                  <div className="space-y-4">
                    {/* Subtotal */}
                    <div className="flex justify-between text-gray-600">
                      <span>إجمالي المنتجات</span>
                      <span className="font-medium">{formatEGP(subtotal)}</span>
                    </div>

                    {/* Shipping */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">الشحن</span>
                        <Truck className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="font-medium">
                        {shipping === 0
                          ? 'مجاني'
                          : `${formatEGP(shipping)}${
                              uniqueShops.size > 1
                                ? ` (${uniqueShops.size} متاجر)`
                                : ''
                            }`}
                      </span>
                    </div>

                    {/* Discount */}
                    {appliedCoupon && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>
                          الخصم
                          {appliedCoupon.discount_type === 'percentage' &&
                            ` (${appliedCoupon.discount_value}%)`}
                        </span>

                        <span className="font-medium">
                          -{formatEGP(appliedCoupon.discountAmount)}
                        </span>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">
                          الإجمالي
                        </span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatEGP(total)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {selectedItems.size > 0 ? (
                              <>
                                المحدد:{' '}
                                <span className="font-medium">
                                  {formatEGP(selectedSubtotal)}
                                </span>
                              </>
                            ) : (
                              'جميع المنتجات'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="mt-6">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="أدخل رمز الكوبون"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />

                      <button
                        onClick={handleApplyCoupon}
                        disabled={Boolean(appliedCoupon)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          appliedCoupon
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {appliedCoupon ? 'تم التطبيق' : 'تطبيق'}
                      </button>
                    </div>

                    {/* Available Coupons */}
                    {discountCodes.length > 0 && !appliedCoupon && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          الكوبونات المتاحة:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {discountCodes
                            .filter((c: any) => {
                              // Only show coupons from sellers whose products are in cart (global coupons apply everywhere)
                              return cart.some(
                                (item) =>
                                  !c.sellerId || item.sellerId === c.sellerId
                              );
                            })
                            .map((c: any) => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setCouponCode(c.discount_code);
                                }}
                                className="flex flex-col items-center cursor-pointer group"
                              >
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-3 py-2 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:shadow-md transition-all duration-200 group-hover:scale-105 min-w-[120px] text-center">
                                  <div className="font-mono font-bold text-blue-800 text-sm">
                                    {c.discount_code}
                                  </div>
                                  <div className="text-xs text-blue-600 mt-1">
                                    {c.discount_type === 'percentage'
                                      ? `${c.discount_value}% خصم`
                                      : `${formatEGP(c.discount_value)} خصم`}
                                  </div>
                                  {c.public_name && (
                                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                      {c.public_name}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-blue-500 mt-1 font-medium group-hover:text-blue-700 transition-colors">
                                  اضغط للاختيار
                                </div>
                              </div>
                            ))}
                        </div>
                        {discountCodes.filter((c: any) =>
                          cart.some(
                            (item) =>
                              !c.sellerId || item.sellerId === c.sellerId
                          )
                        ).length === 0 && (
                          <p className="text-sm text-gray-500 italic">
                            لا توجد كوبونات متاحة لمنتجات السلة الحالية
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* phone number */}
                  <div className="mb-6">
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      رقم الهاتف (للتواصل عند التوصيل)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="phone"
                        {...register('phone')}
                        placeholder="01xxxxxxxxx"
                        className={`w-full px-3 py-2.5 text-sm bg-white border ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* select address */}
                  <div className="mb-6">
                    <label
                      htmlFor="shipping-address"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      عنوان الشحن
                    </label>

                    <div className="relative">
                      {isLoading ? (
                        <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg animate-pulse">
                          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      ) : addresses?.addresses?.length === 0 ? (
                        <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500 mb-2 text-sm">
                            لا توجد عناوين محفوظة
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              router.push('/profile/addresses')
                            }
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            إضافة عنوان
                          </button>
                        </div>
                      ) : (
                        <>
                          <select
                            id="shipping-address"
                            value={selectedAddressId}
                            onChange={(e) =>
                              setSelectedAddressId(e.target.value)
                            }
                            className="w-full px-3 py-2.5 text-sm bg-white border border-gray-300 
                    rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                    focus:border-blue-500 transition-all cursor-pointer
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    appearance-none pr-8"
                            disabled={!addresses?.addresses?.length}
                          >
                            <option value="" disabled>
                              {addresses?.addresses?.length
                                ? 'اختر عنوان الشحن'
                                : 'لا توجد عناوين متاحة'}
                            </option>

                            {addresses?.addresses?.map((address: any) => (
                              <option key={address.id} value={address.id}>
                                {address.isDefault && '⭐ '}
                                {address.label} - {address.street}،{' '}
                                {address.city}
                                {address.isDefault && ' (الافتراضي)'}
                              </option>
                            ))}
                          </select>

                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => router.push('/profile')}
                              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 sm:h-4 sm:w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                              إضافة عنوان جديد
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="mt-4 sm:mt-6 border-t border-gray-200 pt-4 sm:pt-6">
                    <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
                      اختر طريقة الدفع
                    </h4>

                    <div className="space-y-2 sm:space-y-3">
                      {/* Online Payment (Card + Wallet) */}
                      <button
                        onClick={() => setPaymentMethod('online')}
                        className={`w-full flex items-center justify-between p-3 sm:p-4 border rounded-xl transition-all text-sm sm:text-base ${
                          paymentMethod === 'online'
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                            : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === 'online'
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {paymentMethod === 'online' && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1 bg-blue-100 rounded">
                              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900 text-xs sm:text-sm">
                                دفع أونلاين (بطاقة / محفظة)
                              </p>
                              <p className="text-xs text-gray-500 hidden sm:block">
                                ادفع عبر فيزا أو ماستركارد أو محفظة إلكترونية
                              </p>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded hidden sm:inline">
                          Card & Wallet
                        </span>
                      </button>

                      {/* Cash on Delivery Option */}
                      <button
                        onClick={() => setPaymentMethod('cash-on-delivery')}
                        className={`w-full flex items-center justify-between p-3 sm:p-4 border rounded-xl transition-all text-sm sm:text-base ${
                          paymentMethod === 'cash-on-delivery'
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                            : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === 'cash-on-delivery'
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {paymentMethod === 'cash-on-delivery' && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1 bg-blue-100 rounded">
                              <svg
                                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900 text-xs sm:text-sm">
                                الدفع عند الاستلام
                              </p>
                              <p className="text-xs text-gray-500 hidden sm:block">
                                ادفع عند استلام الطلب
                              </p>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded hidden sm:inline">
                          Available
                        </span>
                      </button>
                    </div>

                    {/* Security Note */}
                    <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      <span className="text-xs sm:text-sm">
                        100% secure & protected payment
                      </span>
                    </div>
                  </div>

                  {/* Checkout Button - Now at the bottom after payment selection */}
                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || loading}
                    className="w-full mt-4 sm:mt-6 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4 sm:h-5 sm:w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span className="text-xs sm:text-sm">
                          Processing...
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-xs sm:text-base">
                          {paymentMethod === 'cash-on-delivery'
                            ? 'Place Order (Cash on Delivery)'
                            : 'Proceed to Payment'}
                        </span>
                        {paymentMethod === 'cash-on-delivery' ? (
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        ) : (
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
