'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

const BarcodeComponent = dynamic(
  () => import('react-barcode'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-20 text-gray-400">
        جاري تحميل الباركود...
      </div>
    ),
  }
);

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sku: string;
  productTitle: string;
  variantLabel: string;
}

export default function BarcodeModal({
  isOpen,
  onClose,
  sku,
  productTitle,
  variantLabel,
}: BarcodeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `barcode-${sku}`,
  });

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [isOpen]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      setIsLoading(false);
      setError(null);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" dir="rtl">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-white transition"
          type="button"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-4 text-center">
          {productTitle}
        </h2>

        {/* Variant Label */}
        <p className="text-center text-gray-300 mb-4">
          {variantLabel}
        </p>

        {/* Barcode Area - This is what prints */}
        <div
          id="barcode-label-area"
          ref={componentRef}
          className="bg-white p-4 rounded-lg mb-4"
          style={{
            width: '50mm',
            minHeight: '25mm',
            padding: '2mm',
            textAlign: 'center',
          }}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-20 text-gray-500">
              جاري التحميل...
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {!isLoading && !error && sku && (
            <div className="flex flex-col items-center">
              <BarcodeComponent
                value={sku}
                format="CODE128"
                width={1.5}
                height={50}
                fontSize={9}
                margin={3}
                displayValue={true}
                background="transparent"
                lineColor="#000000"
              />
              <p className="text-sm text-gray-700 mt-2 font-mono">
                {sku}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              handlePrint();
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition"
            type="button"
          >
            طباعة الملصق
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-medium transition"
            type="button"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Print CSS - Scoped inside component */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #barcode-label-area,
          #barcode-label-area * {
            visibility: visible !important;
          }
          #barcode-label-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 50mm !important;
            height: 25mm !important;
            padding: 2mm !important;
            text-align: center !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
