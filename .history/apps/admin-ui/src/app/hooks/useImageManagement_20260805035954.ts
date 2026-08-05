import { useState } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance.js';

export interface ReviewImage {
  url: string;
  fileId: string;
}

export type ImageUploadType = 'review' | 'brand' | 'product';

export const useImageManagement = (
  initialImages: ReviewImage[] = [],
  maxImages: number = 1,
  uploadType: ImageUploadType = 'review',
) => {
  const [images, setImages] = useState<ReviewImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);

  const getUploadEndpoint = () => {
    switch (uploadType) {
      case 'brand':
        return '/api/brands/upload-logo';
      case 'product':
        return '/api/products/upload-image';
      default:
        return '/user/api/reviews/upload-image';
    }
  };

  const getDeleteEndpoint = () => {
    switch (uploadType) {
      case 'brand':
        return '/api/brands/delete-logo';
      case 'product':
        return '/api/products/delete-image';
      default:
        return '/user/api/reviews/delete-image';
    }
  };

  const uploadImage = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('الرجاء رفع صورة.');
      return;
    }

    setUploading(true);
    try {
      const compressedBase64 = await compressImage(file);

      const res = await axiosInstance.post(
        getUploadEndpoint(),
        { fileName: compressedBase64 },
        { withCredentials: true },
      );

      const newImage: ReviewImage = {
        url: res.data.file_url,
        fileId: res.data.fileId,
      };

      setImages((prev) => {
        if (prev.length >= maxImages) {
          return prev;
        }
        return [...prev, newImage];
      });

      toast.success('تم رفع الصورة بنجاح!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];
    if (!imageToRemove) return;

    try {
      await axiosInstance.post(
        getDeleteEndpoint(),
        { fileId: imageToRemove.fileId },
        { withCredentials: true },
      );
      toast.success('تم حذف الصورة بنجاح!');
    } catch (error) {
      console.error('Delete image error:', error);
    } finally {
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const clearImages = () => {
    setImages([]);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 1200;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.8));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  return {
    images,
    setImages,
    uploadImage,
    removeImage,
    clearImages,
    uploading,
  };
};
