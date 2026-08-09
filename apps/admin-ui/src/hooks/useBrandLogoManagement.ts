import { useState } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { compressImage, dataURLToBlob } from './useImageManagement';

export interface BrandLogo {
  /** R2 key — e.g. "brands/logos/<uuid>.webp" */
  r2Key: string;
  url: string;
}

/**
 * Normalise the raw brand record coming from the DB / API into BrandLogo.
 * Call this in openEdit so the hook always holds a clean shape.
 */
export const toBrandLogo = (
  logo: string | null,
  logoR2Key: string | null
): BrandLogo | null => {
  if (!logo || !logoR2Key) return null;
  return { r2Key: logoR2Key, url: logo };
};

export const useBrandLogoManagement = (initial: BrandLogo | null = null) => {
  const [logo, setLogo] = useState<BrandLogo | null>(initial);
  const [uploading, setUploading] = useState(false);

  const uploadLogo = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large — max 5 MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    setUploading(true);
    try {
      const dataURL = await compressImage(file, 512);
      const blob = dataURLToBlob(dataURL);
      const formData = new FormData();
      formData.append('image', blob, 'logo.webp');

      const { data } = await axiosInstance.post(
        '/api/brands/upload-logo',
        formData
      );

      // Backend returns { success, file_url, fileId }
      if (!data.fileId || !data.file_url) {
        throw new Error('Unexpected upload response shape');
      }

      setLogo({ r2Key: data.fileId, url: data.file_url });
      toast.success('Logo uploaded.');
    } catch {
      toast.error('Failed to upload logo.');
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    const key = logo?.r2Key;

    // Optimistic clear so the UI responds immediately
    setLogo(null);

    if (!key) {
      // Logo existed only as a URL with no R2 key (legacy record) — nothing to purge
      return;
    }

    try {
      await axiosInstance.post('/api/brands/delete-logo', {
        fileId: key,
      }, { requiresAuth: true } as any);
      toast.success('Logo removed.');
    } catch {
      toast.error('Failed to remove logo from storage.');
    }
  };

  return { logo, setLogo, uploadLogo, removeLogo, uploading };
};