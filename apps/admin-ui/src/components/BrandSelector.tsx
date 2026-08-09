// components/BrandSelector.tsx
import { useRef, useEffect } from 'react';
import { X, ChevronDown, BadgeCheck } from 'lucide-react';
import { useBrandSearch } from '../hooks/useBrandSearch';
import Image from 'next/image';

interface BrandSelectorProps {
  defaultBrandId?: string;
  defaultBrandName?: string;
  onChange?: (payload: { brandId?: string; brandName?: string }) => void;
}

export default function BrandSelector({
  defaultBrandId,
  defaultBrandName,
  onChange,
}: BrandSelectorProps) {
  const {
    search, setSearch,
    selected, freeText, setFreeText,
    mode, open, setOpen,
    filtered,
    selectBrand, switchToFree, clear,
    brandPayload,
  } = useBrandSearch();

  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent on change
  useEffect(() => {
    onChange?.(brandPayload);
  }, [brandPayload.brandId, brandPayload.brandName]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm text-gray-400 mb-1.5">
        العلامة التجارية
      </label>

      {/* Selected verified brand pill */}
      {selected && (
        <div className="flex items-center gap-2 px-3 py-2 border border-[#2a2a2a] rounded-lg bg-[#1a1a1a] mb-2">
          {selected.logo ? (
            <Image src={selected.logo} alt={selected.name} width={20} height={20} className="object-contain rounded" />
          ) : (
            <div className="w-5 h-5 rounded bg-[#2a2a2a] flex items-center justify-center text-xs text-gray-400">
              {selected.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm text-white flex-1">{selected.name}</span>
          <BadgeCheck size={14} className="text-emerald-400 flex-shrink-0" />
          <button onClick={clear} className="text-gray-500 hover:text-white transition-colors ml-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Free text input */}
      {mode === 'free' && !selected && (
        <div className="flex items-center gap-2 mb-2">
          <input
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            placeholder="اكتب اسم العلامة التجارية..."
            className="flex-1 h-9 px-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-[#3a3a3a]"
          />
          <button onClick={clear} className="text-gray-500 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search trigger — hide when something is selected */}
      {!selected && mode === 'search' && (
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full h-9 px-3 flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-gray-500 hover:border-[#3a3a3a] transition-colors"
        >
          <span>ابحث عن علامة تجارية...</span>
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-2xl">
          {/* Search input inside dropdown */}
          <div className="p-2 border-b border-[#2a2a2a]">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث..."
              className="w-full h-8 px-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-gray-600 outline-none"
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {/* Verified brands */}
            {filtered.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-xs text-gray-600 bg-[#0d0d0d]">
                  علامات موثقة
                </p>
                {filtered.map(brand => (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => selectBrand(brand)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#1a1a1a] transition-colors text-left"
                  >
                    {brand.logo ? (
                      <Image src={brand.logo} alt={brand.name} width={20} height={20} className="object-contain rounded flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded bg-[#2a2a2a] flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-white flex-1">{brand.name}</span>
                    <BadgeCheck size={13} className="text-emerald-400 flex-shrink-0" />
                  </button>
                ))}
              </>
            )}

            {/* Free text option — always shown at bottom */}
            <div className="border-t border-[#2a2a2a]">
              <button
                type="button"
                onClick={switchToFree}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1a] transition-colors text-left"
              >
                <div className="w-5 h-5 rounded bg-[#2a2a2a] flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                  +
                </div>
                <div>
                  <p className="text-sm text-gray-300">
                    {search ? `إضافة "${search}"` : 'اكتب اسماً يدوياً'}
                  </p>
                  <p className="text-xs text-gray-600">ستتم مراجعتها من الإدارة</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
