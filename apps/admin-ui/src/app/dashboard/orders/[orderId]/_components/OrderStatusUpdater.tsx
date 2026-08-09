'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../../../utils/axiosInstance';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
  currentPaymentStatus: string;
}

const ORDER_STATUS_OPTIONS = [
  'تم الطلب',
  'تم التعبئة',
  'تم الشحن',
  'في الطريق للتوصيل',
  'تم التوصيل',
  'ملغي',
];

const PAYMENT_STATUS_OPTIONS = [
  { label: 'قيد الانتظار', value: 'PENDING' },
  { label: 'مدفوع', value: 'PAID' },
  { label: 'فشل', value: 'FAILED' },
  { label: 'مسترد', value: 'REFUNDED' },
];

const STATUS_MAP: Record<string, string> = {
  'تم الطلب': 'PENDING',
  'تم التعبئة': 'PROCESSING',
  'تم الشحن': 'SHIPPED',
  'في الطريق للتوصيل': 'SHIPPED',
  'تم التوصيل': 'DELIVERED',
  'ملغي': 'CANCELED',
};

const OrderStatusUpdater: React.FC<OrderStatusUpdaterProps> = ({
  orderId,
  currentStatus,
  currentPaymentStatus,
}) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    setPaymentStatus(currentPaymentStatus);
  }, [currentPaymentStatus]);

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      newStatus,
      newPaymentStatus,
    }: {
      newStatus?: string;
      newPaymentStatus?: string;
    }) => {
      const payload: any = {};
      if (newStatus) {
        payload.deliveryStatus = newStatus;
        payload.status = STATUS_MAP[newStatus];
      }
      if (newPaymentStatus) {
        payload.paymentStatus = newPaymentStatus;
      }

      const { data } = await axiosInstance.patch(
        `/api/orders/${orderId}/status`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      toast.success('تم تحديث الحالة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
    onError: (error) => {
      console.error('Failed to update status', error);
      toast.error('فشل في تحديث الحالة');
    },
  });

  return (
    <div className="w-full space-y-4">
      {/* Order Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          حالة الطلب
        </label>
        <div className="relative">
          <select
            value={status || 'Ordered'}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isPending}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white disabled:bg-gray-100 disabled:text-gray-500 cursor-pointer shadow-sm"
          >
            {ORDER_STATUS_OPTIONS.map((option, index) => {
              const currentIndex = ORDER_STATUS_OPTIONS.findIndex(
                (s) => s.toLowerCase() === (status || '').toLowerCase()
              );
              const isDisabled = index < currentIndex;
              return (
                <option key={option} value={option} disabled={isDisabled}>
                  {option}
                </option>
              );
            })}
          </select>
        </div>
        <button
          onClick={() => mutate({ newStatus: status })}
          disabled={isPending || status === currentStatus}
          className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          تحديث حالة الطلب
        </button>
      </div>

      {/* Payment Status */}
      <div className="pt-2 border-t border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          حالة الدفع
        </label>
        <div className="relative">
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            disabled={isPending}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white disabled:bg-gray-100 disabled:text-gray-500 cursor-pointer shadow-sm"
          >
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => mutate({ newPaymentStatus: paymentStatus })}
          disabled={isPending || paymentStatus === currentPaymentStatus}
          className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          تحديث حالة الدفع
        </button>
      </div>
      
      {isPending && (
        <div className="flex items-center justify-center text-xs text-gray-500 animate-pulse">
          <Loader2 className="animate-spin h-3 w-3 mr-1" />
          جاري المعالجة...
        </div>
      )}
    </div>
  );
};

export default OrderStatusUpdater;
