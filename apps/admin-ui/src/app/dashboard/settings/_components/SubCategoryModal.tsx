import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface SubCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryName: string, subCategoryName: string) => void;
  categories: string[];
  initialCategory?: string;
  initialSubCategory?: string;
}

export const SubCategoryModal: React.FC<SubCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialCategory = '',
  initialSubCategory = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [subCategoryName, setSubCategoryName] = useState(initialSubCategory);

  const handleSave = () => {
    if (selectedCategory && subCategoryName.trim()) {
      onSave(selectedCategory, subCategoryName.trim());
      setSelectedCategory('');
      setSubCategoryName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add Subcategory</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory Name
            </label>
            <input
              type="text"
              value={subCategoryName}
              onChange={(e) => setSubCategoryName(e.target.value)}
              placeholder="Enter subcategory name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
