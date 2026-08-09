'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadModerationImageWithHash } from '../utils/moderationImageHash';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import ImagePlaceholder from '../shared/components/image-placeholder/index';

export interface ColorImage {
  fileId: string;
  file_Url: string;
  imageHash?: string;
}

export interface ColorImageGroup {
  colorValue: string;
  images: ColorImage[];
}

interface ColorImageManagerProps {
  colorOption: string; // e.g., "Color"
  colorValues: string[]; // e.g., ["Black", "White", "Red"]
  colorImages: ColorImageGroup[];
  onChange: (colorImages: ColorImageGroup[]) => void;
  setSelectedImage: (src: string) => void;
  setOpenImageModel: (open: boolean) => void;
  openImageModel: boolean;
}

export default function ColorImageManager({
  colorOption,
  colorValues,
  colorImages,
  onChange,
  setSelectedImage,
  setOpenImageModel,
  openImageModel,
}: ColorImageManagerProps) {
  const [uploadingState, setUploadingState] = useState<{ color: string; index: number } | null>(null);

  const getColorImages = (colorValue: string): ColorImage[] => {
    return colorImages.find((g) => g.colorValue === colorValue)?.images || [];
  };

  const handleImageUpload = async (colorValue: string, index: number, file: File) => {
    setUploadingState({ color: colorValue, index });
    try {
      const result = await uploadModerationImageWithHash(file, axiosInstance);

      if (result.reused) {
        toast.success(`♻️ الصورة موجودة بالفعل لـ ${colorValue}، تم إعادة الاستخدام`, {
          duration: 3000,
        });
      }

      const newImage: ColorImage = {
        fileId: result.fileId,
        file_Url: result.file_Url,
        imageHash: result.imageHash,
      };

      const existingGroup = colorImages.find((g) => g.colorValue === colorValue);
      
      if (existingGroup) {
        onChange(
          colorImages.map((g) =>
            g.colorValue === colorValue
              ? { ...g, images: [...g.images, newImage] }
              : g
          )
        );
      } else {
        onChange([...colorImages, { colorValue, images: [newImage] }]);
      }

      toast.success(`تم رفع الصورة لـ ${colorValue}`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('فشل في رفع الصورة');
    } finally {
      setUploadingState(null);
    }
  };

  const handleImageRemove = async (colorValue: string, index: number) => {
    const group = colorImages.find((g) => g.colorValue === colorValue);
    const image = group?.images[index];

    if (image?.fileId) {
      try {
        await axiosInstance.post('/api/uploads/delete-image', {
          fileId: image.fileId,
        });
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    onChange(
      colorImages.map((g) =>
        g.colorValue === colorValue
          ? { ...g, images: g.images.filter((_, i) => i !== index) }
          : g
      )
    );
  };

  const copyImagesToColor = (fromColor: string, toColor: string) => {
    const sourceImages = getColorImages(fromColor);
    
    if (sourceImages.length === 0) {
      toast.error(`لا توجد صور لنسخها من ${fromColor}`);
      return;
    }

    const existingGroup = colorImages.find((g) => g.colorValue === toColor);
    
    if (existingGroup) {
      onChange(
        colorImages.map((g) =>
          g.colorValue === toColor
            ? { ...g, images: [...g.images, ...sourceImages] }
            : g
        )
      );
    } else {
      onChange([...colorImages, { colorValue: toColor, images: [...sourceImages] }]);
    }

    toast.success(`تم نسخ ${sourceImages.length} صور من ${fromColor} إلى ${toColor}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-400 mb-2 font-arabic">
          📸 إدارة صور المتغيرات حسب {colorOption}
        </h3>
        <p className="text-xs text-blue-300 font-arabic">
          بصفتك مسؤولاً، يمكنك إضافة أو حذف الصور لكل {colorOption === 'Color' ? 'لون' : colorOption}. ستنعكس التغييرات على جميع المتغيرات التي تشترك في نفس القيمة.
        </p>
      </div>

      {colorValues.map((colorValue) => {
        const images = getColorImages(colorValue);
        
        
        // Prepare images array for ImagePlaceholder (including an empty slot for upload if under limit)
        const placeholderImages = images.map(img => ({ fileId: img.fileId, file_Url: img.file_Url }));
        if (placeholderImages.length < 8) placeholderImages.push(null as any);

        return (
          <div
            key={colorValue}
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border border-gray-600 shadow-sm"
                  style={{
                    backgroundColor: colorValue.toLowerCase(),
                  }}
                  title={colorValue}
                />
                <div>
                  <h4 className="font-medium text-white">{colorValue}</h4>
                  <p className="text-xs text-gray-400">
                    تم رفع {images.length} صور
                  </p>
                </div>
              </div>

              {/* Copy from another color */}
              {colorValues.length > 1 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      copyImagesToColor(e.target.value, colorValue);
                      e.target.value = '';
                    }
                  }}
                  className="text-xs px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">نسخ من...</option>
                  {colorValues
                    .filter((c) => c !== colorValue && getColorImages(c).length > 0)
                    .map((c) => (
                      <option key={c} value={c}>
                        {c} ({getColorImages(c).length} images)
                      </option>
                    ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 font-arabic">
              {placeholderImages.map((_, index) => (
                <ImagePlaceholder
                  key={index}
                  index={index}
                  images={placeholderImages}
                  small={true}
                  uploading={uploadingState?.color === colorValue && uploadingState?.index === index}
                  setOpenImageModel={setOpenImageModel}
                  openImageModel={openImageModel}
                  setSelectedImage={setSelectedImage}
                  onImageChange={(file) => handleImageUpload(colorValue, index, file)}
                  onRemoveImage={() => handleImageRemove(colorValue, index)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {colorValues.length === 0 && (
        <div className="bg-gray-800/30 rounded-lg p-6 text-center border border-dashed border-gray-700 font-arabic">
          <ImageIcon size={32} className="text-gray-600 mx-auto mb-2 opacity-50" />
          <p className="text-gray-400 text-sm">
            لا توجد قيم متغيرات متاحة لإدارة الصور.
          </p>
        </div>
      )}
    </div>
  );
}
