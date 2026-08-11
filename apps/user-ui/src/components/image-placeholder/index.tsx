'use client';

import { X, Pencil } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';
import {
  useImageManagement,
  ReviewImage,
} from '../../hooks/useImageManagement';
import { SafeImage } from '../media';

interface ImagePlaceholderProps {
  size?: string;
  small?: boolean;
  index: number;
  initialImage?: ReviewImage | null;
  onImageChange?: (image: ReviewImage) => void;
}

export default function ImagePlaceholder({
  size,
  small,
  index,
  initialImage,
  onImageChange,
}: ImagePlaceholderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { images, setImages, uploadImage, removeImage, uploading } =
    useImageManagement(initialImage ? [initialImage] : []);

  const openFilePicker = () => inputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadImage(file);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await removeImage(0);
    onImageChange?.(null as any);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!hasImage) {
      e.preventDefault();
      openFilePicker();
    }
  };

  const image = images[0];
  const hasImage = Boolean(image?.url);

  return (
    <div
      onClick={handleContainerClick}
      className={`relative ${small ? 'h-20' : 'h-64'} w-full bg-black border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center transition-colors ${
        !hasImage ? 'cursor-pointer hover:border-gray-400' : 'cursor-default'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {hasImage ? (
        <>
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 z-20 p-1.5 text-white bg-red-500 rounded-full hover:bg-red-600 pointer-events-auto"
          >
            <X size={14} />
          </button>

          <div className="relative w-full h-full pointer-events-none">
            <SafeImage
              src={image?.url || ''}
              alt={`Product image ${index + 1}`}
              fill
              useNextImage={false}
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
              openFilePicker();
            }}
            className="absolute top-2 right-2 p-1.5 rounded bg-slate-600 hover:bg-slate-500 shadow-lg pointer-events-auto"
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
              Click to upload image
            </p>
            {!small && (
              <p className="text-gray-500 text-xs mt-1">
                Recommended size: {size}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
