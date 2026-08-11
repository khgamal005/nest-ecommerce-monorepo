'use client';

import React from 'react';

import { useParams, useRouter } from 'next/navigation';

import axiosInstance from '@/utils/axiosInstance';

import { useQuery } from '@tanstack/react-query';

import OrderStatusStepper from '../../_components/OrderStatusStepper';

import RefundModal from '@/components/modal/RefundModal';

import CancelOrderModal from '@/components/modal/CancelOrderModal';

import {
  ArrowLeft,
  Store,
  Package,
  MapPin,
  Truck,
  Calendar,
  CreditCard,
  RefreshCw,
  AlertCircle,
  XCircle,
} from 'lucide-react';

import { formatEGP } from '@/utils/formatEGP';
import { SafeImage } from '@/components/media';

interface OrderItem {
  _id: string;

  productId: string | { name?: string; _id?: string; images?: string[] };

  quantity: number;

  price: number;

  product?: {
    title?: string;

    _id?: string;

    images?: Array<{ url?: string }>;

    isReturnable?: boolean;
  };

  variant?: {
    images?: Array<{ url?: string }>;
  };

  selectedOptions?: {
    options?: Record<string, string>;

    sku?: string;
  };
}

interface Order {
  id: string;
  _id: string;
  userId: string;
  total: number;
  discountAmount?: number;
  couponCode?: string;
  status?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  shippingAddressId?: string;
  phone?: string;
  shippingFee?: number;
  paymentType?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  cancelReason?: string;
  cancelledBy?: string;
  refunds?: Array<{
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    amount: number;
    reason: string;
    adminNotes?: string;
    createdAt: string;
  }>;
  shop: {
    id: string;
    name: string;
    logo?: string;
    avatar?: string;
  };
}

interface Address {
  _id: string;

  label: string;

  country: string;

  city: string;

  street: string;

  zipCode: string;

  phone?: string;
}

interface AddressResponse {
  address: Address;
}

// Fetchers

const fetchOrder = async (orderId: string) => {
  const { data } = await axiosInstance.get(`/api/orders/mine/${orderId}`);

  return data;
};

const fetchAddress = async (addressId: string) => {
  const { data } = await axiosInstance.get('/api/users/addresses');

  const address = data.addresses?.find((addr: any) => addr.id === addressId);

  return { address };
};

export default function UserOrderDetailsPage() {
  const params = useParams();

  const router = useRouter();

  const orderId = params?.orderId as string;

  const [isRefundModalOpen, setIsRefundModalOpen] = React.useState(false);

  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);

  // Fetch Order

  const {
    data: order,

    isLoading: orderLoading,

    isError: orderError,
  } = useQuery<Order>({
    queryKey: ['user-order', orderId],

    queryFn: () => fetchOrder(orderId),

    enabled: !!orderId,
  });

  // Fetch Address after Order loads

  const {
    data: addressData,

    isLoading: addressLoading,
  } = useQuery<AddressResponse>({
    queryKey: ['user-address', order?.shippingAddressId],

    queryFn: () => fetchAddress(order!.shippingAddressId!),

    enabled: !!order?.shippingAddressId,
  });

  const handleBack = () => {
    router.push('/profile/orders');
  };

  const handleRefundSuccess = () => {
    // Show success message or refresh data

    window.location.reload();
  };

  const latestRefund = order?.refunds?.[0];

  // Check if order is eligible for refund: Delivered status, no active refund, and within 14 days
  const isEligibleForRefund =
    order?.deliveryStatus === 'تم التوصيل' &&
    !latestRefund &&
    order?.createdAt &&
    (() => {
      const orderDate = new Date(order.createdAt);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      return orderDate >= fourteenDaysAgo;
    })();

  const isEligibleForCancellation =
    ['PENDING', 'PROCESSING'].includes(order?.status || '') &&
    !['SHIPPED', 'DELIVERED', 'CANCELED'].includes(order?.deliveryStatus || '');

  const getRefundStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { bg: string; text: string; border: string; label: string }
    > = {
      PENDING: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        label: 'طلب استرداد قيد الانتظار',
      },

      APPROVED: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: 'تمت الموافقة على الاسترداد',
      },

      COMPLETED: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        label: 'تم استرداد المبلغ',
      },

      REJECTED: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        label: 'تم رفض طلب الاسترداد',
      },
    };

    return (
      configs[status] || {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        label: status,
      }
    );
  };

  if (orderLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 min-h-screen">
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-pulse" />

          <p className="text-gray-500">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 min-h-screen">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة للطلبات
        </button>

        <div className="text-center py-12 text-red-600 bg-white rounded-lg border">
          <Package className="h-12 w-12 mx-auto mb-4 text-red-300" />

          <p className="text-lg font-medium">الطلب غير موجود</p>

          <p className="text-sm text-gray-500 mt-2">
            الطلب الذي تبحث عنه غير موجود أو ليس لديك صلاحية الوصول إليه.
          </p>
        </div>
      </div>
    );
  }

  const items = order.items || [];

  const address = addressData?.address;

  // Check if all products are returnable
  const areAllProductsReturnable = items.every((item: OrderItem) => {
    const isReturnable = item.product?.isReturnable;
    return isReturnable !== false;
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { bg: string; text: string; border: string; label: string }
    > = {
      PAID: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        label: 'تم الدفع',
      },

      PENDING: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        label: 'قيد الانتظار',
      },

      FAILED: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        label: 'فشل',
      },

      CANCELLED: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        label: 'ملغي',
      },

      COMPLETED: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: 'مكتمل',
      },

      PROCESSING: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        label: 'قيد المعالجة',
      },
    };

    return (
      configs[status] || {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        label: status,
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 min-h-screen bg-gray-50">
      {/* Back Button */}

      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        العودة للطلبات
      </button>

      {/* Header */}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 md:p-6 rounded-lg shadow-sm border">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-6 w-6 text-blue-600" />

            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              تفاصيل الطلب
            </h1>
          </div>

          <p className="text-sm text-gray-500 font-medium">
            رقم الطلب:{' '}
            <span className="font-mono text-gray-700">{orderId}</span>
          </p>

          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />

            <span>
              تم الطلب في{' '}
              {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                month: 'long',

                day: 'numeric',

                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {order.paymentStatus && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ${getStatusConfig(order.paymentStatus).bg} ${getStatusConfig(order.paymentStatus).text} ${getStatusConfig(order.paymentStatus).border}`}
            >
              الدفع: {getStatusConfig(order.paymentStatus).label}
            </span>
          )}
          {order.deliveryStatus && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold ring-1 ring-blue-100 capitalize flex items-center gap-1">
              <Truck className="h-3 w-3" />
              توصيل: {order.deliveryStatus}
            </span>
          )}

          {latestRefund && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ${getRefundStatusConfig(latestRefund.status).bg} ${getRefundStatusConfig(latestRefund.status).text} ${getRefundStatusConfig(latestRefund.status).border} flex items-center gap-1`}
            >
              <RefreshCw className="h-3 w-3" />

              {getRefundStatusConfig(latestRefund.status).label}
            </span>
          )}

          {isEligibleForRefund && (
            <button
              onClick={() => setIsRefundModalOpen(true)}
              className="px-3 py-1 bg-orange-600 text-white rounded-full text-xs font-bold flex items-center gap-1 hover:bg-orange-700 transition-colors shadow-sm"
            >
              <RefreshCw className="h-3 w-3" />
              طلب الإرجاع واسترداد الأموال
            </button>
          )}

          {isEligibleForRefund &&
            order?.createdAt &&
            (() => {
              const orderDate = new Date(order.createdAt);
              const expiryDate = new Date(orderDate);
              expiryDate.setDate(expiryDate.getDate() + 14);
              const daysLeft = Math.ceil(
                (expiryDate.getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              return (
                <span className="text-xs text-gray-500 mt-1 block">
                  {daysLeft} days left to return
                </span>
              );
            })()}

          {isEligibleForCancellation && areAllProductsReturnable && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold flex items-center gap-1 hover:bg-red-700 transition-colors shadow-sm"
            >
              <XCircle className="h-3 w-3" />
              <span className="text-xs font-bold">الغاء الطلب</span>
            </button>
          )}
        </div>
      </div>

      {/* Order Progress */}

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="font-semibold mb-2 text-gray-700 flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-600" />
          حالة الطلب
        </h2>

        <OrderStatusStepper
          currentStatus={order.deliveryStatus || order.status || 'Ordered'}
        />
      </div>

      {latestRefund && latestRefund.status === 'REJECTED' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800 text-sm">
              تم رفض طلب الاسترداد
            </h3>
            <p className="text-xs text-red-700 mt-1">
              سبب طلبك: {latestRefund.reason}
            </p>
            {latestRefund.adminNotes && (
              <p className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded">
                <span className="font-medium">رد الإدارة:</span>{' '}
                {latestRefund.adminNotes}
              </p>
            )}
          </div>
        </div>
      )}

      {order.status === 'CANCELED' && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-3">
          <XCircle className="h-5 w-5 text-gray-600 mt-0.5" />

          <div>
            <h3 className="font-bold text-gray-800 text-sm">هذا الطلب ملغى</h3>

            <p className="text-xs text-gray-700 mt-1">
              تم الإلغاء بواسطة:{' '}
              {order.cancelledBy === 'seller' ? 'التاجر' : 'أنت'}
            </p>

            {order.cancelReason && (
              <p className="text-xs text-gray-700 mt-1 italic">
                سبب الإلغاء: {order.cancelReason}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items and Billing */}

        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
            <h2 className="font-semibold mb-4 border-b pb-2 text-gray-700 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              منتجات الطلب ({items.length})
            </h2>

            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item: OrderItem, index) => {
                  // Get product name from populated product data

                  const productName =
                    item.product?.title ||
                    `منتج ${typeof item.productId === 'string' ? item.productId.slice(-6) : 'غير معروف'}`;

                  // Get product image (variant image or product image)

                  const productImage =
                    item.variant?.images?.[0]?.url ||
                    item.product?.images?.[0]?.url;

                  return (
                    <div
                      key={index}
                      className="flex justify-between items-start py-3 border-b last:border-0"
                    >
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                          {productImage ? (
                            <SafeImage
                              src={productImage}
                              alt={productName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {productName}
                          </p>

                          <p className="text-sm text-gray-500">
                            الكمية: {item.quantity}
                          </p>

                          <p className="text-xs text-gray-400">
                            {formatEGP(item.price || 0)} للوحدة
                          </p>

                          {/* Variant Options Display */}

                          {item.selectedOptions?.options &&
                            Object.keys(item.selectedOptions.options).length >
                              0 && (
                              <div className="mt-2 space-y-1">
                                {Object.entries(
                                  item.selectedOptions.options,
                                ).map(([optionName, optionValue]) => {
                                  const isColorOption =
                                    optionName.toLowerCase() === 'color' ||
                                    optionName.toLowerCase() === 'اللون';

                                  const translatedOptionName =
                                    optionName.toLowerCase() === 'color'
                                      ? 'اللون'
                                      : optionName.toLowerCase() === 'size'
                                        ? 'المقاس'
                                        : optionName;

  return (
                                    <div
                                      key={optionName}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="text-xs text-gray-500">
                                        {translatedOptionName}:
                                      </span>

                                      {isColorOption ? (
                                        <div className="flex items-center gap-1">
                                          <div
                                            className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                                            style={{
                                              backgroundColor:
                                                String(optionValue),
                                            }}
                                            title={String(optionValue)}
                                          />

                                          <span className="text-xs text-gray-700">
                                            {String(optionValue)}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 border border-gray-200 rounded">
                                          {String(optionValue)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}

                                {item.selectedOptions.sku && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      رمز المنتج:
                                    </span>

                                    <span className="text-xs font-mono text-gray-600">
                                      {item.selectedOptions.sku}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      </div>

                      <p className="font-semibold text-gray-900 flex-shrink-0">
                        {formatEGP((item.price || 0) * (item.quantity || 0))}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">لا توجد منتجات</p>
            )}
          </div>

          {/* Financial Summary */}

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
            <h2 className="font-semibold mb-4 border-b pb-2 text-gray-700 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              ملخص المبالغ
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">المجموع الفرعي</span>
                <span className="font-medium">
                  {formatEGP(
                    (order.total || 0) -
                      (order.shippingFee || 0) +
                      (order.discountAmount || 0),
                  )}
                </span>
              </div>

              {order.shippingFee !== undefined &&
                order.shippingFee !== null && (
                  <div className="flex justify-between text-gray-600">
                    <span>رسوم الشحن</span>
                    <span className="font-medium">
                      {order.shippingFee === 0
                        ? 'مجاني'
                        : formatEGP(order.shippingFee)}
                    </span>
                  </div>
                )}

              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    الخصم {order.couponCode && `(${order.couponCode})`}
                  </span>

                  <span className="font-medium">
                    -{formatEGP(order.discountAmount)}
                  </span>
                </div>
              )}

              {order.paymentType && (
                <div className="flex justify-between text-gray-600">
                  <span>طريقة الدفع</span>

                  <span className="font-medium">{order.paymentType}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>إجمالي المبلغ المدفوع</span>

                <span className="text-blue-600">
                  {formatEGP(order.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Shop and Address */}

        <div className="space-y-6">
          {/* Shop Details */}

          {order.shop && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-4 text-gray-900 border-b pb-2 flex items-center gap-2">
                <Store className="h-5 w-5 text-purple-600" />
                تفاصيل المتجر
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {order.shop.avatar ? (
                    <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <SafeImage
                        src={order.shop.avatar}
                        alt={order.shop.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 flex-shrink-0">
                      <Store className="h-5 w-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {order.shop.name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Address */}

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-4 text-gray-900 border-b pb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              عنوان الشحن
            </h3>

            {addressLoading ? (
              <p className="text-sm text-gray-500">جاري تحميل العنوان...</p>
            ) : !address ? (
              <p className="text-sm text-gray-500">لا يوجد عنوان شحن متاح</p>
            ) : (
              <div className="text-sm text-gray-600 leading-relaxed space-y-1">
                <p className="font-medium text-gray-900">{address.label}</p>

                <p>{address.street}</p>

                <p>
                  {address.city}, {address.country}
                </p>

                <p>الرمز البريدي: {address.zipCode}</p>

                {address.phone && (
                  <p className="flex items-center gap-1 mt-2">
                    <span className="text-gray-500">الهاتف:</span>

                    <span>{address.phone}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Order Info */}

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-4 text-gray-900 border-b pb-2">
              معلومات الطلب
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">تاريخ الطلب</span>

                <span className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">آخر تحديث</span>

                <span className="font-medium">
                  {new Date(order.updatedAt).toLocaleDateString('ar-EG')}
                </span>
              </div>

              {order.paymentType && (
                <div className="flex justify-between">
                  <span className="text-gray-500">الدفع</span>

                  <span className="font-medium">{order.paymentType}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        orderId={orderId}
        orderTotal={order.total || 0}
        shippingFee={order.shippingFee || 0}
        onSuccess={handleRefundSuccess}
      />

      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        orderId={orderId}
        role="user"
      />
    </div>
  );
}
