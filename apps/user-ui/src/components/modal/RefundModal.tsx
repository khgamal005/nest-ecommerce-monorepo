'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/utils/axiosInstance';
import { X, AlertCircle, DollarSign, Loader2 } from 'lucide-react';
import { formatEGP } from '@/utils/formatEGP';
import { toast } from 'react-hot-toast';

const refundSchema = z.object({
  amount: z.coerce
    .number()
    .min(1, 'يجب أن يكون المبلغ أكبر من 0')
    .max(1000000, 'المبلغ كبير جداً'),
  reason: z.string().min(5, 'يرجى تقديم سبب مفصل (على الأقل 5 أحرف)'),
  userNotes: z.string().optional(),
});

type RefundFormValues = z.infer<typeof refundSchema>;

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderTotal: number;
  shippingFee?: number;
  onSuccess?: () => void;
}

const REFUND_REASONS = [
  'المنتج ليس كما تم وصفه',
  'المنتج وصل تالفاً',
  'تم استلام منتج خاطئ',
  'مشاكل في جودة المنتج',
  'أخرى',
];

export default function RefundModal({
  isOpen,
  onClose,
  orderId,
  orderTotal,
  shippingFee = 0,
  onSuccess,
}: RefundModalProps) {
  const queryClient = useQueryClient();

  const refundAmount = Math.max(orderTotal - shippingFee, 0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema as any),
    defaultValues: {
      amount: refundAmount,
      reason: '',
      userNotes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: RefundFormValues) => {
      const { data } = await axiosInstance.post('/api/orders/refunds/request', {
        orderId,
        ...values,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('تم إرسال طلب الاسترداد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['user-order', orderId] });
      if (onSuccess) onSuccess();
      onClose();
      reset();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'فشل إرسال طلب الاسترداد';
      toast.error(message);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">
            طلب استرداد الأموال
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit((data) =>
            mutation.mutate({ ...data, amount: refundAmount })
          )}
          className="p-6 space-y-5"
        >
          {/* Amount - Display Only */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              مبلغ الاسترداد
            </label>
            <input type="hidden" {...register('amount')} value={refundAmount} />
            <div className="text-[10px] text-gray-500 mt-1.5 bg-blue-50 p-2 rounded border border-blue-100">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span>{formatEGP(orderTotal)}</span>
              </div>
              {shippingFee > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>رسوم الشحن (غير قابلة للاسترداد):</span>
                  <span>- {formatEGP(shippingFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-blue-700 mt-1 pt-1 border-t border-blue-200">
                <span>المبلغ المتاح للاسترداد:</span>
                <span>{formatEGP(refundAmount)}</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              سبب طلب الاسترداد
            </label>
            <select
              {...register('reason')}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white ${
                errors.reason ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">اختر سبباً...</option>
              {REFUND_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.reason.message}
              </p>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ملاحظات إضافية (اختياري)
            </label>
            <textarea
              {...register('userNotes')}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              placeholder="اكتب أي تفاصيل أخرى هنا..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال الطلب'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
