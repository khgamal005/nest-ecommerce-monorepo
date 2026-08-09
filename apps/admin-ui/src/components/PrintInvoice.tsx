'use client';

import React from 'react';

type OrderItemLike = {
  _id?: string;
  quantity?: number;
  price?: number;
  product?: {
    title?: string;
  };
  selectedOptions?: {
    options?: Record<string, string>;
    sku?: string;
  };
};

type OrderLike = {
  id?: string;
  createdAt?: string;
  total?: number;
  discountAmount?: number;
  couponCode?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  shippingFee?: number;
  phone?: string;
  items?: OrderItemLike[];
  user?: {
    name?: string;
    email?: string;
  };
  shop?: {
    name?: string;
    address?: {
      governorate: string;
      city: string;
      street: string;
      phone: string;
      district?: string;
    };
  };
};

type AddressLike = {
  label?: string;
  country?: string;
  city?: string;
  street?: string;
  zipCode?: string;
  phone?: string;
};

export default function PrintInvoice({
  orderId,
  order,
  address,
}: {
  orderId: string;
  order: OrderLike;
  address?: AddressLike;
}) {
  const invoiceNumber = (orderId || '').slice(-8);

  const formatEgp = (amount: number | string | undefined | null) => {
    const num = Number(amount || 0);
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 2,
    }).format(num) + ' ج.م';
  };

  const shippingFee = order?.shippingFee ?? 0;
  const discount = order?.discountAmount ?? 0;
  const grandTotal = order?.total ?? 0;
  const subtotal = grandTotal - shippingFee + discount;

  return (
    <section className="print-only" dir="rtl">
      <div className="bg-white p-10 text-black border border-black max-w-[210mm] mx-auto min-h-[297mm]">
        <div className="flex justify-between border-b-2 border-black pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter shadow-sm">{order?.shop?.name || 'Invoice'}</h1>
            <p className="text-sm text-gray-700 mt-1 uppercase tracking-widest">Official Sale Receipt</p>
          </div>
          <div className="text-right text-sm leading-relaxed">
            <p><span className="font-bold">التاريخ:</span> {new Date().toLocaleDateString('ar-EG')}</p>
            <p><span className="font-bold">رقم الفاتورة:</span> {invoiceNumber}</p>
            <p className="text-xs text-gray-500">{orderId}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-10">
          <div className="bg-gray-50 p-6 rounded-sm border border-black/10">
            <h2 className="font-bold text-lg mb-3 border-b border-black/20 pb-1">العميل (الوجهة)</h2>
            <div className="space-y-1 text-sm">
              <p className="font-bold">{order?.user?.name || 'Customer'}</p>
              <p>{address?.street || '—'}, {address?.city || '—'}</p>
              <p className="font-mono text-gray-600 underline decoration-dotted">{order?.phone || '—'}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-sm border border-black/10">
            <h2 className="font-bold text-lg mb-3 border-b border-black/20 pb-1">التاجر (المصدر)</h2>
            <div className="space-y-1 text-sm">
              <p className="font-bold">{order?.shop?.name || 'Store'}</p>
              <p>{order?.shop?.address?.street || '—'}, {order?.shop?.address?.city || '—'}</p>
              <p className="font-mono text-gray-600 underline decoration-dotted">{order?.shop?.address?.phone || '—'}</p>
            </div>
          </div>
        </div>

        <table className="w-full mb-10 border-collapse">
          <thead>
            <tr className="bg-black text-white text-sm uppercase tracking-wider">
              <th className="p-3 text-right">المنتج</th>
              <th className="p-3 text-center">الكمية</th>
              <th className="p-3 text-center">السعر</th>
              <th className="p-3 text-center">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-gray-100 border-b-2 border-black">
            {order?.items?.map((item, i) => (
              <tr key={i} className="text-sm">
                <td className="p-4 font-bold">{item.product?.title || 'Unknown Product'}</td>
                <td className="p-4 text-center">{item.quantity}</td>
                <td className="p-4 text-center">{formatEgp(item.price)}</td>
                <td className="p-4 text-center font-bold">{formatEgp((item.price || 0) * (item.quantity || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-80 space-y-3 bg-gray-50 p-6 border-2 border-black">
            <div className="flex justify-between text-sm">
              <span>المجموع الفرعي:</span>
              <span>{formatEgp(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>مصاريف الشحن:</span>
              <span>{formatEgp(shippingFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>خصم:</span>
                <span>-{formatEgp(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black border-t-4 border-black pt-2 uppercase">
              <span>الإجمالي:</span>
              <span>{formatEgp(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-[10px] text-gray-400 uppercase tracking-[0.2em] border-t pt-8">
          Thank you for Choosing our platform
        </div>
      </div>
    </section>
  );
}
