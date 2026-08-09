'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Package,
  Settings,
  Layers,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axiosInstance';
import Input from 'packages/components/input';

const RichTextEditor = dynamic(
  () => import('packages/components/rich-text-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 w-full bg-gray-800 animate-pulse rounded-lg mt-2" />
    ),
  },
);
import { useImageManagement } from '../../../hooks/useImageManagement';
import {
  ImageModal,
  ImageUploadInfo,
} from '../../../shared/components/ImageModal';
import ImagePlaceholder from '../../../shared/components/image-placeholder';
import ProductOptionsConfig, {
  ProductOption,
} from '../../../components/ProductOptionsConfig';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  productSchema,
  type ProductFormData,
} from '../../../validation/productSchema';
import VariantManager, {
  ProductVariant,
} from '../../../components/VariantManager';
import ColorImageManager from '../../../components/ColorImageManager';
import CustomSpecsEditor, {
  CustomSpecs,
} from '../../../components/CustomSpecsEditor';
import { useShop } from '../../../hooks/useShop';
import { useVideoManagement } from '../../../hooks/useVideoManagement';
import VideoPlaceholder from '../../../shared/components/VideoPlaceholder';
import BrandSelector from '../../../components/BrandSelector';
import BarcodeModal from '../../../components/BarcodeModal';
import QRCodeModal from '../../../components/QRCodeModal';
interface ColorImageGroup {
  colorValue: string;
  images: { fileId: string; file_Url: string; imageHash?: string }[];
}

// ProductFormData is now imported from productSchema

interface UploadImage {
  fileId: string;
  file_Url: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const { shop, isLoading: shopLoading } = useShop();
  const [activeTab, setActiveTab] = useState<
    'basic' | 'options' | 'variants' | 'images' | 'videos'
  >('basic');
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [colorImages, setColorImages] = useState<ColorImageGroup[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryType, setCategoryType] = useState<
    'clothing' | 'electronics' | 'simple' | 'custom'
  >('custom');
  const [backendErrors, setBackendErrors] = useState<Record<string, string>>(
    {},
  );
  const [customSpecs, setCustomSpecs] = useState<CustomSpecs>({
    groups: [{ label: 'المواصفات', specs: [{ key: '', value: '' }] }],
  });
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [currentSku, setCurrentSku] = useState('');
  const [currentVariantLabel, setCurrentVariantLabel] = useState('');
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [currentSkuForQr, setCurrentSkuForQr] = useState('');
  const [currentVariantLabelForQr, setCurrentVariantLabelForQr] = useState('');

  const {
    videos,
    isUploading: isVideoUploading,
    handleVideoChange,
    handleRemoveVideo,
    getValidVideos,
  } = useVideoManagement([]);

  // Category selection state
  const [selectedLevel1, setSelectedLevel1] = useState('');
  const [selectedLevel2, setSelectedLevel2] = useState('');
  const [selectedLevel3, setSelectedLevel3] = useState('');

  // Find the visual option (Color, or first option)
  const visualOption = useMemo(() => {
    const colorOpt = productOptions.find(
      (opt) =>
        opt.name.toLowerCase() === 'color' ||
        opt.name.toLowerCase() === 'colour' ||
        opt.name === 'اللون',
    );
    return colorOpt || productOptions[0];
  }, [productOptions]);

  const hasVisualOption = visualOption && visualOption.values.length > 0;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      short_description: '',
      detailed_description: '',
      brandId: null,
      brandName: null,
      categoryId: '',
      sku: '',
      slug: '',
      // Price and stock moved to variants only
      // regular_price: 0,
      // stock: 0,
      cashOnDelivery: 'yes',
      isReturnable: true,
      tags: '',
      hasVariants: true,
    },
  });

  const hasVariants = watch('hasVariants', true);
  const brandId = watch('brandId');
  const brandName = watch('brandName');
  // const regularPrice = watch('regular_price');
  // const salePrice = watch('sale_price');
  const categoryId = watch('categoryId'); // Watch categoryId for debugging

  const {
    images,
    selectedImage,
    openImageModel,
    setOpenImageModel,
    setSelectedImage,
    handleImageChange,
    handleRemoveImage,
    isUploading,
    getValidImages,
  } = useImageManagement([], (_images: (UploadImage | null)[]) => {});

  const [hasShownImageWarning, setHasShownImageWarning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent page reload/close if images are uploaded but product not saved
  useEffect(() => {
    if (!isMounted) return; // Only run on client side

    const hasUploadedImages = images.some((img) => img !== null);
    const hasVariantImages = colorImages.some(
      (group) => group.images.length > 0,
    );
    const hasAnyImages = hasUploadedImages || hasVariantImages;

    // Show warning toast when first image is uploaded (only once)
    if (hasAnyImages && !hasShownImageWarning && !isSubmitting) {
      toast(
        '⚠️ تحذير: لا تغلق الصفحة قبل حفظ المنتج، وإلا ستفقد الصور المحملة',
        {
          duration: 6000,
          icon: '⚠️',
          style: {
            background: '#f59e0b',
            color: '#fff',
            direction: 'rtl',
            fontSize: '14px',
          },
        },
      );
      setHasShownImageWarning(true);
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAnyImages && !isSubmitting) {
        e.preventDefault();
        // Modern browsers show their own message in the browser's language
        // We cannot customize this message for security reasons
        e.returnValue = '';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [images, colorImages, isSubmitting, hasShownImageWarning, isMounted]);

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/api/categories/all');
        return res.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
        return { categories: [] };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: typeof window !== 'undefined',
  });

  const categories = categoriesData?.categories || [];

  // Get level 1 categories (main categories)
  const level1Categories = categories.filter((cat: any) => cat.level === 1);

  // Get level 2 categories (subcategories) based on selected level 1
  const level2Categories = selectedLevel1
    ? categories.find((cat: any) => cat.id === selectedLevel1)?.children || []
    : [];

  // Get level 3 categories (final categories) based on selected level 2
  const level3Categories = selectedLevel2
    ? level2Categories.find((cat: any) => cat.id === selectedLevel2)
        ?.children || []
    : [];

  // Handle category selection
  const handleLevel1Change = (id: string) => {
    setSelectedLevel1(id);
    setSelectedLevel2('');
    setSelectedLevel3('');
    setValue('categoryId', '', { shouldValidate: false });
  };

  const handleLevel2Change = (id: string) => {
    setSelectedLevel2(id);
    setSelectedLevel3('');
    setValue('categoryId', '', { shouldValidate: false });
  };

  const handleCategoryTypeChange = (
    type: 'clothing' | 'electronics' | 'simple' | 'custom',
  ) => {
    setCategoryType(type);
    setValue('hasVariants', true);
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setBackendErrors({}); // Clear previous backend errors

    try {
      // Validate categoryId is selected
      if (!data.categoryId || data.categoryId.trim() === '') {
        setError('categoryId', {
          type: 'manual',
          message: 'التصنيف مطلوب',
        });
        setActiveTab('basic');
        setIsSubmitting(false);
        toast.error('يرجى اختيار التصنيف');
        return;
      }

      const missingRequiredOptions = productOptions.filter(
        (opt) => opt.required && opt.values.length === 0,
      );
      if (missingRequiredOptions.length > 0) {
        toast.error(
          `الخيارات المطلوبة مفقودة: ${missingRequiredOptions
            .map((o) => o.name)
            .join('، ')}`,
        );
        setActiveTab('options');
        setIsSubmitting(false);
        return;
      }

      if (hasVariants && variants.length === 0) {
        toast.error(
          'يجب إضافة متغير واحد على الأقل عندما يحتوي المنتج على متغيرات',
        );
        setActiveTab('variants');
        setIsSubmitting(false);
        return;
      }

      const variantKeys = variants.map((v) => JSON.stringify(v.optionValues));
      const hasDuplicates = variantKeys.length !== new Set(variantKeys).size;
      if (hasDuplicates) {
        toast.error(
          'تم اكتشاف متغيرات مكررة. يجب أن يكون لكل متغير مجموعة فريدة من الخيارات',
        );
        setActiveTab('variants');
        setIsSubmitting(false);
        return;
      }

      const tags = data.tags
        ? data.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [];

      // 🎨 Automatically assign images to variants based on color
      const variantsWithImages = variants.map((variant) => {
        // Find the color value for this variant
        const colorValue = visualOption
          ? variant.optionValues[visualOption.name]
          : null;

        // Get images for this color
        const colorImageGroup = colorValue
          ? colorImages.find((g) => g.colorValue === colorValue)
          : null;

        return {
          ...variant,
          images: colorImageGroup?.images || [],
        };
      });

      const payload = {
        ...data,
        categoryId: data.categoryId || undefined,
        tags,
        images: getValidImages(),
        options: productOptions,
        variants: hasVariants ? variantsWithImages : [],
        custom_specifications:
          customSpecs.groups.length > 0 ? customSpecs : null,
        videos: getValidVideos(),
      };

      const response = await axiosInstance.post(
        '/api/products',
        payload,
      );

      toast.success(response.data.message || 'تم إنشاء المنتج بنجاح!');
      router.push('/dashboard/all-products');
    } catch (error: any) {
      console.error('❌ Error creating product:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);

      // Handle backend validation errors
      if (
        error.response?.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        const errors: Record<string, string> = {};
        error.response.data.errors.forEach(
          (err: { field: string; message: string }) => {
            errors[err.field] = err.message;
            // Also set react-hook-form errors
            setError(err.field as any, {
              type: 'manual',
              message: err.message,
            });
          },
        );
        setBackendErrors(errors);
        toast.error('يرجى تصحيح الأخطاء في النموذج');
        setActiveTab('basic'); // Go to basic tab to show errors
      } else if (error.response?.data?.message) {
        // Handle single error message (like duplicate slug)
        const errorMessage = error.response.data.message;

        // Check if it's a slug error
        if (errorMessage.includes('رابط') || errorMessage.includes('slug')) {
          setError('slug', {
            type: 'manual',
            message: errorMessage,
          });
          setActiveTab('basic');
        }

        toast.error(errorMessage);
      } else {
        toast.error('فشل في إنشاء المنتج');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'المعلومات الأساسية', icon: Package },
    { id: 'options', label: 'الخيارات', icon: Settings },
    { id: 'variants', label: 'المتغيرات', icon: Layers },
    { id: 'images', label: 'الصور', icon: ImageIcon },
    { id: 'videos', label: 'الفيديوهات', icon: Package },
  ];

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto px-2 sm:px-4 overflow-x-hidden">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              إنشاء منتج جديد
            </h1>
            <div className="flex items-center text-sm text-gray-400 mt-1">
              <span className="text-blue-400 cursor-pointer">لوحة التحكم</span>
              <ChevronRight size={16} className="mx-1 shrink-0" />
              <span className="truncate">إنشاء منتج</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                const hasUploadedImages = images.some((img) => img !== null);
                const hasVariantImages = colorImages.some(
                  (group) => group.images.length > 0,
                );
                const hasAnyImages = hasUploadedImages || hasVariantImages;

                if (hasAnyImages) {
                  const confirmed = window.confirm(
                    'لديك صور محملة لم يتم حفظها. سيتم حذف الصور من ImageKit إذا غادرت الصفحة.\n\nهل تريد المتابعة؟',
                  );
                  if (confirmed) {
                    router.push('/dashboard/all-products');
                  }
                } else {
                  router.push('/dashboard/all-products');
                }
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition text-sm sm:text-base"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-md text-white font-medium transition text-sm sm:text-base"
            >
              {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء المنتج'}
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-white mb-2 sm:mb-3">
            قالب نوع المنتج
          </label>
          <div className="flex flex-wrap gap-2">
            {(['clothing', 'electronics', 'simple', 'custom'] as const).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleCategoryTypeChange(type)}
                  className={`px-3 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium capitalize transition ${
                    categoryType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {type === 'clothing' && '👕 ملابس'}
                  {type === 'electronics' && '🔌 إلكترونيات'}
                  {type === 'simple' && '📦 منتج بسيط'}
                  {type === 'custom' && '⚙️ مخصص'}
                </button>
              ),
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            اختر قالباً لتهيئة الخيارات تلقائياً، أو اختر "مخصص" لبناء خياراتك
            الخاصة.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {/* Tabs with horizontal scroll on mobile */}
          <div className="border-b border-gray-700 max-w-full overflow-x-auto overscroll-x-contain touch-pan-x">
            <div className="flex w-max min-w-max sm:min-w-0 sm:w-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-750'
                  }`}
                >
                  <tab.icon size={14} className="shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input
                      label="اسم المنتج *"
                      placeholder="أدخل اسم المنتج"
                      {...register('title')}
                    />
                    {errors.title && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="الوصف المختصر *"
                      placeholder="وصف مختصر للمنتج"
                      {...register('short_description')}
                    />
                    {errors.short_description && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.short_description.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <BrandSelector
                      defaultBrandId={brandId || undefined}
                      defaultBrandName={brandName || undefined}
                      onChange={({ brandId, brandName }) => {
                        setValue('brandId', brandId || null);
                        setValue('brandName', brandName || null);
                      }}
                    />
                    {(errors.brandId || errors.brandName) && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.brandId?.message || errors.brandName?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      التصنيف الرئيسي (المستوى 1) *
                    </label>
                    {!isMounted || isCategoriesLoading ? (
                      <p className="text-gray-400">جاري التحميل...</p>
                    ) : (
                      <select
                        value={selectedLevel1}
                        onChange={(e) => handleLevel1Change(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-colors"
                      >
                        <option value="">اختر التصنيف الرئيسي</option>
                        {level1Categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      التصنيف الفرعي (المستوى 2) *
                    </label>
                    <select
                      value={selectedLevel2}
                      onChange={(e) => handleLevel2Change(e.target.value)}
                      disabled={!selectedLevel1}
                      className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-colors disabled:opacity-50"
                    >
                      <option value="">
                        {!selectedLevel1
                          ? 'اختر التصنيف الرئيسي أولاً'
                          : 'اختر التصنيف الفرعي'}
                      </option>
                      {level2Categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      التصنيف النهائي (المستوى 3) *
                    </label>
                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <>
                          <select
                            value={selectedLevel3}
                            onChange={(e) => {
                              const selected = level3Categories.find(
                                (cat: any) => cat.id === e.target.value,
                              );
                              if (selected) {
                                setSelectedLevel3(selected.id);
                                field.onChange(selected.id);
                              } else {
                                setSelectedLevel3('');
                                field.onChange('');
                              }
                            }}
                            disabled={!selectedLevel2}
                            className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-colors disabled:opacity-50"
                          >
                            <option value="">
                              {!selectedLevel2
                                ? 'اختر التصنيف الفرعي أولاً'
                                : 'اختر التصنيف النهائي'}
                            </option>
                            {level3Categories.map((cat: any) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          {/* Show current field value for debugging */}
                          <p className="text-xs text-gray-400 mt-1">
                            قيمة التصنيف: {field.value || 'فارغة'}
                          </p>
                        </>
                      )}
                    />
                    {/* Debug info - remove in production */}
                    {categoryId && (
                      <p className="text-xs text-green-400 mt-1">
                        ✓ تم اختيار التصنيف: {categoryId.substring(0, 8)}...
                      </p>
                    )}
                    {errors.categoryId && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.categoryId.message || 'التصنيف مطلوب'}
                      </p>
                    )}
                    {backendErrors.categoryId && (
                      <p className="text-red-400 text-sm mt-1">
                        {backendErrors.categoryId}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      label="رابط المنتج (Slug) *"
                      placeholder="product-url-slug"
                      {...register('slug')}
                      onKeyPress={(
                        e: React.KeyboardEvent<HTMLInputElement>,
                      ) => {
                        // Prevent Arabic characters from being typed
                        const char = e.key;
                        if (/[\u0600-\u06FF]/.test(char)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {errors.slug && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.slug.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      إنجليزي فقط: أحرف صغيرة، أرقام، شرطات (مثال:
                      my-product-123)
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white mb-1">
                      الوصف التفصيلي *
                    </label>
                    <Controller
                      name="detailed_description"
                      control={control}
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {errors.detailed_description && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.detailed_description.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      label="الضمان"
                      placeholder="مثال: ضمان سنة واحدة"
                      {...register('warranty')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      الدفع عند الاستلام
                    </label>
                    <select
                      {...register('cashOnDelivery')}
                      className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-colors"
                    >
                      <option value="yes">نعم</option>
                      <option value="no">لا</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      قابل للإرجاع
                    </label>
                    <Controller
                      name="isReturnable"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          value={field.value ? 'true' : 'false'}
                          onChange={(e) =>
                            field.onChange(e.target.value === 'true')
                          }
                          className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-colors"
                        >
                          <option value="true">نعم — قابل للإرجاع</option>
                          <option value="false">لا — غير قابل للإرجاع</option>
                        </select>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white mb-2">
                      المواصفات التفصيلية
                    </label>
                    <p className="text-xs text-gray-400 mb-3">
                      أضف مواصفات المنتج مجمّعة حسب الفئة (مثال: الشاشة، الصوت،
                      القماش...). ستظهر للمشتري في صفحة المنتج.
                    </p>
                    <CustomSpecsEditor
                      value={customSpecs}
                      onChange={setCustomSpecs}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="الوسوم"
                      placeholder="وسم1، وسم2، وسم3 (مفصولة بفواصل)"
                      {...register('tags')}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'options' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Product Options
                  </h2>
                  <label className="flex items-center gap-2 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="rounded border-gray-600 cursor-not-allowed"
                    />
                    This product has variants
                  </label>
                </div>

                {hasVariants ? (
                  <ProductOptionsConfig
                    options={productOptions}
                    onChange={setProductOptions}
                    categoryType={categoryType}
                  />
                ) : (
                  <div className="bg-gray-750 rounded-lg p-6 text-center">
                    <p className="text-gray-400">
                      This is a simple product without variants.
                      <br />
                      Enable "This product has variants" to configure options
                      like Color, Size, etc.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'variants' && hasVariants && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Tip:</strong> Images are managed in the{' '}
                    <strong>Images</strong> tab. Upload images by{' '}
                    {visualOption?.name || 'option'} and they'll be
                    automatically assigned to matching variants.
                  </p>
                </div>
                <VariantManager
                  options={productOptions}
                  variants={variants}
                  onChange={setVariants}
                  // Price and stock moved to variants only
                  basePrice={0}
                  baseSalePrice={undefined}
                  shopName={shop?.name}
                  storeName={shop?.seller?.storeName}
                  onBarcodeClick={(sku, variantLabel) => {
                    setCurrentSku(sku);
                    setCurrentVariantLabel(variantLabel);
                    setBarcodeModalOpen(true);
                  }}
                  onQrCodeClick={(sku, variantLabel) => {
                    setCurrentSkuForQr(sku);
                    setCurrentVariantLabelForQr(variantLabel);
                    setQrCodeModalOpen(true);
                  }}
                />
              </div>
            )}

            {activeTab === 'variants' && !hasVariants && (
              <div className="bg-gray-750 rounded-lg p-6 text-center">
                <p className="text-gray-400">
                  Enable "This product has variants" in the Options tab to
                  manage variants.
                </p>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-6">
                {/* Product Images (Fallback) */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">
                    Product Images (Fallback)
                  </h2>
                  <p className="text-sm text-gray-400 mb-4">
                    These images are used as fallback when variant-specific
                    images are not available.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 row-span-2">
                      <ImagePlaceholder
                        setOpenImageModel={setOpenImageModel}
                        size="400 * 400"
                        small={false}
                        images={images}
                        index={0}
                        onImageChange={handleImageChange}
                        onRemoveImage={handleRemoveImage}
                        openImageModel={openImageModel}
                        uploading={isUploading(0)}
                        setSelectedImage={setSelectedImage}
                      />
                    </div>
                    {[1, 2, 3].map((idx) => (
                      <ImagePlaceholder
                        key={idx}
                        setOpenImageModel={setOpenImageModel}
                        size="200 * 200"
                        small={true}
                        images={images}
                        index={idx}
                        onImageChange={handleImageChange}
                        onRemoveImage={handleRemoveImage}
                        openImageModel={openImageModel}
                        uploading={isUploading(idx)}
                        setSelectedImage={setSelectedImage}
                      />
                    ))}
                  </div>
                  <ImageUploadInfo />
                </div>

                {/* Color-Based Images (if has visual option) */}
                {hasVariants && hasVisualOption && (
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">
                      Variant Images by {visualOption.name}
                    </h2>
                    <ColorImageManager
                      colorOption={visualOption.name}
                      colorValues={visualOption.values.map((v) => v.value)}
                      colorImages={colorImages}
                      onChange={setColorImages}
                      setSelectedImage={setSelectedImage}
                      setOpenImageModel={setOpenImageModel}
                      openImageModel={openImageModel}
                    />
                  </div>
                )}

                {hasVariants && !hasVisualOption && (
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm">
                      ℹ️ Add a visual option (like Color) in the Options tab to
                      manage variant-specific images. Currently, all variants
                      will use the product images above.
                    </p>
                  </div>
                )}

                {openImageModel && selectedImage && (
                  <ImageModal
                    selectedImage={selectedImage}
                    onClose={() => setOpenImageModel(false)}
                  />
                )}

                <ImageUploadInfo />
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">
                    فيديوهات المنتج
                  </h2>
                  <p className="text-sm text-gray-400 mb-4">
                    أضف فيديو واحد للمنتج. الحد الأقصى 50 ميجابايت. صيغ مدعومة:
                    MP4، WebM، MOV.
                  </p>
                  <div className="max-w-sm">
                    <VideoPlaceholder
                      index={0}
                      videos={videos}
                      uploading={isVideoUploading(0)}
                      onVideoChange={handleVideoChange}
                      onRemoveVideo={handleRemoveVideo}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barcode Modal */}
        {barcodeModalOpen && (
          <BarcodeModal
            isOpen={barcodeModalOpen}
            onClose={() => setBarcodeModalOpen(false)}
            sku={currentSku}
            productTitle={watch('title')}
            variantLabel={currentVariantLabel}
          />
        )}

        {/* QR Code Modal */}
        {qrCodeModalOpen && (
          <QRCodeModal
            isOpen={qrCodeModalOpen}
            onClose={() => setQrCodeModalOpen(false)}
            sku={currentSkuForQr}
            productTitle={watch('title')}
            variantLabel={currentVariantLabelForQr}
          />
        )}
      </form>
    </div>
  );
}