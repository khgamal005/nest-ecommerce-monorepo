// src/types/Product.ts

export interface ProductImage {
  id: number;
  url: string;
  r2_key: string;
}

export interface ProductVideo {
  id: string;
  r2_key: string;
  url: string;
  mime_type: string;
  size_bytes?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  verified: boolean;
}

export interface Shop {
  id: string;
  name: string;
  address?: string;
  ratings?: number;
  category?: string;
}

// Generic Product Option (matches Prisma schema)
export interface ProductOptionValue {
  id: string;
  value: string; // "Red", "128GB", "XL", etc.
}

export interface ProductOption {
  id: string;
  name: string; // "Color", "Size", "RAM", "Storage", "Voltage", etc.
  required: boolean;
  values: ProductOptionValue[];
}

// Product Variant (matches Prisma schema)
export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  isActive: boolean;
  starting_date?: string | Date;
  ending_date?: string | Date;
  optionValues: {
    id: string;
    optionValueId: string;
    optionValue: ProductOptionValue & {
      option: { name: string };
    };
  }[];
  images?: ProductImage[];
  videos?: ProductVideo[];
}

interface BaseProduct {
  id: string;
  title: string;
  slug: string;
  category: string;
  subCategory: string;
  short_description: string;
  stock: number;
  regular_price: number;
  sellerId: string;

  sale_price: number;
  rating: number;
  colors: string[]; // Deprecated: kept for backward compatibility
  tags: string[];
}

// API product
export interface Product extends BaseProduct {
  brand: string | Brand;
  warranty: number;
  sizes: string[]; // Deprecated: kept for backward compatibility
  cashOnDelivery: string;
  images: ProductImage[];
  videos?: ProductVideo[];
  shop: Shop;
  ending_date: Date;
  createdAt: string;
  
  // NEW: Generic options system
  hasVariants: boolean;
  options?: ProductOption[];
  variants?: ProductVariant[];
}

// Selected options for display (fetched from backend)
export interface SelectedOption {
  name: string;  // "Color", "Size", "RAM", etc.
  value: string; // "Black", "M", "128GB", etc.
}

// Cart product (MINIMAL - stores only IDs)
export interface CartProduct {
  productId: string;
  variantId?: string; // Required if product has variants
  quantity: number;
  price: number; // Snapshot price at time of adding
  shopId: string;
  sellerId: string;
  
  // Display data (enriched from backend or cached)
  title?: string;
  slug?: string;
  image?: string;
  selectedOptions?: SelectedOption[]; // Fetched from backend
  stock?: number;
}


export interface LocationInfo {
  country: string | null;
  city: string | null;
  ip: string;
  latitude: number;
  longitude: number;
  loading: boolean;
}

export type CleanLocationInfo = Omit<LocationInfo, 'loading' | 'country' | 'city'> & {
  country: string;
  city: string;
};


export interface ProductDetailsInfo {
  id: string;
  shopId: string;
  title: string;
  slug: string;
  category: string | { name: string };
  subCategory: string | { name: string };
  rating: number;
  images: { id: number; url: string }[];
  videos?: ProductVideo[];
  sale_price: number;
  regular_price: number;
  short_description: string;
  colors: string[]; // Deprecated: kept for backward compatibility
  tags: string[];
  brand: string | Brand;
  stock: number;
  warranty: number;
  cashOnDelivery: boolean;
  sizes: string[]; // Deprecated: kept for backward compatibility
  ending_date: Date;
  createdAt: string;
  sellerId: string;
  shop?: {
    id: string;
    name: string;
    address?: string;
    ratings?: number;
    category?: string;
  };
  
  // NEW: Generic options system
  hasVariants: boolean;
  options?: ProductOption[];
  variants?: ProductVariant[];
}

