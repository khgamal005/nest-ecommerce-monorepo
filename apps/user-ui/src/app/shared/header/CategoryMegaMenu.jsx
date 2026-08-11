import React, { useState, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const CategoryMegaMenu = ({ categories }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeLevel2, setActiveLevel2] = useState(null);
  const timeoutRef = useRef(null);

  const handleCategoryEnter = (category) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveCategory(category);
    setActiveLevel2(null);
  };

  const handleCategoryLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
      setActiveLevel2(null);
    }, 150);
  };

  const handleLevel2Enter = (level2) => {
    setActiveLevel2(level2);
  };

  const handlePanelEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handlePanelLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
      setActiveLevel2(null);
    }, 150);
  };

  return (
    <div className="relative" onMouseLeave={handleCategoryLeave}>
      {/* Level 1 Categories */}
      <div className="py-2">
        {categories && categories.length > 0 ? (
          categories.map((category) => (
            <div
              key={category.id}
              className="relative"
              onMouseEnter={() => handleCategoryEnter(category)}
            >
              <Link
                href={`/category/${category.slug}`}
                className={`px-4 py-3 transition-colors duration-150 border-b border-gray-100 last:border-b-0 w-full text-right font-medium text-sm flex items-center justify-between ${
                  activeCategory?.id === category.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span>{category.name}</span>
                {category.children && category.children.length > 0 && (
                  <ChevronLeft size={16} className="text-gray-400" />
                )}
              </Link>

              {/* Next level cascade - opens to the LEFT of the current level */}
              {activeCategory?.id === category.id &&
                category.children &&
                category.children.length > 0 && (
                  <div
                    className="absolute right-full top-0 bg-white shadow-2xl rounded-l-lg border border-gray-200 mr-1 z-50"
                    style={{ minWidth: '680px' }}
                    onMouseEnter={handlePanelEnter}
                    onMouseLeave={handlePanelLeave}
                  >
                    <div className="flex">
                      {/* Level 2 Categories - Right Column (next to level 1) */}
                      <div className="w-56 border-l border-gray-100 bg-gray-50 p-2">
                        <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {activeCategory.name}
                        </h3>
                        {activeCategory.children.map((level2) => (
                          <div
                            key={level2.id}
                            onMouseEnter={() => handleLevel2Enter(level2)}
                          >
                            <Link
                              href={`/category/${level2.slug}`}
                              className={`block px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                                activeLevel2?.id === level2.id
                                  ? 'bg-blue-100 text-blue-600 font-medium'
                                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                              }`}
                            >
                              <span>{level2.name}</span>
                              {level2.children &&
                                level2.children.length > 0 && (
                                  <ChevronLeft
                                    size={14}
                                    className="text-gray-400"
                                  />
                                )}
                            </Link>
                          </div>
                        ))}
                      </div>

                      {/* Level 3 Categories - Left Column */}
                      <div className="flex-1 p-4 min-h-[280px] max-h-[400px] overflow-y-auto">
                        {activeLevel2 &&
                        activeLevel2.children &&
                        activeLevel2.children.length > 0 ? (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                              {activeLevel2.name}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {activeLevel2.children.map((level3) => (
                                <Link
                                  key={level3.id}
                                  href={`/category/${level3.slug}`}
                                  className="px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  {level3.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : activeLevel2 ? (
                          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            <span>هذه الفئة لم تُضاف بعد</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            <span>مرر الفأرة فوق فئة فرعية</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* View All Link */}
                    <div className="border-t border-gray-100 p-3 bg-gray-50">
                      <Link
                        href={`/category/${activeCategory.slug}`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        عرض الكل في {activeCategory.name}
                        <ChevronLeft size={14} />
                      </Link>
                    </div>
                  </div>
                )}
            </div>
          ))
        ) : (
          <div className="px-4 py-3 text-gray-500 text-sm">
            لا توجد فئات متاحة
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryMegaMenu;
