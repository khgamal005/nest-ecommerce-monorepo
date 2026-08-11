'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import { User, Mail, Loader2, Save } from 'lucide-react';

interface ProfileInfoProps {
  user: {
    id: string;
    name?: string;
    email?: string;
    createdAt?: string;
  };
}

interface ProfileFormData {
  name: string;
}

const updateProfile = async (data: ProfileFormData) => {
  const response = await axiosInstance.put('/user/api/user/profile', data);
  return response.data;
};

const fetchFollowedShops = async () => {
  try {
    const response = await axiosInstance.get('/auth/api/followed-shops');
    return response.data?.shops || [];
  } catch (error: any) {
    console.error('Error fetching followed shops:', error);
    console.error('Error response:', error.response?.data);
    return [];
  }
};

const ProfileInfo: React.FC<ProfileInfoProps> = ({ user }) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user.name || '',
    },
  });

  const {
    error: shopsError,
  } = useQuery({
    queryKey: ['followed-shops'],
    queryFn: fetchFollowedShops,
  });

  // Log any errors
  React.useEffect(() => {
    if (shopsError) {
      console.error('Error loading followed shops:', shopsError);
    }
  }, [shopsError]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success('تم تحديث الملف الشخصي بنجاح');
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في تحديث الملف الشخصي');
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    reset({
      name: user.name || '',
    });
    setIsEditing(false);
  };

  const memberSince = (() => {
    if (!user.createdAt) return null;
    const d = new Date(user.createdAt);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  })();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">المعلومات الشخصية</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            تعديل
          </button>
        )}
      </div>

      {/* Member Since */}
      {memberSince && (
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-500">عضو منذ {memberSince}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            الاسم الكامل
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="name"
              disabled={!isEditing}
              {...register('name', {
                required: 'الاسم مطلوب',
                minLength: {
                  value: 2,
                  message: 'الاسم يجب أن يكون حرفين على الأقل',
                },
              })}
              className={`w-full pr-10 pl-4 py-3 border rounded-lg text-right transition-colors ${
                isEditing
                  ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
              placeholder="أدخل اسمك الكامل"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field - Read Only */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            البريد الإلكتروني
          </label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id="email"
              disabled
              value={user.email || ''}
              dir="ltr"
              className="w-full pr-10 pl-4 py-3 border border-gray-200 bg-gray-50 text-gray-600 rounded-lg text-left cursor-not-allowed"
              placeholder="your@email.com"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            لا يمكن تعديل البريد الإلكتروني للحفاظ على سجل الطلبات
          </p>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ التغييرات
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        )}
      </form>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 mt-8 pt-6 border-t">
        {/* Followed Shops */}
        {/* <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-5 h-5 text-gray-600" />
            <p className="text-sm font-medium text-gray-700">
              المتاجر المتابعة
            </p>
          </div>
          {isLoadingShops ? (
            <p className="text-sm text-gray-500">جاري التحميل...</p>
          ) : shopsError ? (
            <p className="text-sm text-red-500">حدث خطأ في تحميل المتاجر</p>
          ) : followedShops.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {followedShops.map((shop: any) => (
                <Link
                  key={shop.id}
                  href={`/shop/${shop.slug || shop.id}`}
                  className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  {shop.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">لا توجد متاجر متابعة</p>
          )}
        </div> */}

        {/* Account Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">حالة الحساب</p>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            نشط
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;
