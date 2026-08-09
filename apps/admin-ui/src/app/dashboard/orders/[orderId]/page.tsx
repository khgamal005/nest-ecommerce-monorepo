'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../../utils/axiosInstance';
import OrderStatusStepper from './_components/OrderStatusStepper';
import OrderStatusUpdater from './_components/OrderStatusUpdater';
import {
  Store,
  Package,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { formatEGP } from '../../../../utils/formatEGP';
import PrintInvoice from '../../../../components/PrintInvoice';

interface OrderItem {
  _id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: {
    title?: string;
    _id?: string;
    images?: Array<{ url?: string }>;
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
  cancelReason?: string;
  cancelledBy?: string;
  items: OrderItem[];
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  shop: {
    id: string;
    name: string;
    logo?: string;
    sellerId: string;
    address?: {
      governorate: string;
      city: string;
      district?: string;
      street: string;
      building?: string;
      landmark?: string;
      phone: string;
    };
  };
  refunds?: Array<{
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    amount: number;
    reason: string;
    userNotes?: string;
    adminNotes?: string;
    createdAt: string;
  }>;
}

interface AddressResponse {
  address: Address;
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

const fetchOrder = async (orderId: string) => {
  const { data } = await axiosInstance.get(`/api/orders/${orderId}`);
  return data;
};

const fetchAddress = async (addressId: string) => {
  const { data } = await axiosInstance.get(`/api/address/${addressId}`);
  return data;
};

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const [driverPhone, setDriverPhone] = useState('');

  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
  } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
  });

  const {
    data: addressData,
    isLoading: addressLoading,
    isError: addressError,
  } = useQuery<AddressResponse>({
    queryKey: ['address', order?.shippingAddressId],
    queryFn: () => fetchAddress(order!.shippingAddressId!),
    enabled: !!order?.shippingAddressId,
  });

  const sendToWhatsApp = () => {
    if (!order || !driverPhone) return;

    const shortId = orderId.slice(-8);
    const shopName = order.shop?.name || 'غير متوفر';
    const pickupAddress = order.shop?.address 
      ? `${order.shop.address.street}, ${order.shop.address.city}, ${order.shop.address.governorate}`
      : 'غير متوفر';
    const shopPhone = order.shop?.address?.phone || 'غير متوفر';

    const customerName = order.user?.name || 'غير متوفر';
    const deliveryAddress = addressData?.address
      ? `${addressData.address.street}, ${addressData.address.city}`
      : 'غير متوفر';
    const customerPhone = order.phone || 'غير متوفر';

    const message = `🚚 *طلب توصيل جديد (من المسؤول)*\n-------------------------\n📦 *رقم الطلب:* ${shortId}\n\n🛒 *المحل (استلام من):*\n${shopName}\n📍 ${pickupAddress}\n📞 ${shopPhone}\n\n👤 *العميل (تسليم إلى):*\n${customerName}\n📍 ${deliveryAddress}\n📞 ${customerPhone}\n\n💰 *الإجمالي:* ${order.total} ج.م\n-------------------------`;

    window.open(`https://wa.me/${driverPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (orderLoading) return <div className="text-center py-12">جاري تحميل الطلب...</div>;
  if (orderError || !order) return <div className="text-center py-12 text-red-600">الطلب غير موجود</div>;

  const items = order.items || [];
  const address = addressData?.address;
  const latestRefund = order.refunds?.[0];

  const getRefundStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      PENDING: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'قيد الانتظار' },
      APPROVED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'تمت الموافقة' },
      COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'مكتمل' },
      REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'مرفوض' },
    };
    return configs[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: status };
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <PrintInvoice orderId={orderId} order={order} address={address} />

      <div className="no-print">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">تفاصيل الطلب</h1>
            <p className="text-sm text-gray-500 font-medium">رقم الطلب: <span className="font-mono text-gray-700">{orderId}</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {order.paymentStatus && <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold ring-1 ring-yellow-100 uppercase">{order.paymentStatus}</span>}
            {order.deliveryStatus && <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold ring-1 ring-blue-100 uppercase">{order.deliveryStatus}</span>}
            {latestRefund && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ring-1 flex items-center gap-1 ${getRefundStatusConfig(latestRefund.status).bg} ${getRefundStatusConfig(latestRefund.status).text}`}>
                <RefreshCw className="h-3 w-3" /> استرداد: {getRefundStatusConfig(latestRefund.status).label}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <h2 className="font-semibold mb-4 text-gray-700">تقدم الطلب</h2>
          <OrderStatusStepper currentStatus={order.deliveryStatus || order.status || 'Ordered'} />

          {(order.status === 'CANCELED' || order.deliveryStatus === 'ملغى') && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">❌ تم إلغاء هذا الطلب</h3>
              {order.cancelReason && <p className="text-sm text-red-700 font-medium">سبب الإلغاء: {order.cancelReason}</p>}
              {order.cancelledBy && <p className="text-xs text-red-600 mt-1">قام بالإلغاء: {order.cancelledBy}</p>}
            </div>
          )}

          {latestRefund && (
            <div className="mt-6 space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-sm">طلب استرداد — {getRefundStatusConfig(latestRefund.status).label}</h3>
                <span className="font-bold">{latestRefund.amount} ج.م</span>
              </div>
              <p className="text-sm text-gray-600"><span className="font-bold">السبب:</span> {latestRefund.reason}</p>
              {latestRefund.userNotes && <p className="text-sm text-gray-600"><span className="font-bold">ملاحظات العميل:</span> {latestRefund.userNotes}</p>}
              {latestRefund.adminNotes && <p className="text-sm text-amber-700"><span className="font-bold">ملاحظات الإدارة:</span> {latestRefund.adminNotes}</p>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="font-semibold mb-4 border-b pb-2">المنتجات ({items.length})</h2>
              <div className="divide-y">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start py-4 first:pt-0 last:pb-0">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                        {item.product?.images?.[0]?.url ? <img src={item.product.images[0].url} className="w-full h-full object-cover rounded-md" /> : <Package className="text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{item.product?.title || 'منتج'}</p>
                        <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                        {item.selectedOptions?.options && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {Object.entries(item.selectedOptions.options).map(([k, v]) => (
                              <span key={k} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded border">{k}: {v}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="font-bold">{formatEGP(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="font-semibold mb-4 border-b pb-2">ملخص المالية</h2>
              <div className="space-y-2 text-sm italic text-gray-600">
                <div className="flex justify-between"><span>المجموع الفرعي</span><span>{formatEGP(order.total - (order.shippingFee || 0) + (order.discountAmount || 0))}</span></div>
                <div className="flex justify-between"><span>رسوم الشحن</span><span>{formatEGP(order.shippingFee || 0)}</span></div>
                {order.discountAmount && <div className="flex justify-between text-red-600"><span>الخصم</span><span>-{formatEGP(order.discountAmount)}</span></div>}
                <div className="flex justify-between pt-2 border-t font-bold text-lg text-gray-900 not-italic"><span>الإجمالي</span><span>{formatEGP(order.total)}</span></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-bold mb-4 border-b pb-2 flex items-center gap-2">👤 بيانات العميل</h3>
              <p className="font-bold">{order.user?.name}</p>
              <p className="text-sm text-gray-500 mb-3">{order.user?.email}</p>
              <div className="p-4 bg-blue-50 rounded-lg text-sm border border-blue-100">
                <p className="font-bold text-blue-800">عنوان الشحن:</p>
                {addressLoading ? <p>جاري التحميل...</p> : address ? <><p>{address.street}</p><p>{address.city}, {address.country}</p></> : <p className="text-red-500">العنوان غير متوفر</p>}
                {order.phone && <p className="mt-2 font-mono font-bold text-blue-700">{order.phone}</p>}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-bold mb-4 border-b pb-2 flex items-center gap-2">🏪 بيانات المتجر</h3>
              <p className="font-bold">{order.shop?.name}</p>
              {order.shop?.address ? (
                <div className="p-4 bg-purple-50 rounded-lg text-sm border border-purple-100 mt-3">
                  <p className="font-bold text-purple-800">عنوان الاستلام:</p>
                  <p>{order.shop.address.street}</p>
                  <p>{order.shop.address.city}, {order.shop.address.governorate}</p>
                  <p className="mt-2 font-mono font-bold text-purple-700">{order.shop.address.phone}</p>
                </div>
              ) : <p className="text-xs italic text-gray-400 mt-2">لا يوجد عنوان استلام</p>}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
              <OrderStatusUpdater orderId={orderId} currentStatus={order.deliveryStatus || 'Ordered'} currentPaymentStatus={order.paymentStatus || 'PENDING'} />
              <button className="w-full py-2 bg-gray-100 rounded-md font-bold hover:bg-gray-200 transition" onClick={() => window.print()}>طباعة الفاتورة</button>
              
              <div className="pt-4 border-t">
                <h4 className="text-sm font-bold mb-2 flex items-center gap-2 italic"><MessageCircle className="w-4 h-4 text-green-600" /> إرسال للسائق</h4>
                <input type="text" placeholder="رقم السائق" className="w-full p-2 border rounded-md text-sm mb-2" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} />
                <button disabled={!driverPhone} className="w-full py-2 bg-green-50 text-green-700 rounded-md font-bold disabled:opacity-50" onClick={sendToWhatsApp}>إرسال واتساب</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
