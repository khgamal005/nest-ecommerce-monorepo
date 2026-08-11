import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X, Star, Heart, Store, MapPin } from 'lucide-react';
import { useStore } from '../../store';
import useUser from '../../hooks/use-user';
import { ProductDetailsInfo } from '../../types/Product';
import { formatEGP } from '@packages/utils/formatEGP';

interface ProductDetailsCardProps {
  data: ProductDetailsInfo;
  setIsQuickViewOpen: (open: boolean) => void;
}

function ProductDetailsCard({
  data,
  setIsQuickViewOpen,
}: ProductDetailsCardProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');

  // Get user from React Query
  const { isLoading: userLoading } = useUser();

  // Get store state and actions
  const {
    cart,
    wishlist,
  } = useStore();



  // Check if product is in wishlist

  // Check if product is in cart and get its quantity
  const cartItem = cart.find((item) => item.productId === data.id);
  const currentCartQuantity = cartItem?.quantity || 0;

  // Calculate max quantity that can be added
  const maxQuantityToAdd = Math.max(0, data.stock - currentCartQuantity);

  const hasSale = data.sale_price > 0 && data.sale_price < data.regular_price;
  const discountPercentage = hasSale
    ? Math.round(
        ((data.regular_price - data.sale_price) / data.regular_price) * 100
      )
    : 0;

  // Close modal on ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsQuickViewOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [setIsQuickViewOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsQuickViewOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsQuickViewOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);


  if (userLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
        {/* Modal Container */}
        <div
          ref={modalRef}
          className="bg-white rounded-2xl w-full max-w-6xl my-8 shadow-2xl animate-in fade-in zoom-in duration-300"
        >
          {/* Close Button */}
          <button
            onClick={() => setIsQuickViewOpen(false)}
            className="absolute top-4 right-4 z-20 bg-white rounded-full p-2 hover:bg-gray-100 transition-all duration-200 shadow-lg"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-700" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Column - Images */}
            <div className="p-6 lg:p-8 bg-gray-50">
              {/* Main Image */}
              <div className="relative h-80 lg:h-96 w-full rounded-xl overflow-hidden bg-white shadow-lg mb-4">
                <Image
                  src={data.images[selectedImage]?.url || '/placeholder.jpg'}
                  alt={data.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {hasSale && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 rounded-lg">
                    {discountPercentage}% OFF
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {data.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto py-2">
                  {data.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`${data.title} - View ${index + 1}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="p-6 lg:p-8">
              <div className="space-y-6">
                {/* Category & Rating */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
                    {typeof data.category === 'object' ? data.category?.name : data.category} • {typeof data.subCategory === 'object' ? data.subCategory?.name : data.subCategory}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star
                      size={16}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <span className="font-medium">
                      {data.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Product Title */}
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {data.title}
                </h1>

                {/* Price Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {hasSale ? (
                      <>
                        <span className="text-3xl font-bold text-gray-900">
                          {formatEGP(data.sale_price)}
                        </span>
                        <span className="text-xl text-gray-500 line-through">
                          {formatEGP(data.regular_price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900">
                        {formatEGP(data.regular_price)}
                      </span>
                    )}
                  </div>
                  {hasSale && (
                    <p className="text-lg font-bold text-red-600">
                      Save {formatEGP(data.regular_price - data.sale_price)} (
                      {discountPercentage}% off)
                    </p>
                  )}
                </div>

                {/* Short Description */}
                <div className="text-gray-600 leading-relaxed border-t pt-4">
                  {data.short_description}
                </div>

                {/* Colors */}
                {data.colors.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <p className="font-medium text-gray-900">
                      Available Colors
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.colors.map((color, index) => (
                        <button
                          key={index}
                          className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: color }}
                          aria-label={`Color option ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {data.sizes && data.sizes.length > 0 && (
                  <div className="space-y-3 pt-6 border-t">
                    <p className="font-medium text-gray-900">Sizes</p>
                    <div className="grid grid-cols-5 gap-2 max-w-xs">
                      {data.sizes.map((size, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSize(size)}
                          className={`px-2 py-3 text-center border rounded-md transition-colors font-medium ${
                            selectedSize === size
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-300 hover:border-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shop Information */}
                {data.shop && (
                  <div className="pt-6 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Store size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Sold by</p>
                          <p className="text-lg font-bold text-gray-900">
                            {data.shop.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin size={14} />
                      <span>{data.shop.address || 'No address provided'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductDetailsCard;
