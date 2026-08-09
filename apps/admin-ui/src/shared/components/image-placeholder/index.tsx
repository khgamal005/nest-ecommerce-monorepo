import { UploadImage } from '../../../hooks/useImageManagement';
import { X, WandSparkles, Pencil } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';

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
  openImageModel,
  setSelectedImage,
}: ImagePlaceholderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onImageChange?.(file, index);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemoveImage?.(index);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
      const img = images[index]?.file_Url;

    if (!img) return;
      setSelectedImage(img);  

    setOpenImageModel(true);
    // console.log('openImageMode', openImageModel);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!hasImage) openFilePicker();
    else e.stopPropagation();
  };

  const hasImage = Boolean(images[index]?.file_Url);

  // Use ImageKit URL first, fallback to local preview
  const displaySrc = images[index]?.file_Url || '';


  return (
    <div
      onClick={handleContainerClick}
      className={`relative ${
        small ? 'h-20' : 'h-64'
      } w-full bg-black border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center transition-colors ${
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
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-30">
          <div className="spinner"></div>
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

          <button
            onClick={handleEdit}
            className="absolute top-2 left-2 z-20 p-1.5 text-white bg-blue-500 rounded-full hover:bg-blue-600 pointer-events-auto"
          >
            <WandSparkles size={14} />
          </button>

          <div className="relative w-full h-full pointer-events-none">
            <Image
              src={displaySrc}
              alt={`Product image ${index + 1}`}
              fill
              className="object-cover rounded-lg"
              // onError={() => setImagePreview(null)}
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
