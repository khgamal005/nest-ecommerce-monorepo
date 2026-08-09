'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  Package,
  Settings,
  Layers,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import axiosInstance from '../../../../utils/axiosInstance';
import Input from 'packages/components/input';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(
  () => import('packages/components/rich-text-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 w-full bg-gray-800 animate-pulse rounded-lg mt-2" />
    ),
  },
);

import {
  useImageManagement,
  UploadImage,
} from '../../../../hooks/useImageManagement';
import {
  ImageModal,
  ImageUploadInfo,
} from '../../../../shared/components/ImageModal';
import ImagePlaceholder from '../../../../shared/components/image-placeholder';
import ProductOptionsConfig, {
  ProductOption,
} from '../../../../components/ProductOptionsConfig';
import VariantManager, {
  ProductVariant,
} from '../../../../components/VariantManager';
import ColorImageManager from '../../../../components/ColorImageManager';
import CustomSpecsEditor, {
  CustomSpecs,
} from '../../../../components/CustomSpecsEditor';
import { convertFileToBase64 } from '../../../../utils/imageUtils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  productSchema,
  type ProductFormData,
} from '../../../../validation/productSchema';
import { useShop } from '../../../../hooks/useShop';
import { useVideoManagement } from '../../../../hooks/useVideoManagement';
import VideoPlaceholder from '../../../../shared/components/VideoPlaceholder';
import BrandSelector from '../../../../components/BrandSelector';
import BarcodeModal from '../../../../components/BarcodeModal';
import QRCodeModal from '../../../../components/QRCodeModal';

interface ColorImageGroup {
  colorValue: string;
  images: { fileId: string; file_Url: string; imageHash?: string }[];
}

// ProductFormData is imported from productSchema

export default function UpdateProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { shop } = useShop();
  const queryClient = useQueryClient();

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
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [currentSku, setCurrentSku] = useState('');
  const [currentVariantLabel, setCurrentVariantLabel] = useState('');
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [currentSkuForQr, setCurrentSkuForQr] = useState('');
  const [currentVariantLabelForQr, setCurrentVariantLabelForQr] = useState('');
  const [customSpecs, setCustomSpecs] = useState<CustomSpecs>({
    groups: [{ label: 'المواصفات', specs: [{ key: '', value: '' }] }],
  });

  const {
    videos,
    setVideos,
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
    reset,
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
      cashOnDelivery: 'yes',
      isReturnable: true,
      tags: '',
      hasVariants: false,
    },
  });

  const hasVariants = watch('hasVariants');
  const brandId = watch('brandId');
  const brandName = watch('brandName');

  // Image Management Hook with autoDelete: false to prevent accidental deletion during editing
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
    setImages,
  } = useImageManagement([], undefined);

  // Track if product has been modified with new images
  const [hasNewImages, setHasNewImages] = useState(false);
  const [hasShownImageWarning, setHasShownImageWarning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent page reload/close if new images are uploaded but not saved
  useEffect(() => {
    if (!isMounted) return; // Only run on client side

    const hasUploadedImages = images.some((img) => img !== null);
    const hasVariantImages = colorImages.some(
      (group) => group.images.length > 0,
    );

    // Only warn if there are NEW images (not from the original product)
    if (hasUploadedImages || hasVariantImages) {
      if (!hasNewImages) {
        setHasNewImages(true);

        // Show warning toast when first new image is uploaded (only once)
        if (!hasShownImageWarning && !isSubmitting) {
          toast(
            '⚠️ تحذير: لا تغلق الصفحة قبل حفظ التغييرات، وإلا ستفقد الصور المحملة',
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
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasNewImages && !isSubmitting) {
        e.preventDefault();
        // Modern browsers show their own message in the browser's language
        e.returnValue = '';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [
    images,
    colorImages,
    hasNewImages,
    isSubmitting,
    hasShownImageWarning,
    isMounted,
  ]);

  // Fetch Categories
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/categories/all');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
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
    setValue('categoryId', '');
  };

  const handleLevel2Change = (id: string) => {
    setSelectedLevel2(id);
    setSelectedLevel3('');
    setValue('categoryId', '');
  };

  const handleLevel3Change = (id: string, categoryId: string) => {
    setSelectedLevel3(id);
    setValue('categoryId', categoryId);
  };

  // Fetch Product Data
  const { data: productData, isLoading: isProductLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/api/products/admin/${productId}`,
      );
      return res.data;
    },
    enabled: !!productId,
  });

  // Populate Form with Product Data
  useEffect(() => {
    if (productData) {
      // Find category hierarchy from categoryId
      if (productData.categoryId && categories.length > 0) {
        // Find the level 3 category
        let foundLevel1: any = null;
        let foundLevel2: any = null;
        let foundLevel3: any = null;

        for (const level1 of categories.filter((c: any) => c.level === 1)) {
          for (const level2 of level1.children || []) {
            for (const level3 of level2.children || []) {
              if (level3.id === productData.categoryId) {
                foundLevel1 = level1;
                foundLevel2 = level2;
                foundLevel3 = level3;
                break;
              }
            }
            if (foundLevel3) break;
          }
          if (foundLevel3) break;
        }

        if (foundLevel1 && foundLevel2 && foundLevel3) {
          setSelectedLevel1(foundLevel1.id);
          setSelectedLevel2(foundLevel2.id);
          setSelectedLevel3(foundLevel3.id);
        }
      }

      // Basic Info
      reset({
        title: productData.title,
        short_description: productData.short_description,
        detailed_description: productData.detailed_description,
        brandId: productData.brandId || null,
        brandName: productData.brandName || null,
        categoryId: productData.categoryId,
        slug: productData.slug,
        sku: productData.sku || '',
        warranty: productData.warranty || '',
        cashOnDelivery: productData.cashOnDelivery ? 'yes' : 'no',
        isReturnable: productData.isReturnable !== false,
        tags: Array.isArray(productData.tags)
          ? productData.tags.join(', ')
          : productData.tags || '',
        hasVariants: productData.hasVariants,
      });

      // Custom specs
      if (productData.custom_specifications?.groups?.length > 0) {
        setCustomSpecs(productData.custom_specifications);
      } else {
        setCustomSpecs({
          groups: [{ label: 'المواصفات', specs: [{ key: '', value: '' }] }],
        });
      }

      // Videos
      if (productData.videos?.length > 0) {
        setVideos(
          productData.videos.map((v: any) => ({
            fileId: v.r2_key,
            url: v.url,
            cdn_url: v.cdn_url,
            mime_type: v.mime_type,
            size_bytes: v.size_bytes,
          })),
        );
      }

      // Options
      if (productData.options) {
        setProductOptions(
          productData.options.map((opt: any) => ({
            id:
              opt.id ||
              `option-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Add unique ID
            name: opt.name,
            required: opt.required ?? true,
            type: opt.type || 'single', // Add type field
            values: opt.values.map((v: any) => ({
              id:
                v.id ||
                `value-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Add unique ID
              value: v.value,
            })),
          })),
        );
      }

      // Variants
      if (productData.variants) {
        setVariants(
          productData.variants.map((v: any) => ({
            id:
              v.id ||
              `variant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Use database ID or generate unique ID
            sku: v.sku,
            price: Number(v.price) || 0,
            salePrice: Number(v.salePrice) || 0,
            stock: Number(v.stock) || 0,
            isActive: v.isActive,
            starting_date: v.starting_date,
            ending_date: v.ending_date,
            optionValues: v.optionValues.reduce((acc: any, ov: any) => {
              acc[ov.optionValue.option.name] = ov.optionValue.value;
              return acc;
            }, {}),
            images: v.images.map((img: any) => ({
              fileId: img.r2_key,
              file_Url: img.url,
            })),
          })),
        );

        // Determine Color Images from Variants
        // Strategy: Use productData.options directly to avoid async state issues with productOptions
        const derivedColorImages: ColorImageGroup[] = [];
        const colorOptName = productData.options.find(
          (o: any) =>
            o.name.toLowerCase().includes('color') ||
            o.name.toLowerCase().includes('colour') ||
            o.name.includes('اللون'),
        )?.name;

        if (colorOptName) {
          productData.variants.forEach((v: any) => {
            const colorValue = v.optionValues.find(
              (ov: any) => ov.optionValue.option.name === colorOptName,
            )?.optionValue.value;
            // Find matching group orcreate
            if (colorValue && v.images.length > 0) {
              let group = derivedColorImages.find(
                (g) => g.colorValue === colorValue,
              );
              if (!group) {
                group = { colorValue, images: [] };
                derivedColorImages.push(group);
              }
              // Add unique images
              v.images.forEach((img: any) => {
                if (
                  !group?.images.some(
                    (existing) => existing.fileId === img.r2_key,
                  )
                ) {
                  group?.images.push({
                    fileId: img.r2_key,
                    file_Url: img.url,
                  });
                }
              });
            }
          });
          setColorImages(derivedColorImages);
        }
      }

      // Images (Main Product Images - Only those NOT linked to a specific variant)
      const baseImages = (productData.images || []).filter(
        (img: any) => !img.productVariantId,
      );

      if (baseImages.length > 0) {
        const initialImages: UploadImage[] = baseImages.map((img: any) => ({
          fileId: img.r2_key,
          file_Url: img.url,
        }));
        const paddedImages: (UploadImage | null)[] = [...initialImages];
        if (paddedImages.length < 8) paddedImages.push(null);
        setImages(paddedImages);
      } else {
        setImages([null]);
      }
    }
  }, [productData, reset, setImages, categories]);

  const handleCategoryTypeChange = (
    type: 'clothing' | 'electronics' | 'simple' | 'custom',
  ) => {
    setCategoryType(type);
    setValue('hasVariants', type !== 'simple');
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
          `الخيارات المطلوبة مفقودة: ${missingRequiredOptions.map((o) => o.name).join('، ')}`,
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
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      // 🎨 Automatically assign images to variants based on color if available
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
          images: (colorImageGroup?.images || variant.images || []).filter(
            (img: any) => img?.fileId && img?.file_Url,
          ),
        };
      });

      const payload = {
        productId, // Needed for update
        ...data,
        categoryId: data.categoryId || undefined,
        tags,
        images: getValidImages(),
        options: productOptions,
        variants: hasVariants ? variantsWithImages : [],
        videos: getValidVideos(),
        custom_specifications: customSpecs,
      };

      // Use PATCH request for update
      const response = await axiosInstance.patch(
        `/api/products/${productId}`,
        payload,
      );

      toast.success(response.data.message || 'تم تحديث المنتج بنجاح!');
      queryClient.invalidateQueries({
        queryKey: ['shop-products'],
        refetchType: 'all',
      });
      router.push('/dashboard/all-products');
    } catch (error: any) {
      console.error('❌ Error updating product:', error);
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
            setError(err.field as any, {
              type: 'manual',
              message: err.message,
            });
          },
        );
        setBackendErrors(errors);
        toast.error('يرجى تصحيح الأخطاء في النموذج');
        setActiveTab('basic');
      } else if (error.response?.data?.message) {
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
        toast.error('فشل في تحديث المنتج');
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

  if (isProductLoading) {
    return (
      <div className="p-8 text-center text-gray-400">
        جاري تحميل تفاصيل المنتج...
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto px-2 sm:px-4 overflow-x-hidden">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              تحديث المنتج
            </h1>
            <div className="flex items-center text-sm text-gray-400 mt-1">
              <span
                className="text-blue-400 cursor-pointer shrink-0"
                onClick={() => router.push('/dashboard/all-products')}
              >
                لوحة التحكم
              </span>
              <ChevronRight size={16} className="mx-1 shrink-0" />
              <span className="truncate">تحديث المنتج</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                if (hasNewImages) {
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
              {isSubmitting ? 'جاري التحديث...' : 'تحديث المنتج'}
            </button>
          </div>
        </div>

        {/* Similar form structure as Create Product */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            قالب نوع المنتج
          </label>
          <div className="flex flex-wrap gap-2">
            {(['clothing', 'electronics', 'simple', 'custom'] as const).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleCategoryTypeChange(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${
                    categoryType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
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
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-750'
                  }`}
                >
                  <tab.icon size={14} className="shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 sm:p-6">
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
                      defaultBrandId={productData?.brandId || undefined}
                      defaultBrandName={
                        productData?.brand?.name ||
                        productData?.brandName ||
                        undefined
                      }
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      التصنيف الرئيسي (المستوى 1) *
                    </label>
                    {!isMounted || isCategoriesLoading ? (
                      <p className="text-gray-400">جاري التحميل...</p>
                    ) : (
                      <select
                        value={selectedLevel1}
                        onChange={(e) => handleLevel1Change(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      التصنيف الفرعي (المستوى 2) *
                    </label>
                    <select
                      value={selectedLevel2}
                      onChange={(e) => handleLevel2Change(e.target.value)}
                      disabled={!selectedLevel1}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      التصنيف النهائي (المستوى 3) *
                    </label>
                    <select
                      value={selectedLevel3}
                      onChange={(e) => {
                        const selected = level3Categories.find(
                          (cat: any) => cat.id === e.target.value,
                        );
                        if (selected) {
                          handleLevel3Change(selected.id, selected.id);
                        }
                      }}
                      disabled={!selectedLevel2}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                      {...register('slug', {
                        required: 'رابط المنتج مطلوب',
                        pattern: {
                          value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                          message:
                            'أحرف إنجليزية صغيرة وأرقام وشرطات فقط (لا عربي)',
                        },
                        validate: (value) => {
                          if (/[\u0600-\u06FF]/.test(value)) {
                            return 'الأحرف العربية غير مسموحة. استخدم الإنجليزية فقط';
                          }
                          return true;
                        },
                      })}
                      onKeyPress={(
                        e: React.KeyboardEvent<HTMLInputElement>,
                      ) => {
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      الوصف التفصيلي *
                    </label>
                    <Controller
                      name="detailed_description"
                      control={control}
                      rules={{ required: 'الوصف التفصيلي مطلوب' }}
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      الدفع عند الاستلام
                    </label>
                    <select
                      {...register('cashOnDelivery')}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="yes">نعم</option>
                      <option value="no">لا</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
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
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                          <option value="true">نعم — قابل للإرجاع</option>
                          <option value="false">لا — غير قابل للإرجاع</option>
                        </select>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={hasVariants}
                      onChange={(e) => {
                        setValue('hasVariants', e.target.checked);
                        if (!e.target.checked) setVariants([]);
                      }}
                      className="rounded border-gray-600"
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
                    <strong>Images</strong> tab.
                  </p>
                </div>
                <VariantManager
                  options={productOptions}
                  variants={variants}
                  onChange={setVariants}
                  basePrice={0}
                  baseSalePrice={0}
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

            {activeTab === 'images' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">
                    Product Images
                  </h2>
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
                    {[1, 2, 3, 4, 5, 6].map((idx) => (
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
