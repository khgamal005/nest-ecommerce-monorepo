'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Tag,
  Image as ImageIcon,
  Monitor,
  ChevronRight,
  ChevronDown,
  Edit2,
  X,
} from 'lucide-react';
import axiosInstance from '../../../utils/axiosInstance';
import {
  useImageManagement,
  compressImage,
} from '../../../hooks/useImageManagement';
import ImagePlaceholder from '../../../components/ImagePlaceholder';
import { ImageModal } from '../../../components/ImageModal';

interface RichBanner {
  fileId: string;
  file_Url: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  textPosition: 'left' | 'center' | 'right';
  textColor: string;
  overlayOpacity: number;
  order: number;
  isActive: boolean;
  objectFit?: 'cover' | 'contain';
}

interface Customization {
  banners: RichBanner[];
  logo: { fileId: string; file_Url: string } | string;
}

const SettingsPage = () => {
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '' });
  const [bannerModal, setBannerModal] = useState({
    isOpen: false,
    editingIndex: -1,
  });
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0);
  const [bannerFormData, setBannerFormData] = useState<RichBanner>({
    fileId: '',
    file_Url: '',
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '',
    textPosition: 'center',
    textColor: '#ffffff',
    overlayOpacity: 0.5,
    order: 0,
    isActive: true,
    objectFit: 'cover',
  });
  const [bannerUploading, setBannerUploading] = useState(false);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [selectedBannerPreview, setSelectedBannerPreview] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Banner images management
  const {
    images: bannerImages,
    handleImageChange: handleBannerChange,
    handleRemoveImage: handleBannerRemove,
    isUploading: isBannerUploading,
    setImages: setBannerImages,
    getValidImages: getValidBannerImages,
  } = useImageManagement(
    [null],
    (newImages) => {
      const validImages = newImages.filter((img) => img !== null) as {
        fileId: string;
        file_Url: string;
      }[];
      // This is for temporary image upload, actual banner save happens with form data
    },
    '/api/admin/upload-image-banner',
    '/api/admin/delete-image-banner',
  );

  // Logo image management
  const {
    images: logoImages,
    handleImageChange: handleLogoChange,
    handleRemoveImage: handleLogoRemove,
    isUploading: isLogoUploading,
    setImages: setLogoImages,
  } = useImageManagement(
    [null],
    (newImages) => {
      const validImage = newImages.find((img) => img !== null);
      if (validImage) {
        updateCustomizationsMutation.mutate({
          logo: {
            fileId: validImage.fileId,
            file_Url: validImage.file_Url,
          },
        });
      }
    },
    '/api/admin/upload-image-logo',
    '/api/admin/delete-image-logo',
  );

  const [richBanners, setRichBanners] = useState<RichBanner[]>([]);

  const fetchCustomizations = async (): Promise<Customization> => {
    const res = await axiosInstance.get('/api/admin/customizations');
    console.log('Fetched customizations:', res.data);
    return {
      banners: res.data.banners || [],
      logo: res.data.logo,
    };
  };

  const { data: customizations, isLoading: isLoadingCustomizations } = useQuery(
    {
      queryKey: ['customizations'],
      queryFn: fetchCustomizations,
      staleTime: 5 * 60 * 1000,
    },
  );

  // Initialize rich banners when customizations data is fetched
  useEffect(() => {
    if (customizations?.banners && Array.isArray(customizations.banners)) {
      setRichBanners(customizations.banners.sort((a, b) => a.order - b.order));
    }
    if (customizations?.logo) {
      const logoData =
        typeof customizations.logo === 'string'
          ? { file_Url: customizations.logo, fileId: '' }
          : customizations.logo;
      setLogoImages([logoData]);
    }
  }, [customizations]);

  const updateCustomizationsMutation = useMutation({
    mutationFn: async (
      data:
        | Partial<Customization>
        | { banner: { fileId: string; file_Url: string } }
        | { logo: { fileId: string; file_Url: string } }
        | { logo: null },
    ) => {
      const res = await axiosInstance.put(
        '/api/admin/update-customizations',
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customizations'] });
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      alert(error.response?.data?.message || 'Failed to update customizations');
    },
  });

  // Banner handlers
  const handleEditBanner = (index: number) => {
    const bannerData = richBanners[index];
    // Merge with defaults to ensure all fields are defined
    setBannerFormData({
      fileId: bannerData.fileId || '',
      file_Url: bannerData.file_Url || '',
      title: bannerData.title || '',
      subtitle: bannerData.subtitle || '',
      buttonText: bannerData.buttonText || '',
      buttonLink: bannerData.buttonLink || '',
      textPosition: bannerData.textPosition || 'center',
      textColor: bannerData.textColor || '#ffffff',
      overlayOpacity:
        typeof bannerData.overlayOpacity === 'number'
          ? bannerData.overlayOpacity
          : 0.5,
      order: typeof bannerData.order === 'number' ? bannerData.order : 0,
      isActive:
        typeof bannerData.isActive === 'boolean' ? bannerData.isActive : true,
      objectFit: bannerData.objectFit || 'cover',
    });
    // Reset selected file states when editing to show existing banner image
    setSelectedBannerFile(null);
    setSelectedBannerPreview(null);
    setBannerModal({ isOpen: true, editingIndex: index });
  };

  const handleSaveBanner = async (imageFile?: File) => {
    try {
      let updatedFormData = { ...bannerFormData };

      // If new image is selected, upload it first
      if (imageFile) {
        setBannerUploading(true);
        const { fileId, file_Url } = await handleBannerImageUpload(imageFile);
        updatedFormData = { ...updatedFormData, fileId, file_Url };
        setBannerUploading(false);
        // Clear preview after successful upload
        setSelectedBannerPreview(null);
      }

      // Validate data - only image is required, title is optional
      if (!updatedFormData.file_Url) {
        alert('Please provide banner image');
        return;
      }

      let updatedBanners = [...richBanners];
      if (bannerModal.editingIndex === -1) {
        // New banner
        updatedFormData.order = richBanners.length;
        updatedBanners.push(updatedFormData);
      } else {
        // Edit existing
        updatedBanners[bannerModal.editingIndex] = updatedFormData;
      }

      // Save to backend
      updateCustomizationsMutation.mutate({ banners: updatedBanners });
      setBannerModal({ isOpen: false, editingIndex: -1 });
      setBannerFormData({
        fileId: '',
        file_Url: '',
        title: '',
        subtitle: '',
        buttonText: '',
        buttonLink: '',
        textPosition: 'center',
        textColor: '#ffffff',
        overlayOpacity: 0.5,
        order: 0,
        isActive: true,
        objectFit: 'cover',
      });
      // Cleanup selected file states after save
      setSelectedBannerFile(null);
      if (selectedBannerPreview) {
        URL.revokeObjectURL(selectedBannerPreview);
        setSelectedBannerPreview(null);
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      setBannerUploading(false);
      alert('Failed to save banner');
    }
  };

  const handleBannerImageUpload = async (file: File) => {
    const base64 = await compressImage(file, 1920);
    const response = await axiosInstance.post(
      '/api/admin/upload-image-banner',
      {
        fileName: base64,
      },
    );
    return {
      fileId: response.data.fileId,
      file_Url: response.data.file_url,
    };
  };

  const handleDeleteBanner = (index: number) => {
    const banner = richBanners[index];
    if (confirm('Are you sure you want to delete this banner?')) {
      // Delete from ImageKit
      if (banner.fileId) {
        axiosInstance
          .post('/api/admin/delete-image-banner', { fileId: banner.fileId })
          .catch(console.error);
      }
      const updatedBanners = richBanners.filter((_, i) => i !== index);
      updateCustomizationsMutation.mutate({ banners: updatedBanners });
    }
  };

  const handleRemoveLogo = async (index: number) => {
    await handleLogoRemove(index);
    // Persist the removal so the logo stays gone after reload
    updateCustomizationsMutation.mutate({ logo: null });
    queryClient.invalidateQueries({ queryKey: ['customizations'] });
  };

  const handlePreviewImage = (imageUrl: string) => {
    setImageModal({ isOpen: true, imageUrl });
  };

  const handleCloseImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: '' });
  };

  if (isLoadingCustomizations) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            Site Customizations
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage categories, multiple banners, and logos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rich Banners Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Rich Banners
                </h2>
              </div>
              <button
                onClick={() =>
                  setBannerModal({ isOpen: true, editingIndex: -1 })
                }
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Banner
              </button>
            </div>
          </div>

          {richBanners.length > 0 ? (
            <div className="p-6">
              {/* Banner Slider */}
              <div
                className="relative mb-6 rounded-lg overflow-hidden bg-gray-900 aspect-[21/9]"
              >
                {richBanners[currentBannerSlide] && (
                  <div className="relative w-full h-full">
                    {/* Banner Image */}
                    <img
                      src={richBanners[currentBannerSlide].file_Url}
                      alt={richBanners[currentBannerSlide].title}
                      className={`w-full h-full ${richBanners[currentBannerSlide].objectFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                    />

                    {/* Overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor:
                          'rgba(0, 0, 0, ' +
                          richBanners[currentBannerSlide].overlayOpacity +
                          ')',
                      }}
                    />

                    {/* Text Content */}
                    <div
                      className="absolute inset-0 flex flex-col justify-center items-start p-8"
                      style={{
                        textAlign: richBanners[currentBannerSlide]
                          .textPosition as any,
                        justifyContent:
                          richBanners[currentBannerSlide].textPosition ===
                          'left'
                            ? 'flex-start'
                            : richBanners[currentBannerSlide].textPosition ===
                                'right'
                              ? 'flex-end'
                              : 'center',
                      }}
                    >
                      <h3
                        className="text-4xl font-bold mb-2"
                        style={{
                          color: richBanners[currentBannerSlide].textColor,
                        }}
                      >
                        {richBanners[currentBannerSlide].title}
                      </h3>
                      {richBanners[currentBannerSlide].subtitle && (
                        <p
                          className="text-xl mb-6"
                          style={{
                            color: richBanners[currentBannerSlide].textColor,
                          }}
                        >
                          {richBanners[currentBannerSlide].subtitle}
                        </p>
                      )}
                      {richBanners[currentBannerSlide].buttonText && (
                        <a
                          href={richBanners[currentBannerSlide].buttonLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          {richBanners[currentBannerSlide].buttonText}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Arrows */}
                {richBanners.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentBannerSlide(
                          (prev) =>
                            (prev - 1 + richBanners.length) %
                            richBanners.length,
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() =>
                        setCurrentBannerSlide(
                          (prev) => (prev + 1) % richBanners.length,
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full transition-colors"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {/* Banner List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {richBanners.map((banner, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-12 h-12 rounded img-cover cursor-pointer ${
                            index === currentBannerSlide
                              ? 'ring-2 ring-blue-600'
                              : ''
                          }`}
                          onClick={() => setCurrentBannerSlide(index)}
                        >
                          <img
                            src={banner.file_Url}
                            alt={banner.title}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {banner.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {banner.subtitle || 'No subtitle'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}
                      >
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleEditBanner(index)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">
                No banners yet. Create one to get started!
              </p>
              <button
                onClick={() =>
                  setBannerModal({ isOpen: true, editingIndex: -1 })
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create First Banner
              </button>
            </div>
          )}
        </div>

        {/* Logos Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Logo</h2>
            </div>
          </div>

          <div className="p-6">
            <ImagePlaceholder
              onImageChange={(file) => handleLogoChange(file, 0)}
              onRemoveImage={
                logoImages[0] ? () => handleRemoveLogo(0) : undefined
              }
              onPreviewImage={
                logoImages[0]?.file_Url
                  ? () => handlePreviewImage(logoImages[0]!.file_Url)
                  : undefined
              }
              imageUrl={logoImages[0]?.file_Url}
              uploading={isLogoUploading(0)}
              className="w-full"
              aspectClass="aspect-[16/5]"
              objectFit="contain"
              label="Upload Logo"
            />
          </div>
        </div>
      </div>

      {/* Modals */}

      {/* Banner Editor Modal */}
      {bannerModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {bannerModal.editingIndex === -1
                  ? 'Create Banner'
                  : 'Edit Banner'}
              </h2>
              <button
                onClick={() => {
                  setBannerModal({ isOpen: false, editingIndex: -1 });
                  setBannerFormData({
                    fileId: '',
                    file_Url: '',
                    title: '',
                    subtitle: '',
                    buttonText: '',
                    buttonLink: '',
                    textPosition: 'center',
                    textColor: '#ffffff',
                    overlayOpacity: 0.5,
                    order: 0,
                    isActive: true,
                    objectFit: 'cover',
                  });
                  setSelectedBannerFile(null);
                  if (selectedBannerPreview) {
                    URL.revokeObjectURL(selectedBannerPreview);
                    setSelectedBannerPreview(null);
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Banner Image
                </label>
                <ImagePlaceholder
                  onImageChange={(file) => {
                    setSelectedBannerFile(file);
                    if (file) {
                      const previewUrl = URL.createObjectURL(file);
                      setSelectedBannerPreview(previewUrl);
                    }
                  }}
                  onRemoveImage={
                    bannerFormData.file_Url || selectedBannerPreview
                      ? () => {
                          setBannerFormData({
                            ...bannerFormData,
                            fileId: '',
                            file_Url: '',
                          });
                          setSelectedBannerFile(null);
                          if (selectedBannerPreview) {
                            URL.revokeObjectURL(selectedBannerPreview);
                            setSelectedBannerPreview(null);
                          }
                        }
                      : undefined
                  }
                  imageUrl={selectedBannerPreview || bannerFormData.file_Url || undefined}
                  uploading={bannerUploading}
                  aspectClass="aspect-[21/9]"
                  objectFit={bannerFormData.objectFit}
                  className="w-full"
                  label="Upload Banner Image"
                />
                <p className="mt-2 text-xs text-blue-600 font-medium">
                  💡 Recommended aspect ratio: 21:9 (e.g., 1920x822px) for best appearance on all devices.
                </p>
                {(selectedBannerPreview || bannerFormData.file_Url) && (
                  <div className="mt-4 w-full aspect-[21/9] relative rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={selectedBannerPreview || bannerFormData.file_Url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={bannerFormData.title}
                  onChange={(e) =>
                    setBannerFormData({
                      ...bannerFormData,
                      title: e.target.value,
                    })
                  }
                  placeholder="Banner title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Subtitle
                </label>
                <textarea
                  value={bannerFormData.subtitle}
                  onChange={(e) =>
                    setBannerFormData({
                      ...bannerFormData,
                      subtitle: e.target.value,
                    })
                  }
                  placeholder="Optional subtitle"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Button Text & Link */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={bannerFormData.buttonText}
                    onChange={(e) =>
                      setBannerFormData({
                        ...bannerFormData,
                        buttonText: e.target.value,
                      })
                    }
                    placeholder="e.g., Shop Now"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Button Link
                  </label>
                  <input
                    type="url"
                    value={bannerFormData.buttonLink}
                    onChange={(e) =>
                      setBannerFormData({
                        ...bannerFormData,
                        buttonLink: e.target.value,
                      })
                    }
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Text Position */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Text Position
                </label>
                <select
                  value={bannerFormData.textPosition}
                  onChange={(e) =>
                    setBannerFormData({
                      ...bannerFormData,
                      textPosition: e.target.value as
                        | 'left'
                        | 'center'
                        | 'right',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              
              {/* Image Fit */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Image Fit
                </label>
                <select
                  value={bannerFormData.objectFit}
                  onChange={(e) =>
                    setBannerFormData({
                      ...bannerFormData,
                      objectFit: e.target.value as 'cover' | 'contain',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cover">Cover (Fill & Crop - Good for background photos)</option>
                  <option value="contain">Contain (Show whole image - Good for text/graphic banners)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Choose 'Contain' if your banner image has text or important content near the edges.
                </p>
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bannerFormData.textColor}
                    onChange={(e) =>
                      setBannerFormData({
                        ...bannerFormData,
                        textColor: e.target.value,
                      })
                    }
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bannerFormData.textColor}
                    onChange={(e) =>
                      setBannerFormData({
                        ...bannerFormData,
                        textColor: e.target.value,
                      })
                    }
                    placeholder="#ffffff"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Overlay Opacity */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Overlay Opacity:{' '}
                  {(bannerFormData.overlayOpacity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={bannerFormData.overlayOpacity}
                  onChange={(e) =>
                    setBannerFormData({
                      ...bannerFormData,
                      overlayOpacity: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bannerFormData.isActive}
                  onChange={(e) =>
                    setBannerFormData({
                      ...bannerFormData,
                      isActive: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <label className="text-sm font-medium text-gray-900">
                  Active
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setBannerModal({ isOpen: false, editingIndex: -1 });
                    setBannerFormData({
                      fileId: '',
                      file_Url: '',
                      title: '',
                      subtitle: '',
                      buttonText: '',
                      buttonLink: '',
                      textPosition: 'center',
                      textColor: '#ffffff',
                      overlayOpacity: 0.5,
                      order: 0,
                      isActive: true,
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveBanner(selectedBannerFile || undefined)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  {bannerModal.editingIndex === -1 ? 'Create' : 'Save'} Banner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal.isOpen && (
        <ImageModal
          selectedImage={imageModal.imageUrl}
          onClose={handleCloseImageModal}
        />
      )}
    </div>
  );
};

export default SettingsPage;
