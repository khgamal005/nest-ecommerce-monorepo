'use client';

import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

export interface SpecItem {
  key: string;
  value: string;
}

export interface SpecGroup {
  label: string;
  specs: SpecItem[];
}

export interface CustomSpecs {
  groups: SpecGroup[];
}

interface CustomSpecsEditorProps {
  value: CustomSpecs;
  onChange: (value: CustomSpecs) => void;
}

export default function CustomSpecsEditor({ value, onChange }: CustomSpecsEditorProps) {
  const groups = value?.groups || [];

  const updateGroups = (updated: SpecGroup[]) => onChange({ groups: updated });

  const addGroup = () => {
    updateGroups([...groups, { label: '', specs: [{ key: '', value: '' }] }]);
  };

  const removeGroup = (gi: number) => {
    updateGroups(groups.filter((_, i) => i !== gi));
  };

  const updateGroupLabel = (gi: number, label: string) => {
    const updated = [...groups];
    updated[gi] = { ...updated[gi], label };
    updateGroups(updated);
  };

  const addSpec = (gi: number) => {
    const updated = [...groups];
    updated[gi] = { ...updated[gi], specs: [...updated[gi].specs, { key: '', value: '' }] };
    updateGroups(updated);
  };

  const removeSpec = (gi: number, si: number) => {
    const updated = [...groups];
    updated[gi] = { ...updated[gi], specs: updated[gi].specs.filter((_, i) => i !== si) };
    updateGroups(updated);
  };

  const updateSpec = (gi: number, si: number, field: 'key' | 'value', val: string) => {
    const updated = [...groups];
    const specs = [...updated[gi].specs];
    specs[si] = { ...specs[si], [field]: val };
    updated[gi] = { ...updated[gi], specs };
    updateGroups(updated);
  };

  return (
    <div className="space-y-4">
      {groups.length === 0 && (
        <p className="text-gray-500 text-sm italic">لا توجد مواصفات. اضغط "إضافة مجموعة" للبدء.</p>
      )}

      {groups.map((group, gi) => (
        <div key={gi} className="bg-gray-750 border border-gray-600 rounded-lg overflow-hidden">
          {/* Group header */}
          <div className="flex items-center gap-2 p-3 bg-gray-700">
            <input
              type="text"
              value={group.label}
              onChange={(e) => updateGroupLabel(gi, e.target.value)}
              placeholder="اسم المجموعة (مثال: الشاشة، القماش...)"
              className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              dir="rtl"
            />
            <button
              type="button"
              onClick={() => removeGroup(gi)}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Specs rows */}
          <div className="p-3 space-y-2">
            {group.specs.map((spec, si) => (
              <div key={si} className="flex items-center gap-2">
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) => updateSpec(gi, si, 'key', e.target.value)}
                  placeholder="الخاصية (مثال: المقاس)"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  dir="rtl"
                />
                <span className="text-gray-500 text-sm">:</span>
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => updateSpec(gi, si, 'value', e.target.value)}
                  placeholder="القيمة (مثال: 55 بوصة)"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(gi, si)}
                  disabled={group.specs.length === 1}
                  className="p-1.5 text-gray-500 hover:text-red-400 disabled:opacity-30 rounded transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addSpec(gi)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1 transition"
            >
              <Plus size={12} />
              إضافة خاصية
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addGroup}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-sm text-white transition"
      >
        <Plus size={16} />
        إضافة مجموعة مواصفات
      </button>
    </div>
  );
}
