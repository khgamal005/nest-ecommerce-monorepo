import type { AxiosInstance } from 'axios';
import { compressImage, dataURLToBlob } from '../hooks/useImageManagement';

export interface ModerationImageHashResult {
  reused: boolean;
  fileId: string;
  file_Url: string;
  imageHash: string;
}

export async function uploadModerationImageWithHash(
  file: File,
  axiosInstance: AxiosInstance,
): Promise<ModerationImageHashResult> {
  const dataURL = await compressImage(file);
  const blob = dataURLToBlob(dataURL);
  const formData = new FormData();
  formData.append('image', blob, 'image.webp');

  const response = await axiosInstance.post(
    '/api/products/upload-image-with-hash',
    formData,
  );
  const data: Record<string, unknown> = (response?.data ?? {}) as Record<string, unknown>;

  return {
    reused: Boolean(data.reused),
    fileId: (data.fileId as string) ?? (data.file_id as string) ?? '',
    file_Url: (data.file_Url as string) ?? (data.file_url as string) ?? (data.url as string) ?? '',
    imageHash: (data.imageHash as string) ?? (data.image_hash as string) ?? '',
  };
}
