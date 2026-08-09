'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import Input from 'packages/components/input';
import { UploadImage } from '../hooks/useImageManagement';
import { formatEGP } from '../utils/formatEGP';

export interface ProductVariant {
  id: string;
  sku: string;
  price?: number;
  salePrice?: number;
  stock?: number;
  isActive: boolean;
  optionValues: Record<string, string>;
  images: UploadImage[];
  starting_date?: string;
  ending_date?: string;
}

interface VariantManagerProps {
  options: { id: string; name: string; values: { id: string; value: string }[] }[];
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  basePrice: number;
  baseSalePrice?: number;
  shopName?: string; // Add shop name for SKU generation
  storeName?: string; // Add store name for SKU generation (preferred over shopName)
  onBarcodeClick?: (sku: string, variantLabel: string) => void; // Callback for barcode generation
  onQrCodeClick?: (sku: string, variantLabel: string) => void; // Callback for QR code generation
}

export function VariantManager({
  options,
  variants,
  onChange,
  basePrice,
  baseSalePrice,
  shopName,
  storeName,
  onBarcodeClick,
  onQrCodeClick,
}: VariantManagerProps) {
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
  const [editingVariant, setEditingVariant] = useState<string | null>(null);

  // Generate unique ID with timestamp to avoid collisions
  const generateId = () => `variant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Generate shop-prefixed SKU
  const generateShopSKU = (optionCodes?: string, counter?: number) => {
    // Use storeName if available, otherwise fall back to shopName
    const nameToUse = storeName || shopName;
    const shopPrefix = nameToUse 
      ? nameToUse
          .toLowerCase()
          .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric except hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
          .substring(0, 15) || 'shop'
      : 'shop';
    
    // Sanitize option codes to remove Arabic/spaces
    const sanitizedOptions = optionCodes 
      ? optionCodes
          .toLowerCase()
          .replace(/[\u0600-\u06FF]/g, '')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      : '';
      
    const optionPart = sanitizedOptions || 'var';
      
    const randomPart = Date.now().toString(36).substring(4, 7).toUpperCase();
    const counterPart = counter ? `-${counter}` : `-${randomPart}`;
    
    return `${shopPrefix}-${optionPart}${counterPart}`;
  };

  // Generate all combinations of option values
  const generateCombinations = useCallback((): Record<string, string>[] => {
    if (options.length === 0) return [];

    const validOptions = options.filter((opt) => opt.values.length > 0);
    if (validOptions.length === 0) return [];

    const generate = (
      opts: typeof validOptions,
      current: Record<string, string> = {}
    ): Record<string, string>[] => {
      if (opts.length === 0) return [current];

      const [first, ...rest] = opts;
      const results: Record<string, string>[] = [];

      for (const value of first.values) {
        const newCombo = { ...current, [first.name]: value.value };
        results.push(...generate(rest, newCombo));
      }

      return results;
    };

    return generate(validOptions);
  }, [options]);

  // Auto-generate variants
  const autoGenerateVariants = () => {
    const combinations = generateCombinations();
    if (combinations.length === 0) return;

    // Filter out existing combinations
    const existingCombos = new Set(
      variants.map((v) => JSON.stringify(v.optionValues))
    );

    const newVariants: ProductVariant[] = [];
    let counter = variants.length + 1;

    for (const combo of combinations) {
      const comboKey = JSON.stringify(combo);
      if (existingCombos.has(comboKey)) continue;

      const optionCodes = Object.values(combo)
        .join('-')
        .toLowerCase()
        .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic
        .replace(/\s+/g, '');
      
      newVariants.push({
        id: generateId(),
        sku: generateShopSKU(optionCodes, counter),
        price: basePrice || undefined,
        salePrice: baseSalePrice,
        stock: undefined,
        isActive: true,
        optionValues: combo,
        images: [],
      });

      counter++;
    }

    onChange([...variants, ...newVariants]);
  };

  // Add manual variant
  const addManualVariant = () => {
    const newVariant: ProductVariant = {
      id: generateId(),
      sku: generateShopSKU(),
      price: basePrice || undefined,
      salePrice: baseSalePrice,
      stock: undefined,
      isActive: true,
      optionValues: {},
      images: [],
    };

    onChange([...variants, newVariant]);
    setEditingVariant(newVariant.id);
  };

  // Remove variant
  const removeVariant = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
  };

  // Update variant
  const updateVariant = (id: string, updates: Partial<ProductVariant>) => {
    onChange(
      variants.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  // Toggle variant expansion
  const toggleExpand = (id: string) => {
    setExpandedVariants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Update option value for a variant
  const updateVariantOption = (variantId: string, optionName: string, value: string) => {
    updateVariant(variantId, {
      optionValues: {
        ...variants.find((v) => v.id === variantId)?.optionValues,
        [optionName]: value,
      },
    });
  };

  // Validate variant uniqueness
  const getDuplicateVariants = () => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const variant of variants) {
      const key = JSON.stringify(variant.optionValues);
      if (seen.has(key)) {
        duplicates.add(variant.id);
      } else {
        seen.add(key);
      }
    }

    return duplicates;
  };

  const duplicateIds = getDuplicateVariants();

  // Check if auto-generate is possible
  const canAutoGenerate = options.some((opt) => opt.values.length > 0);

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          متغيرات المنتج ({variants.length})
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={autoGenerateVariants}
            disabled={!canAutoGenerate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-md text-white text-sm font-medium transition"
          >
            <RefreshCw size={16} />
            توليد تلقائي
          </button>
          <button
            type="button"
            onClick={addManualVariant}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm font-medium transition"
          >
            <Plus size={16} />
            إضافة متغير
          </button>
        </div>
      </div>

      {/* Info text */}
      {variants.length === 0 && (
        <div className="bg-gray-800 rounded-lg p-4 text-gray-400 text-sm">
          <p>لا توجد متغيرات بعد. يمكنك:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>توليد المتغيرات تلقائياً من الخيارات المكونة</li>
            <li>إضافة متغير يدوياً وتخصيصه</li>
          </ul>
        </div>
      )}

      {/* Duplicate warning */}
      {duplicateIds.size > 0 && (
        <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-3 text-yellow-200 text-sm">
          تحذير: تم اكتشاف {duplicateIds.size} مجموعة متغيرات مكررة. يجب أن يكون لكل متغير مجموعة فريدة من الخيارات.
        </div>
      )}

      {/* Variants list */}
      <div className="space-y-2">
        {variants.map((variant) => {
          const isExpanded = expandedVariants.has(variant.id);
          const isDuplicate = duplicateIds.has(variant.id);

          return (
            <div
              key={variant.id}
              className={`bg-gray-800 rounded-lg border ${
                isDuplicate ? 'border-yellow-600' : 'border-gray-700'
              } overflow-hidden`}
            >
              {/* Variant header - always visible */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-750"
                onClick={() => toggleExpand(variant.id)}
              >
                <button type="button" className="text-gray-400">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {/* Option values summary */}
                <div className="flex-1 flex flex-wrap gap-2">
                  {Object.entries(variant.optionValues).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-1 bg-gray-700 rounded text-sm text-gray-300"
                    >
                      <span className="text-gray-500">{key}:</span> {value}
                    </span>
                  ))}
                  {Object.keys(variant.optionValues).length === 0 && (
                    <span className="text-gray-500 text-sm italic">
                      لم يتم اختيار خيارات
                    </span>
                  )}
                </div>

                {/* Quick info */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">
                    {variant.price ? formatEGP(variant.salePrice || variant.price) : 'غير محدد'}
                  </span>
                  <span className={`${variant.stock && variant.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    المخزون: {variant.stock || 'غير محدد'}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    removeVariant(variant.id);
                  }}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-700 p-4 space-y-4">
                    {/* SKU and Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="relative">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <Input
                              label="رمز المنتج (SKU) *"
                              value={variant.sku}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateVariant(variant.id, { sku: e.target.value })
                              }
                              small
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const optionValues = Object.values(variant.optionValues);
                              const optionCodes = optionValues.length > 0
                                ? optionValues.join('-')
                                : 'var';
                              updateVariant(variant.id, { sku: generateShopSKU(optionCodes) });
                            }}
                            className="mt-1.5 p-1 text-gray-400 hover:text-blue-400 transition"
                            title="توليد رمز جديد"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>
                      <Input
                        label="السعر *"
                        type="number"
                        step="0.01"
                        value={variant.price || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateVariant(variant.id, { price: e.target.value ? parseFloat(e.target.value) : undefined })
                        }
                        small
                      />
                      <Input
                        label="سعر التخفيض"
                        type="number"
                        step="0.01"
                        value={variant.salePrice || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const salePrice = e.target.value ? parseFloat(e.target.value) : undefined;
                          updateVariant(variant.id, { salePrice });
                        }}
                        small
                      />
                      {variant.salePrice && variant.price !== undefined && variant.salePrice >= variant.price && (
                        <p className="text-red-400 text-xs col-span-4">
                          سعر التخفيض يجب أن يكون أقل من السعر الأساسي
                        </p>
                      )}
                      <div className="flex flex-wrap items-start gap-2">
                        <div className="flex-1 min-w-[100px]">
                          <Input
                            label="الكمية *"
                            type="number"
                            value={variant.stock || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateVariant(variant.id, { stock: e.target.value ? parseInt(e.target.value) : undefined })
                            }
                            small
                          />
                        </div>
                        <div className="flex gap-2 mt-1.5">
                          {/* Barcode Generation Button */}
                          {onBarcodeClick && (
                            <button
                              type="button"
                              onClick={() => {
                                const label = Object.entries(variant.optionValues)
                                  .map(([key, value]) => `${key}: ${value}`)
                                  .join(' | ');
                                onBarcodeClick(variant.sku, label || 'بدون خيارات');
                              }}
                              disabled={!variant.sku || variant.sku.length === 0}
                              className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-md transition whitespace-nowrap"
                              title="توليد الباركود"
                            >
                              توليد الباركود
                            </button>
                          )}
                          {/* QR Code Generation Button */}
                          {onQrCodeClick && (
                            <button
                              type="button"
                              onClick={() => {
                                const label = Object.entries(variant.optionValues)
                                  .map(([key, value]) => `${key}: ${value}`)
                                  .join(' | ');
                                onQrCodeClick(variant.sku, label || 'بدون خيارات');
                              }}
                              disabled={!variant.sku || variant.sku.length === 0}
                              className="px-2 py-1 text-xs bg-teal-600 hover:bg-teal-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-md transition whitespace-nowrap"
                              title="توليد QR Code"
                            >
                              توليد QR Code
                            </button>
                          )}
                        </div>
                      </div>
                      {variant.stock !== undefined && variant.stock < 0 && (
                        <p className="text-red-400 text-xs col-span-4">
                          الكمية يجب أن تكون غير سالبة
                        </p>
                      )}
                    </div>

                  {/* Event Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        تاريخ البداية (اختياري)
                      </label>
                      <input
                        type="datetime-local"
                        value={variant.starting_date || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateVariant(variant.id, { starting_date: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        للفعاليات أو العروض محدودة الوقت
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        تاريخ النهاية (اختياري)
                      </label>
                      <input
                        type="datetime-local"
                        value={variant.ending_date || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateVariant(variant.id, { ending_date: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        للفعاليات أو العروض محدودة الوقت
                      </p>
                    </div>
                  </div>

                  {/* Option Values */}
                  {options.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        خيارات المتغير
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {options.map((option) => (
                          <div key={option.id}>
                            <label className="block text-xs text-gray-500 mb-1">
                              {option.name}
                            </label>
                            <select
                              value={variant.optionValues[option.name] || ''}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                updateVariantOption(variant.id, option.name, e.target.value)
                              }
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                            >
                              <option value="">اختر {option.name}...</option>
                              {option.values.map((val) => (
                                <option key={val.id} value={val.value}>
                                  {val.value}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active status */}
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={variant.isActive}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateVariant(variant.id, { isActive: e.target.checked })
                      }
                      className="rounded border-gray-600"
                    />
                    نشط (متاح للشراء)
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VariantManager;
