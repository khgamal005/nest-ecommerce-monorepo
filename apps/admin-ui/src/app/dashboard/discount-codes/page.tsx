'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import axiosInstance from '../../../utils/axiosInstance';

import { toast } from 'react-hot-toast';

// types/discount.ts
export type DiscountType = 'percentage' | 'fixed';

export interface DiscountCode {
  id: string;
  public_name: string;
  discount_type: DiscountType;
  discount_value: number;
  discount_code: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountFormData {
  public_name: string;
  discount_type: DiscountType;
  discount_value: string | number;
  discount_code: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
// API functions using axiosInstance
const discountApi = {
  createDiscount: async (data: DiscountFormData): Promise<DiscountCode> => {
    const res = await axiosInstance.post(
      '/promotions',
      data,
    );
    return res.data;
  },

  getDiscounts: async (): Promise<DiscountCode[]> => {
    const res = await axiosInstance.get(`/promotions`);
    return res.data;
  },

  updateDiscount: async (
    id: string,
    data: DiscountFormData,
  ): Promise<DiscountCode> => {
    const res = await axiosInstance.patch(`/promotions/${id}`, data);
    return res.data;
  },

  deleteDiscount: async (id: string): Promise<{ message: string }> => {
    const res = await axiosInstance.delete(`/promotions/${id}`);
    return res.data;
  },
};

const DiscountPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingDiscount, setEditingDiscount] =
    useState<DiscountCode | null>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<DiscountFormData>({
    defaultValues: {
      discount_type: 'percentage',
    },
    mode: 'onChange', // Validate on change for immediate feedback
  });

  const watchDiscountType = watch('discount_type');

  // React Query for fetching discounts
  const {
    data: discounts = [],
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountApi.getDiscounts(),
  });

  // React Query for creating discount
  const createMutation = useMutation({
    mutationFn: discountApi.createDiscount,
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      // Reset your form if needed
      reset();
      // Show toast
      toast.success('تم إنشاء كود الخصم بنجاح');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'فشل في إنشاء كود الخصم');
    },
  });

  // React Query for updating discount
  const updateMutation = useMutation({
    mutationFn: (args: { id: string; data: DiscountFormData }) =>
      discountApi.updateDiscount(args.id, args.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      reset();
      setEditingDiscount(null);
      toast.success('تم تحديث كود الخصم بنجاح');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'فشل في تحديث كود الخصم');
    },
  });

  // React Query for deleting discount
  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return discountApi.deleteDiscount(id);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success(response.message || 'تم حذف كود الخصم بنجاح');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'فشل في حذف كود الخصم');
    },
  });

  const onSubmit = (data: DiscountFormData) => {
    // Convert discount_value to number before sending
    const payload = {
      ...data,
      discount_value: Number(data.discount_value),
    };
    if (editingDiscount) {
      updateMutation.mutate({ id: editingDiscount.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setValue('public_name', discount.public_name);
    setValue('discount_type', discount.discount_type);
    setValue('discount_value', discount.discount_value);
    setValue('discount_code', discount.discount_code);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingDiscount(null);
    reset();
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">أكواد الخصم</h1>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              تأكيد الحذف
            </h3>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد من حذف كود الخصم هذا؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Discount Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingDiscount ? 'تعديل كود الخصم' : 'إنشاء كود خصم جديد'}
        </h2>

        {createMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {(createMutation.error as AxiosError<{ message: string }>)?.response
              ?.data?.message || 'فشل في إنشاء كود الخصم'}
          </div>
        )}

        {createMutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            تم إنشاء كود الخصم بنجاح!
          </div>
        )}

        {/* Debug: Show form errors */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Form validation errors:</p>
            <ul className="text-sm list-disc list-inside">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>
                  {key}: {(error as any)?.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Public Name */}
            <div>
              <label
                htmlFor="public_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                الاسم العام *
              </label>
              <input
                type="text"
                id="public_name"
                {...register('public_name', {
                  required: 'الاسم العام مطلوب',
                  minLength: {
                    value: 2,
                    message: 'الاسم العام يجب أن يكون على الأقل حرفين',
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="تخفيضات الصيف 2024"
              />
              {errors.public_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.public_name.message}
                </p>
              )}
            </div>

            {/* Discount Code */}
            <div>
              <label
                htmlFor="discount_code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                كود الخصم *
              </label>
              <input
                type="text"
                id="discount_code"
                {...register('discount_code', {
                  required: 'كود الخصم مطلوب',
                  pattern: {
                    value: /^[A-Za-z0-9]+$/,
                    message:
                      'كود الخصم يجب أن يحتوي فقط على حروف إنجليزية وأرقام (بدون مسافات أو رموز)',
                  },
                  minLength: {
                    value: 3,
                    message: 'كود الخصم يجب أن يكون 3 أحرف على الأقل',
                  },
                  maxLength: {
                    value: 20,
                    message: 'كود الخصم يجب ألا يتجاوز 20 حرف',
                  },
                })}
                onChange={(e) => {
                  // Auto-convert to uppercase and remove non-English/non-number characters
                  const cleaned = e.target.value
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .toUpperCase();
                  setValue('discount_code', cleaned, { shouldValidate: true });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SUMMER24"
              />
              {errors.discount_code && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.discount_code.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Discount Type */}
            <div>
              <label
                htmlFor="discount_type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                نوع الخصم *
              </label>
              <select
                id="discount_type"
                {...register('discount_type', {
                  required: 'نوع الخصم مطلوب',
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">نسبة مئوية</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
              {errors.discount_type && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.discount_type.message}
                </p>
              )}
            </div>

            {/* Discount Value */}
            <div>
              <label
                htmlFor="discount_value"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                قيمة الخصم *
                {watchDiscountType === 'percentage' ? ' (%)' : ' (ج.م)'}
              </label>
              <input
                type="number"
                id="discount_value"
                step="0.01"
                min="0"
                max={watchDiscountType === 'percentage' ? '100' : undefined}
                {...register('discount_value', {
                  required: 'قيمة الخصم مطلوبة',
                  min: {
                    value: 0,
                    message: 'قيمة الخصم يجب أن تكون موجبة',
                  },
                  max:
                    watchDiscountType === 'percentage'
                      ? {
                          value: 100,
                          message: 'نسبة الخصم لا يمكن أن تتجاوز 100%',
                        }
                      : undefined,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={watchDiscountType === 'percentage' ? '10' : '25'}
              />
              {errors.discount_value && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.discount_value.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {editingDiscount && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                إلغاء التعديل
              </button>
            )}
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createMutation.isPending || updateMutation.isPending) &&
                'جاري الحفظ...'}
              {!createMutation.isPending &&
                !updateMutation.isPending &&
                (editingDiscount ? 'حفظ التعديلات' : 'إنشاء كود الخصم')}
            </button>
          </div>
        </form>
      </div>

      {/* Discount Codes List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          أكواد الخصم الخاصة بك
        </h2>

        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            فشل في تحميل أكواد الخصم -{' '}
            {(fetchError as AxiosError<{ message: string }>)?.response?.data
              ?.message || fetchError.message}
          </div>
        )}

        {discounts.length === 0 && !fetchError ? (
          <div className="text-center py-8 text-gray-500">
            لم يتم إنشاء أي أكواد خصم بعد
          </div>
        ) : (
          <div className="space-y-4">
            {discounts.map((discount) => (
              <div
                key={discount.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {discount.public_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        الكود:{' '}
                        <span className="font-mono">
                          {discount.discount_code}
                        </span>
                      </p>
                    </div>
                    <div className="text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {discount.discount_type === 'percentage'
                          ? `${discount.discount_value}%`
                          : `${discount.discount_value} ج.م`}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    تاريخ الإنشاء:{' '}
                    {new Date(discount.createdAt).toLocaleDateString('ar-EG')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleEdit(discount);
                    }}
                    className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(discount.id);
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountPage;
