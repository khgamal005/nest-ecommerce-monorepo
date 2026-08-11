import { Star } from 'lucide-react';
import { SafeImage } from '@/components/media';

interface ShopCardProps {
  shop: {
    id: string;
    avatar?: string;
    name: string;
    category?: { name: string } | string;
    ratingCount: number;
    ratingSum: number;
    followersCount: number;
    bio?: string;
    country?: string;
    productsCount: number;
  };
}

export default function ShopCard({ shop }: ShopCardProps) {
  return (
    <div className="group rounded-2xl border bg-white shadow-sm hover:shadow-lg transition overflow-hidden">
      {/* Cover */}
      <div className="h-24 bg-gradient-to-r rtl:bg-gradient-to-l from-blue-500 to-indigo-500 relative">
        <div className="w-20 h-20 absolute -bottom-10 start-4">
          <SafeImage
            src={shop.avatar}
            alt={shop.name}
            fill
            sizes="80px"
            useNextImage={false}
            className="rounded-full border-4 border-white object-cover bg-white"
          />
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 px-4 pb-4 space-y-2">
        {/* Name */}
        <h3 className="font-semibold text-gray-900 truncate">{shop.name}</h3>

        {/* Category */}
        {shop.category && (
          <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
            {typeof shop.category === 'object' ? shop.category?.name : shop.category}
          </span>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 text-sm">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="font-medium">
            {shop.ratingCount > 0 ? (shop.ratingSum / shop.ratingCount).toFixed(1) : '0.0'}
          </span>
          <span className="text-gray-500">({shop.followersCount} متابع)</span>
        </div>

        {/* Bio */}
        {shop.bio && (
          <p className="text-sm text-gray-600 line-clamp-2">{shop.bio}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3">
          <span className="text-xs text-gray-500">
            📍 {shop.country || 'حول العالم'}
          </span>

          <span className="text-xs font-medium text-blue-600">
            {shop.productsCount} منتج
          </span>
        </div>
      </div>
    </div>
  );
}
