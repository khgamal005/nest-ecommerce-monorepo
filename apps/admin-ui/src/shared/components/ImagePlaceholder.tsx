'use client';
import { UploadImage } from '../../hooks/useImageManagement';
import { X, WandSparkles, Pencil } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';

interface ImagePlaceholderProps {
  size?: string;
  small?: boolean;
  onImageChange?: (file: File, index: number) => void;
  onRemoveImage?: (index: number) => void;
  index: number;
  images: (UploadImage | null)[];
  uploading?: boolean;
  setOpenImageModel: (open: boolean) => void;
  openImageModel: boolean;
  setSelectedImage: (src: string) => void;
}

export default function ImagePlaceholder({
  size,
  small,
  onImageChange,
  onRemoveImage,
  index,
  images,
  uploading = false,
  setOpenImageModel,
  setSelectedImage,
}: ImagePlaceholderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasImage = Boolean(images[index]?.file_Url);
  const displaySrc = images[index]?.file_Url || '';

  return (
    <div
      onClick={() => {
        if (!hasImage) inputRef.current?.click();
      }}
      className={`relative ${
        small ? 'h-20' : 'h-64'
      } w-full bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center transition-colors ${
        !hasImage ? 'cursor-pointer hover:border-gray-400' : 'cursor-default'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImageChange?.(f, index);
        }}
      />
      {uploading && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-50 rounded-lg">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {hasImage ? (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemoveImage?.(index);
            }}
            className="absolute top-2 right-2 z-20 p-1.5 text-white bg-red-500 rounded-full hover:bg-red-600"
          >
            <X size={14} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedImage(displaySrc);
              setOpenImageModel(true);
            }}
            className="absolute top-2 left-2 z-20 p-1.5 text-white bg-blue-500 rounded-full hover:bg-blue-600"
          >
            <WandSparkles size={14} />
          </button>
          <div className="relative w-full h-full pointer-events-none">
            <Image
              src={displaySrc}
              alt={`image ${index + 1}`}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="absolute top-2 right-2 p-1.5 rounded bg-slate-600 hover:bg-slate-500 shadow-lg"
          >
            <Pencil size={14} className="text-white" />
          </button>
          <div className="text-center p-4">
            <p
              className={`text-gray-400 ${
                small ? 'text-sm' : 'text-lg'
              } font-semibold mb-2`}
            >
              {size}
            </p>
            <p className={`text-gray-500 ${small ? 'text-xs' : 'text-sm'}`}>
              Click to upload
            </p>
          </div>
        </>
      )}
    </div>
  );
}
