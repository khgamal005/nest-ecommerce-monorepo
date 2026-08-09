'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface CategoryHierarchyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { level1: { name: string; slug: string }; level2: { name: string; slug: string; level3: { name: string; slug: string }[] }[] }) => void;
}

export const CategoryHierarchyModal: React.FC<CategoryHierarchyModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [level1, setLevel1] = useState({ name: '', slug: '' });
  const [level2List, setLevel2List] = useState<{ name: string; slug: string; level3: { name: string; slug: string }[] }[]>([]);

  if (!isOpen) return null;

  const handleLevel1NameChange = (name: string) => {
    setLevel1(prev => ({ ...prev, name }));
  };

  const handleLevel1SlugChange = (slug: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const sanitizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    setLevel1(prev => ({ ...prev, slug: sanitizedSlug }));
  };

  const addLevel2 = () => {
    setLevel2List([...level2List, { name: '', slug: '', level3: [] }]);
  };

  const removeLevel2 = (index: number) => {
    setLevel2List(level2List.filter((_, i) => i !== index));
  };

  const updateLevel2Name = (index: number, name: string) => {
    const updated = [...level2List];
    updated[index] = { ...updated[index], name };
    setLevel2List(updated);
  };

  const updateLevel2Slug = (index: number, slug: string) => {
    const sanitizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    const updated = [...level2List];
    updated[index] = { ...updated[index], slug: sanitizedSlug };
    setLevel2List(updated);
  };

  const addLevel3 = (level2Index: number) => {
    const updated = [...level2List];
    updated[level2Index].level3.push({ name: '', slug: '' });
    setLevel2List(updated);
  };

  const removeLevel3 = (level2Index: number, level3Index: number) => {
    const updated = [...level2List];
    updated[level2Index].level3 = updated[level2Index].level3.filter((_, i) => i !== level3Index);
    setLevel2List(updated);
  };

  const updateLevel3Name = (level2Index: number, level3Index: number, name: string) => {
    const updated = [...level2List];
    updated[level2Index].level3[level3Index] = { ...updated[level2Index].level3[level3Index], name };
    setLevel2List(updated);
  };

  const updateLevel3Slug = (level2Index: number, level3Index: number, slug: string) => {
    const sanitizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    const updated = [...level2List];
    updated[level2Index].level3[level3Index] = { ...updated[level2Index].level3[level3Index], slug: sanitizedSlug };
    setLevel2List(updated);
  };

  const handleSave = () => {
    if (!level1.name) {
      alert('Level 1 category name is required');
      return;
    }
    if (!level1.slug) {
      alert('Level 1 category slug is required (English only)');
      return;
    }

    // Filter out empty entries
    const validLevel2 = level2List
      .filter(l2 => l2.name && l2.slug)
      .map(l2 => ({
        ...l2,
        level3: l2.level3.filter(l3 => l3.name && l3.slug),
      }));

    onSave({
      level1,
      level2: validLevel2,
    });

    // Reset form
    setLevel1({ name: '', slug: '' });
    setLevel2List([]);
  };

  const handleClose = () => {
    setLevel1({ name: '', slug: '' });
    setLevel2List([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create Category Hierarchy</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Level 1 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Level 1 (Main Category) *</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-gray-400">(Arabic or any language)</span>
                </label>
                <input
                  type="text"
                  value={level1.name}
                  onChange={(e) => handleLevel1NameChange(e.target.value)}
                  placeholder="مثال: إلكترونيات"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="auto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug <span className="text-red-500">*</span> <span className="text-gray-400">(English only, no spaces)</span>
                </label>
                <input
                  type="text"
                  value={level1.slug}
                  onChange={(e) => handleLevel1SlugChange(e.target.value)}
                  placeholder="e.g., electronics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Level 2 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Level 2 (Subcategories)</h3>
              <button
                onClick={addLevel2}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Subcategory
              </button>
            </div>

            {level2List.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No subcategories added yet</p>
            )}

            {level2List.map((level2, level2Index) => (
              <div key={level2Index} className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={level2.name}
                        onChange={(e) => updateLevel2Name(level2Index, e.target.value)}
                        placeholder="Subcategory name (Arabic)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="auto"
                      />
                      <input
                        type="text"
                        value={level2.slug}
                        onChange={(e) => updateLevel2Slug(level2Index, e.target.value)}
                        placeholder="Slug (English)"
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                    </div>

                    {/* Level 3 */}
                    <div className="pl-4 border-l-2 border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Level 3 (Child Categories)</span>
                        <button
                          onClick={() => addLevel3(level2Index)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          Add Child
                        </button>
                      </div>

                      {level2.level3.length === 0 && (
                        <p className="text-gray-400 text-xs text-center py-2">No child categories</p>
                      )}

                      {level2.level3.map((level3, level3Index) => (
                        <div key={level3Index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={level3.name}
                            onChange={(e) => updateLevel3Name(level2Index, level3Index, e.target.value)}
                            placeholder="Child name (Arabic)"
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            dir="auto"
                          />
                          <input
                            type="text"
                            value={level3.slug}
                            onChange={(e) => updateLevel3Slug(level2Index, level3Index, e.target.value)}
                            placeholder="Slug (English)"
                            className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          />
                          <button
                            onClick={() => removeLevel3(level2Index, level3Index)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeLevel2(level2Index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!level1.name}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Hierarchy
          </button>
        </div>
      </div>
    </div>
  );
};
