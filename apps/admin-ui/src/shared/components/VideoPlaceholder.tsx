'use client';
import { useRef } from 'react';
import { UploadVideo } from '../../hooks/useVideoManagement';
import { X, Video, Upload } from 'lucide-react';

interface VideoPlaceholderProps {
  index: number;
  videos: (UploadVideo | null)[];
  uploading?: boolean;
  onVideoChange?: (file: File, index: number) => void;
  onRemoveVideo?: (index: number) => void;
}

export default function VideoPlaceholder({
  index,
  videos,
  uploading = false,
  onVideoChange,
  onRemoveVideo,
}: VideoPlaceholderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const video = videos[index];
  const hasVideo = Boolean(video?.url);
  const inputId = `product-video-upload-${index}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onVideoChange?.(file, index);
    e.target.value = '';
  };

  return (
    <div className="relative h-64 w-full">
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={handleFileChange}
      />

      {uploading && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 rounded-lg">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-white text-xs">جاري العمل...</p>
        </div>
      )}

      {hasVideo ? (
        <div className="relative h-64 w-full bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemoveVideo?.(index);
            }}
            className="absolute top-2 right-2 z-20 p-1.5 text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-lg"
            title="حذف الفيديو"
          >
            <X size={16} />
          </button>
          <video
            src={video!.url}
            className="w-full h-full object-contain rounded-lg"
            controls
            preload="metadata"
          />
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            {video!.mime_type?.split('/')[1]?.toUpperCase() || 'VIDEO'}
            {video!.size_bytes
              ? ` · ${(video!.size_bytes / (1024 * 1024)).toFixed(1)} MB`
              : ''}
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="relative h-64 w-full bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer hover:border-gray-400"
        >
          <div className="flex flex-col items-center pointer-events-none">
            <Video size={48} className="text-gray-600 mb-3" />
            <p className="text-gray-500 text-sm font-medium">
              لا يوجد فيديو لهذا المنتج
            </p>
            <span className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-white">
              <Upload size={14} />
              رفع فيديو
            </span>
          </div>
        </label>
      )}
    </div>
  );
}
