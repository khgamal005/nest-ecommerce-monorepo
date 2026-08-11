import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';

const SafeImage = ({ src, alt, ...props }: any) => {
  if (!src || typeof src !== 'string') return null;
  return <Image src={src} alt={alt || 'image'} {...props} />;
};

interface ImageModalProps {
  selectedImage: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  selectedImage,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [selectedImage]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    },
    [scale, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, scale]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        const touch = e.touches[0];
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
      }
    },
    [scale, position]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging && scale > 1) {
        const touch = e.touches[0];
        setPosition({
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, scale]
  );

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
    setPosition({ x: 0, y: 0 });
  };
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setPosition({ x: 0, y: 0 });
  };
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  if (!selectedImage || !mounted) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 p-3 sm:p-4 rounded-lg max-w-4xl max-h-[90vh] w-full mx-2 sm:mx-4 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Top */}
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">معاينة الصورة</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-50"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-white text-sm min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-50"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600"
            >
              <RotateCw size={16} />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-white bg-gray-700 rounded-full hover:bg-gray-600 text-sm"
            >
              إعادة
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

        {/* Image Container - Draggable */}
        <div
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative min-h-0"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          onTouchCancel={handleMouseUp}
          style={{
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease',
              }}
            >
              <SafeImage
                src={selectedImage}
                alt="Product preview"
                width={1000}
                height={800}
                className="max-w-full max-h-[55vh] sm:max-h-[65vh] object-contain rounded-lg"
                draggable={false}
              />
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="mt-2 text-center text-gray-400 text-xs">
          {scale > 1 ? 'اسحب لتحريك الصورة' : 'تكبير ثم سحب لتحريك الصورة'}
        </div>
      </div>
    </div>
  );
};

export const ImageUploadInfo: React.FC = () => (
  <div className="mt-4 text-sm text-gray-400">
    <p>• رفع حتى 8 صور</p>
    <p>• الصورة الأولى ستكون الرئيسية</p>
    <p>• الصيغ المدعومة: JPG, PNG, WebP</p>
    <p>• الحد الأقصى لحجم الملف: 5MB</p>
  </div>
);
