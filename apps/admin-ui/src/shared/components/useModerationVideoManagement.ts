import { useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

export interface UploadVideo {
  fileId: string;
  url: string;
  mime_type: string;
  size_bytes?: number;
}

export const useModerationVideoManagement = (initialVideos: (UploadVideo | null)[] = []) => {
  const [videos, setVideos] = useState<(UploadVideo | null)[]>(initialVideos);
  const [changed, setChanged] = useState(false);

  const handleRemoveVideo = async (index: number) => {
    const removed = videos[index];
    if (removed?.fileId) {
      try {
        await axiosInstance.post('/admin/api/moderation/products/delete-video', { fileId: removed.fileId });
        toast.success('تم حذف الفيديو بنجاح');
      } catch {
        toast.error('فشل في حذف الفيديو');
      }
    }
    const updated = [...videos];
    updated[index] = null;
    setVideos(updated);
    setChanged(true);
  };

  const getValidVideos = () => videos.filter(Boolean) as UploadVideo[];

  return { videos, setVideos, handleRemoveVideo, getValidVideos, changed, resetChanged: () => setChanged(false) };
};