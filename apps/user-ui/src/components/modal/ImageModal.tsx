import { X, ZoomIn, ZoomOut, RotateCw, WandSparkles } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { SafeImage } from '../media';

/* =========================== */
/* INTERFACES                  */
/* =========================== */

interface UploadImage {
  fileId: string;
  file_Url: string;
}

interface ImageModalProps {
  selectedImage: string;
  onClose: () => void;
}

interface MainImagePreviewProps {
  image: UploadImage | null;
  onRemove: () => void;
  onEdit: () => void;
}



/* =========================== */
/*   IMAGE MODAL               */
/* =========================== */

export const ImageModal: React.FC<ImageModalProps> = ({
  selectedImage,
  onClose,
}) => {
  if (!selectedImage) return null; // PREVENT BROKEN RENDER

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 p-6 rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Image Preview</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScale((prev) => Math.max(prev - 0.25, 0.5))}
              disabled={scale <= 0.5}
              className="p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-50"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              onClick={() => setScale((prev) => Math.min(prev + 0.25, 3))}
              disabled={scale >= 3}
              className="p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-50"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600"
            >
              <RotateCw size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setScale(1);
                setRotation(0);
              }}
              className="p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white bg-red-600 rounded-full hover:bg-red-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* IMAGE */}
        <div className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden">
          <div
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
            }}
          >
            <SafeImage
              src={selectedImage}
              alt="Product preview"
              width={800}
              height={600}
              useNextImage={false}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="mt-4 text-center text-gray-400 text-sm">
          Zoom: {Math.round(scale * 100)}% • Rotation: {rotation}°
        </div>
      </div>
    </div>
  );
};

/* =========================== */
/* MAIN IMAGE PREVIEW          */
/* =========================== */

// export const MainImagePreview: React.FC<MainImagePreviewProps> = ({
//   image,
//   onRemove,
//   onEdit,
// }) => {
//   if (!image?.file_Url) return null;

//   return (
//     <div className="relative mb-4 group">
//       <div className="relative w-full h-64 rounded-lg overflow-hidden">
//         <SafeImage
//           src={image.file_Url}
//           alt="Main product"
//           fill
//           className="object-cover rounded-lg"
//         />
//       </div>

//       {/* Overlay buttons */}
//       <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg">
//         <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//           <button
//             type="button"
//             onClick={onEdit}
//             className="p-2 text-white bg-blue-600 rounded-full hover:bg-blue-700"
//           >
//             <WandSparkles size={16} />
//           </button>
//           <button
//             type="button"
//             onClick={onRemove}
//             className="p-2 text-white bg-red-600 rounded-full hover:bg-red-700"
//           >
//             <X size={16} />
//           </button>
//         </div>
//       </div>

//       <div className="absolute bottom-3 left-3">
//         <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
//           Main Image
//         </span>
//       </div>
//     </div>
//   );
// };

/* =========================== */
/* THUMBNAIL GRID              */
/* =========================== */



// export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
//   images,
//   realIndex,
//   onRemoveImage,
//   setOpenImageModel,
//   setSelectedImage,
// }) => (
//   <div className="grid grid-cols-1 gap-3">
//     {images.map((image, index) => {
//       if (!image?.file_Url) return null;

//       const actualIndex = realIndex !== undefined ? realIndex : index;

//       return (
//         <div key={actualIndex} className="relative group">
//           <div className="relative w-full h-20 rounded-md overflow-hidden cursor-pointer">
//             <SafeImage
//               src={image.file_Url}
//               alt={`Thumbnail ${actualIndex}`}
//               fill
//               className="object-cover"
//               onClick={() => {
//                 setSelectedImage(image.file_Url);
//                 setOpenImageModel(true);
//               }}
//             />
//           </div>

//           <button
//             type="button"
//             onClick={() => onRemoveImage(actualIndex)}
//             className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 
//                        flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 
//                        transition-opacity hover:bg-red-700 shadow-lg"
//           >
//             ×
//           </button>
//         </div>
//       );
//     })}
//   </div>
// );


export const ImageUploadInfo: React.FC = () => (
  <div className="mt-4 text-sm text-gray-400">
    <p>• Upload up to 8 images</p>
    <p>• First image will be the main display</p>
    <p>• Supported formats: JPG, PNG, WebP</p>
    <p>• Maximum file size: 5MB</p>
  </div>
);
