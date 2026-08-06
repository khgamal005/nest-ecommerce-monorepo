import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import axiosInstance from '../utils/axiosInstance.js';

export interface ReviewImage {
  url: string;
  fileId: string;
}

export type ImageUploadType = 'review' | 'brand' | 'product';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGE_DIMENSION = 1200;
const WEBP_QUALITY = 0.8;

const FOLDER_BY_TYPE: Record<ImageUploadType, string> = {
  review: 'reviews',
  brand: 'brands',
  product: 'products',
};

const UPLOAD_ENDPOINT = '/api/uploads/upload-image';
const DELETE_ENDPOINT = '/api/uploads/delete-image';

export const useImageManagement = (
  initialImages: ReviewImage[] = [],
  maxImages: number = 1,
  uploadType: ImageUploadType = 'review',
) => {
  const [images, setImages] = useState<ReviewImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);

  const validateImage = (file: File): boolean => {
    if (!file) return false;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('حجم الصورة كبير جداً. الحد الأقصى 10 ميجابايت.');
      return false;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('الرجاء رفع صورة.');
      return false;
    }

    return true;
  };

  const compressImage = useCallback((file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.src = objectUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height && width > MAX_IMAGE_DIMENSION) {
          height = (height * MAX_IMAGE_DIMENSION) / width;
          width = MAX_IMAGE_DIMENSION;
        } else if (height > MAX_IMAGE_DIMENSION) {
          width = (width * MAX_IMAGE_DIMENSION) / height;
          height = MAX_IMAGE_DIMENSION;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to initialize canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            resolve(blob);
          },
          'image/webp',
          WEBP_QUALITY,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
    });
  }, []);

  const uploadImage = async (file: File) => {
    if (!validateImage(file)) return;

    setUploading(true);
    try {
      const blob = await compressImage(file);

      const formData = new FormData();
      formData.append('image', blob, 'image.webp');
      formData.append('folder', FOLDER_BY_TYPE[uploadType]);

      const res = await axiosInstance.post(UPLOAD_ENDPOINT, formData);

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
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'فشل في رفع الصورة');
      } else {
        toast.error('فشل في رفع الصورة');
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];
    if (!imageToRemove) return;

    try {
      await axiosInstance.post(DELETE_ENDPOINT, {
        fileId: imageToRemove.fileId,
      });
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

  return {
    images,
    setImages,
    uploadImage,
    removeImage,
    clearImages,
    uploading,
  };
};