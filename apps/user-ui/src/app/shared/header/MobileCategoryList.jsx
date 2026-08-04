import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

const MobileCategoryList = ({ categories, onCategoryClick }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!categories || categories.length === 0) {
    return <div className="text-gray-500 text-sm py-2">لا توجد أقسام</div>;
  }

  return (
    <div className="space-y-1">
      {categories.map((category) => (
        <div key={category.id}>
          <div
            className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-md cursor-pointer"
            onClick={() => toggleExpand(category.id)}
          >
            <Link
              href={`/category/${category.slug}`}
              className="font-medium text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                if (onCategoryClick) onCategoryClick();
              }}
            >
              {category.name}
            </Link>
            {category.children && category.children.length > 0 && (
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expanded[category.id] ? 'rotate-180' : ''
                }`}
              />
            )}
          </div>

          {/* Level 2 */}
          {expanded[category.id] && category.children && (
            <div className="mr-4 ml-0 mt-1 space-y-1">
              {category.children.map((level2) => (
                <div key={level2.id}>
                  <div
                    className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-md cursor-pointer"
                    onClick={() => toggleExpand(level2.id)}
                  >
                    <Link
                      href={`/category/${level2.slug}`}
                      className="text-sm font-medium text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCategoryClick) onCategoryClick();
                      }}
                    >
                      {level2.name}
                    </Link>
                    {level2.children && level2.children.length > 0 && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expanded[level2.id] ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </div>

                  {/* Level 3 */}
                  {expanded[level2.id] && level2.children && (
                    <div className="mr-4 ml-0 mt-1 space-y-1">
                      {level2.children.map((level3) => (
                        <Link
                          key={level3.id}
                          href={`/category/${level3.slug}`}
                          className="block px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-md"
                          onClick={() => {
                            if (onCategoryClick) onCategoryClick();
                          }}
                        >
                          {level3.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MobileCategoryList;
