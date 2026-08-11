'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/utils/axiosInstance';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const cancelSchema = z.object({
  reason: z.string().min(5, 'يرجى تقديم سبب للإلغاء (على الأقل 5 أحرف)'),
});

type CancelFormValues = z.infer<typeof cancelSchema>;

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  role: 'user' | 'seller';
  onSuccess?: () => void;
}

const USER_CANCEL_REASONS = [
  'غيرت رأيي',
  'وجدت سعراً أفضل',
  'أريد تغيير عنوان الشحن',
  'أريد إضافة منتجات أخرى',
  'تأخر الطلب جداً',
  'أخرى',
];

const SELLER_CANCEL_REASONS = [
  'المنتج غير متوفر (نفد المخزون)',
  'مشكلة في التسعير',
  'لا يمكن التوصيل لهذه المنطقة',
  'أخرى',
];

export default function CancelOrderModal({
  isOpen,
  onClose,
  orderId,
  role,
  onSuccess,
}: CancelOrderModalProps) {
  const queryClient = useQueryClient();
  const reasons = role === 'user' ? USER_CANCEL_REASONS : SELLER_CANCEL_REASONS;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CancelFormValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: {
      reason: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CancelFormValues) => {
      const { data } = await axiosInstance.post(`/api/orders/mine/${orderId}/cancel`, values);
      return data;
    },
    onSuccess: () => {
      toast.success('تم إلغاء الطلب بنجاح');
      queryClient.invalidateQueries({ queryKey: ['user-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      if (onSuccess) onSuccess();
      onClose();
      reset();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'فشل إلغاء الطلب';
      toast.error(message);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-right" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-red-50/50">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-xl font-bold">إلغاء الطلب</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-5">
          <p className="text-gray-600 text-sm">
            هل أنت متأكد من رغبتك في إلغاء الطلب رقم <span className="font-bold text-gray-900">#{orderId}</span>؟ هذا الإجراء لا يمكن التراجع عنه.
          </p>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              سبب الإلغاء
            </label>
            <select
              {...register('reason')}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all appearance-none bg-white ${
                errors.reason ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">اختر سبباً...</option>
              {reasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1 justify-end">
                {errors.reason.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
            >
              تراجع
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md shadow-red-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الإلغاء...
                </>
              ) : (
                'تأكيد الإلغاء'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
