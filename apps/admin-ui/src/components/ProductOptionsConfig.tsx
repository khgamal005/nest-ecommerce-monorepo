'use client';

import { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import Input from 'packages/components/input';

export type OptionType = 'single' | 'multiple' | 'text' | 'number';

export interface ProductOptionValue {
  id: string;
  value: string;
}

export interface ProductOption {
  id: string;
  name: string;
  required: boolean;
  type: OptionType;
  values: ProductOptionValue[];
}

interface ProductOptionsConfigProps {
  options: ProductOption[];
  onChange: (options: ProductOption[]) => void;
  categoryType?: 'clothing' | 'electronics' | 'simple' | 'custom';
}

interface OptionTemplate {
  name: string;
  required: boolean;
  type: OptionType;
  values: string[];
}

const predefinedOptionTemplates: Record<string, OptionTemplate[]> = {
  clothing: [
    { name: 'اللون', required: true, type: 'single', values: ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'brown', 'gray', 'navy'] },
    { name: 'المقاس', required: true, type: 'single', values: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'] },
  ],
  electronics: [
    { name: 'السعة', required: true, type: 'single', values: ['64gb', '128gb', '256gb', '512gb', '1tb'] },
    { name: 'الرام', required: true, type: 'single', values: ['4gb', '6gb', '8gb', '12gb', '16gb'] },
    { name: 'اللون', required: false, type: 'single', values: ['black', 'white', 'silver', 'gold', 'blue'] },
    { name: 'الجهد', required: false, type: 'text', values: [] },
  ],
  simple: [],
};

const defaultSizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
const defaultColors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'purple', 'pink', 'orange', 'brown', 'gray', 'navy'];
const defaultStorage = ['64gb', '128gb', '256gb', '512gb', '1tb'];
const defaultRAM = ['4gb', '6gb', '8gb', '12gb', '16gb'];

export function ProductOptionsConfig({
  options,
  onChange,
  categoryType = 'custom',
}: ProductOptionsConfigProps) {
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionType, setNewOptionType] = useState<OptionType>('single');

  // Generate unique ID with timestamp to avoid collisions
  const generateId = () => `opt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const applyTemplate = (type: 'clothing' | 'electronics' | 'simple' | 'custom') => {
    if (type === 'custom') return;
    
    const template = predefinedOptionTemplates[type].map((opt) => ({
      id: generateId(),
      name: opt.name,
      required: opt.required,
      type: opt.type,
      values: opt.values.map((v) => ({ id: generateId(), value: v })),
    }));
    
    onChange(template);
  };

  const addOption = () => {
    if (!newOptionName.trim()) return;
    
    const newOption: ProductOption = {
      id: generateId(),
      name: newOptionName.trim(),
      required: true,
      type: newOptionType,
      values: [],
    };
    
    onChange([...options, newOption]);
    setNewOptionName('');
  };

  const removeOption = (id: string) => {
    onChange(options.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, updates: Partial<ProductOption>) => {
    onChange(
      options.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  const addOptionValue = (optionId: string, value: string) => {
    if (!value.trim()) return;
    
    onChange(
      options.map((o) => {
        if (o.id !== optionId) return o;
        return {
          ...o,
          values: [...o.values, { id: generateId(), value: value.trim().toLowerCase() }],
        };
      })
    );
  };

  const removeOptionValue = (optionId: string, valueId: string) => {
    onChange(
      options.map((o) => {
        if (o.id !== optionId) return o;
        return {
          ...o,
          values: o.values.filter((v) => v.id !== valueId),
        };
      })
    );
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === options.length - 1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newOptions = [...options];
    [newOptions[index], newOptions[newIndex]] = [newOptions[newIndex], newOptions[index]];
    onChange(newOptions);
  };

  const getInputTypeLabel = (type: OptionType) => {
    switch (type) {
      case 'single': return 'خيار واحد (Radio)';
      case 'multiple': return 'خيارات متعددة (Checkbox)';
      case 'text': return 'إدخال نصي';
      case 'number': return 'إدخال رقمي';
    }
  };

  return (
    <div className="space-y-4">
      {/* Template Selector */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-400 mr-2">إعداد سريع:</span>
        {(['clothing', 'electronics', 'simple', 'custom'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => applyTemplate(type)}
            className={`px-3 py-1 rounded-md text-sm capitalize transition ${
              categoryType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {type === 'clothing' ? 'ملابس' : type === 'electronics' ? 'إلكترونيات' : type === 'simple' ? 'بسيط' : 'مخصص'}
          </button>
        ))}
      </div>

      {/* Existing Options */}
      {options.length === 0 ? (
        <div className="text-gray-500 text-sm italic">
          لا توجد خيارات مهيأة. اختر قالباً مما سبق أو أضف خيارات مخصصة.
        </div>
      ) : (
        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={option.id}
              className="bg-gray-800 rounded-lg p-2 border border-gray-700"
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveOption(index, 'up')}
                    disabled={index === 0}
                    className="text-gray-500 hover:text-gray-300 disabled:opacity-30"
                  >
                    <GripVertical size={16} />
                  </button>
                </div>

                <div className="flex-1 space-y-3">
                  {/* Option Header */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Input
                      label="اسم الخيار"
                      value={option.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOption(option.id, { name: e.target.value })}
                      className="flex-1 min-w-[120px]"
                      small
                    />
                    
                    <select
                      value={option.type}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        updateOption(option.id, { type: e.target.value as OptionType })
                      }
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                    >
                      <option value="single">خيار واحد</option>
                      <option value="multiple">خيارات متعددة</option>
                      <option value="text">إدخال نص</option>
                      <option value="number">إدخال رقم</option>
                    </select>

                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={option.required}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateOption(option.id, { required: e.target.checked })
                        }
                        className="rounded border-gray-600"
                      />
                      مطلوب
                    </label>

                    <button
                      type="button"
                      onClick={() => removeOption(option.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="text-xs text-gray-500">
                    {getInputTypeLabel(option.type)}
                  </div>

                  {/* Option Values (for single/multiple choice) */}
                  {(option.type === 'single' || option.type === 'multiple') && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {option.values.map((value) => (
                          <span
                            key={value.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 rounded-md text-sm text-gray-300"
                          >
                            {value.value}
                            <button
                              type="button"
                              onClick={() => removeOptionValue(option.id, value.id)}
                              className="text-gray-500 hover:text-red-400"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          placeholder={`أضف قيمة لـ ${option.name}...`}
                          className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addOptionValue(option.id, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                            addOptionValue(option.id, input.value);
                            input.value = '';
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-white"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Option */}
      <div className="flex flex-col sm:flex-row gap-2 items-end">
        <div className="flex-1">
          <Input
            label="اسم خيار جديد"
            placeholder="مثلاً: الخامة..."
            value={newOptionName}
            small
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewOptionName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addOption();
              }
            }}
          />
        </div>
        <select
          value={newOptionType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewOptionType(e.target.value as OptionType)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
        >
          <option value="single">خيار واحد</option>
          <option value="multiple">خيارات متعددة</option>
          <option value="text">نص</option>
          <option value="number">رقم</option>
        </select>
        <button
          type="button"
          onClick={addOption}
          disabled={!newOptionName.trim()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-md text-white font-medium"
        >
          <Plus size={18} className="inline mr-1" />
          إضافة
        </button>
      </div>
    </div>
  );
}

export default ProductOptionsConfig;
