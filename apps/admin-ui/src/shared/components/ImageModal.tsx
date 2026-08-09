'use client';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface ImageModalProps { selectedImage: string; onClose: () => void; }

export const ImageModal: React.FC<ImageModalProps> = ({ selectedImage, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  if (!selectedImage) return null;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(p => Math.min(Math.max(p + delta, 0.1), 3));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 p-6 rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">معاينة الصورة</h3>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setScale(p => Math.max(p - 0.25, 0.1))} className="p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600"><ZoomOut size={16} /></button>
            <button type="button" onClick={() => setScale(p => Math.min(p + 0.25, 3))} className="p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600"><ZoomIn size={16} /></button>
            <button type="button" onClick={() => setRotation(p => (p + 90) % 360)} className="p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600"><RotateCw size={16} /></button>
            <button type="button" onClick={() => { setScale(1); setRotation(0); }} className="p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600 text-xs">Reset</button>
            <button type="button" onClick={onClose} className="p-2 text-white bg-red-600 rounded-full hover:bg-red-700"><X size={20} /></button>
          </div>
        </div>
        <div 
          className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden cursor-zoom-in"
          onWheel={handleWheel}
        >
          <div style={{ transform: `scale(${scale}) rotate(${rotation}deg)`, transition: 'transform 0.2s ease' }}>
            <Image src={selectedImage} alt="preview" width={800} height={600} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
        <div className="mt-4 text-center text-gray-400 text-sm">Zoom: {Math.round(scale * 100)}% · Rotation: {rotation}° · Scroll to zoom</div>
      </div>
    </div>
  );
};

export const ImageUploadInfo: React.FC = () => (
  <div className="mt-4 text-sm text-gray-400">
    <p>• Upload up to 8 images</p>
    <p>• First image will be the main display</p>
    <p>• Supported formats: JPG, PNG, WebP</p>
    <p>• Maximum file size: 5MB</p>
  </div>
);
