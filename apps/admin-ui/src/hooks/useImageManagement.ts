import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

export interface UploadImage {
  fileId: string;
  file_Url: string;
}

export interface ReviewImage {
  url: string;
  fileId: string;
}

const DEFAULT_UPLOAD_ENDPOINT = '/api/uploads/upload-image';
const DEFAULT_DELETE_ENDPOINT = '/api/uploads/delete-image';

/**
 * Compress + resize an image and return it as a base64 data URL (WEBP).
 */
export async function compressImage(
  file: File,
  maxDimension = 1200,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxDimension / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas is not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataURLToBlob(dataURL: string): Blob {
  const [meta, base64] = dataURL.split(',');
  const mime = meta.match(/data:(.*?);/)?.[1] || 'image/webp';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function useImageManagement(
  initialImages: (UploadImage | null)[] = [],
  onImagesChange?: (images: (UploadImage | null)[]) => void,
  uploadEndpoint = DEFAULT_UPLOAD_ENDPOINT,
  deleteEndpoint = DEFAULT_DELETE_ENDPOINT,
) {
  const [images, setImagesState] = useState<(UploadImage | null)[]>(initialImages);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openImageModel, setOpenImageModel] = useState(false);

  const imagesRef = useRef(images);
  imagesRef.current = images;
  const onChangeRef = useRef(onImagesChange);
  onChangeRef.current = onImagesChange;

  const setImages = useCallback((next: (UploadImage | null)[]) => {
    setImagesState(next);
    imagesRef.current = next;
    onChangeRef.current?.(next);
  }, []);

  const handleImageChange = useCallback(
    async (file: File, index: number) => {
      if (!file) return;
      try {
        setUploadingIndex(index);
        const dataURL = await compressImage(file);
        const blob = dataURLToBlob(dataURL);
        const formData = new FormData();
        formData.append('image', blob, 'image.webp');
        formData.append('folder', 'products');
        const res = await axiosInstance.post(uploadEndpoint, formData);
        const uploaded: UploadImage = {
          fileId: res.data.fileId,
          file_Url: res.data.file_url,
        };
        setImagesState((prev) => {
          const next = [...prev];
          next[index] = uploaded;
          imagesRef.current = next;
          return next;
        });
        onChangeRef.current?.(imagesRef.current);
        toast.success('تم رفع الصورة بنجاح!');
      } catch {
        toast.error('فشل في رفع الصورة');
      } finally {
        setUploadingIndex(null);
      }
    },
    [uploadEndpoint],
  );

  const handleRemoveImage = useCallback(
    async (index: number) => {
      const imageToRemove = imagesRef.current[index];
      if (imageToRemove?.fileId) {
        try {
          await axiosInstance.post(deleteEndpoint, {
            fileId: imageToRemove.fileId,
          });
        } catch {
          // ignore delete errors, still clear locally
        }
      }
      setImagesState((prev) => {
        const next = [...prev];
        next[index] = null;
        imagesRef.current = next;
        return next;
      });
      onChangeRef.current?.(imagesRef.current);
    },
    [deleteEndpoint],
  );

  const isUploading = useCallback((index: number) => uploadingIndex === index, [uploadingIndex]);

  const getValidImages = useCallback(
    () => imagesRef.current.filter((img): img is UploadImage => img !== null),
    [],
  );

  return {
    images,
    setImages,
    handleImageChange,
    handleRemoveImage,
    isUploading,
    getValidImages,
    selectedImage,
    openImageModel,
    setOpenImageModel,
    setSelectedImage,
    uploading: uploadingIndex !== null,
  };
}
