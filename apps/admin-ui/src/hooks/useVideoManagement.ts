import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

export interface UploadVideo {
  fileId: string;
  url: string;
  mime_type: string;
  size_bytes?: number;
}

const VIDEO_UPLOAD_ENDPOINT = '/api/uploads/upload-video';
const VIDEO_DELETE_ENDPOINT = '/api/uploads/delete-video';

export function useVideoManagement(initialVideos: (UploadVideo | null)[] = []) {
  const [videos, setVideosState] = useState<(UploadVideo | null)[]>(initialVideos);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const videosRef = useRef(videos);
  videosRef.current = videos;

  const setVideos = (next: (UploadVideo | null)[]) => {
    setVideosState(next);
    videosRef.current = next;
  };

  const handleVideoChange = async (file: File, index: number) => {
    if (!file) return;
    try {
      setUploadingIndex(index);
      const formData = new FormData();
      formData.append('video', file);
      const res = await axiosInstance.post(VIDEO_UPLOAD_ENDPOINT, formData);
      const uploaded: UploadVideo = {
        fileId: res.data.fileId,
        url: res.data.file_url || res.data.url,
        mime_type: file.type || 'video/mp4',
        size_bytes: file.size,
      };
      setVideosState((prev) => {
        const next = [...prev];
        next[index] = uploaded;
        videosRef.current = next;
        return next;
      });
      toast.success('تم رفع الفيديو بنجاح');
    } catch {
      toast.error('فشل في رفع الفيديو');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveVideo = async (index: number) => {
    const removed = videosRef.current[index];
    if (removed?.fileId) {
      try {
        await axiosInstance.post(VIDEO_DELETE_ENDPOINT, {
          fileId: removed.fileId,
        });
      } catch {
        // ignore delete errors, still clear locally
      }
    }
    setVideosState((prev) => {
      const next = [...prev];
      next[index] = null;
      videosRef.current = next;
      return next;
    });
  };

  const isUploading = (index: number) => uploadingIndex === index;

  const getValidVideos = () =>
    videosRef.current.filter((video): video is UploadVideo => video !== null);

  return {
    videos,
    setVideos,
    handleVideoChange,
    handleRemoveVideo,
    isUploading,
    getValidVideos,
  };
}
