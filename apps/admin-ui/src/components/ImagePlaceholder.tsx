import React from 'react';
import { Upload, X, Eye } from 'lucide-react';

interface ImagePlaceholderProps {
  onImageChange: (file: File) => void;
  onRemoveImage?: () => void;
  onPreviewImage?: () => void;
  imageUrl?: string;
  uploading?: boolean;
  className?: string;
  label?: string;
  aspectClass?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
}

const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  onImageChange,
  onRemoveImage,
  onPreviewImage,
  imageUrl,
  uploading = false,
  className = "w-full",
  label = "Upload Image",
  aspectClass = "aspect-square",
  objectFit = "cover"
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageChange(file);
    }
  };

  console.log('ImagePlaceholder received imageUrl:', imageUrl, typeof imageUrl);
  const hasImage = Boolean(imageUrl && typeof imageUrl === 'string' && imageUrl.trim());
  console.log('hasImage:', hasImage);

  return (
    <div className={`relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden ${aspectClass} ${className}`}>
      {hasImage ? (
        // Image Display
        <div className="relative w-full h-full group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl!}
            alt="Uploaded image"
            className={objectFit === 'cover' ? "object-cover w-full h-full" : objectFit === 'contain' ? "object-contain w-full h-full" : "object-fill w-full h-full"}
          />
          
          {/* Overlay with action buttons */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              {onPreviewImage && (
                <button
                  type="button"
                  onClick={onPreviewImage}
                  className="p-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              {onRemoveImage && (
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="p-2 text-white bg-red-600 rounded-full hover:bg-red-700 shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Upload Area
        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-3 bg-gray-100 rounded-full mb-3">
                <Upload className="h-6 w-6 text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
              <p className="text-xs text-gray-500">Click to browse files</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (Max 5MB)</p>
            </div>
          )}
        </label>
      )}
    </div>
  );
};

export default ImagePlaceholder;