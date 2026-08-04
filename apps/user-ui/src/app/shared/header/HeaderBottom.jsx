import { Routes } from '@/constants/enums';
import { AlignLeft, ChevronDown, Menu, X } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useLayout } from '@/hooks/useLayout';
import CategoryMegaMenu from './CategoryMegaMenu';
import MobileCategoryList from './MobileCategoryList';

const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { categories } = useLayout();
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (window.innerWidth < 1024) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShow(false);
    }, 150);
  };

  const links = [
    { title: 'الرئيسية', href: Routes.Home },
    { title: 'المنتجات', href: Routes.Products },
    { title: 'العلامات التجارية', href: Routes.Brands },
    { title: 'العروض', href: Routes.Offers },
    { title: 'الطلبات', href: Routes.Orders },
    // { title: 'المحلات', href: Routes.Shops }, 
    // { title: 'كن بائعاً', href: RoutesExternal.BecomeSeller },
  ];

  return (
    <div
      className={`sticky top-20 left-0 w-full bg-white shadow-lg z-40 border-b border-gray-100 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'lg:-translate-y-full'
      }`}
    >
      <div className="w-[90%] max-w-7xl m-auto flex items-center justify-between h-14">
        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* All Departments Dropdown - Desktop */}
        <div
          className="hidden lg:relative lg:block"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-64 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 cursor-pointer flex items-center justify-between group">
            <div className="px-4 py-3 flex items-center gap-3">
              <AlignLeft size={20} color="white" />
              <span className="font-semibold text-white text-sm uppercase tracking-wide">
                جميع الأقسام
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                show ? 'rotate-180' : ''
              }`}
              color="white"
            />
          </div>

          {/* Dropdown Menu */}
          {show && (
            <div className="absolute right-0 w-72 bg-white shadow-2xl rounded-b-xl border border-gray-200 mt-1 z-50">
              <CategoryMegaMenu categories={categories} />
            </div>
          )}
        </div>

        {/* Spacer for mobile */}
        <div className="lg:hidden flex-1"></div>

        {/* Navigation Links - Desktop */}
        <nav className="hidden lg:flex flex-1 justify-center">
          <ul className="flex items-center gap-1">
            {links.map((link, index) => (
              <li key={index}>
                <Link
                  href={link.href}
                  className="px-5 py-2 text-gray-700 hover:text-blue-600 font-medium text-sm rounded-md transition-colors duration-200 hover:bg-gray-50 whitespace-nowrap"
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Empty space for balance - Desktop */}
        <div className="hidden lg:block w-64"></div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-xl max-h-[calc(100vh-140px)] overflow-y-auto">
          <div className="w-[90%] mx-auto py-4">
            {/* Categories for Mobile */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                الأقسام
              </h3>
              <MobileCategoryList categories={categories} />
            </div>

            {/* Links for Mobile */}
            <div className="space-y-1">
              {links.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderBottom;
