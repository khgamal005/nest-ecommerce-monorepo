'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  HeartIcon,
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react';

import HeaderBottom from './HeaderBottom';
import MobileCategoryList from './MobileCategoryList';

import { useUser } from '@/hooks/use-user';
import { useSiteConfig, siteLogoUrl } from '@/hooks/useSiteConfig';
import { Routes } from '@/constants/enums';
import { useStore } from '@/store';
import { useLayout } from '@/hooks/useLayout';

const links = [
  { title: 'الرئيسية', href: Routes.Home },
  { title: 'المنتجات', href: Routes.Products },
  { title: 'العلامات التجارية', href: Routes.Brands },
  { title: 'العروض', href: Routes.Offers },
  { title: 'الطلبات', href: Routes.Orders },
  // Multi-vendor links removed: this is single-vendor.
  // { title: 'المحلات', href: Routes.Shops },
  // { title: 'كن بائعاً', href: RoutesExternal.BecomeSeller },
];

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, sessionPending, logout, isLoggingOut } = useUser();
  const { categories } = useLayout();
  const { logo } = useSiteConfig();
  const logoUrl = siteLogoUrl(logo);

  const cart = useStore((state) => state.cart);
  const wishlist = useStore((state) => state.wishlist);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { id: string; title: string; slug: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if current page is homepage
  const isHomePage = pathname === '/';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search handler
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      if (!value.trim()) {
        setSearchResults([]);
        setShowResults(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `${API_URL}/product/api/search-products?q=${encodeURIComponent(
              value.trim(),
            )}`,
          );
          const data = await res.json();
          if (data.success) {
            setSearchResults(data.products || []);
            setShowResults(true);
          }
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    },
    [API_URL],
  );

  const handleResultClick = (slug: string) => {
    setShowResults(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(`/product/${slug}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // NetworkError during logout is expected if session expired
    }
    setIsMobileMenuOpen(false);
    router.push('/auth/login');
  };

  if (!mounted) {
    return (
      <>
        <div className="w-full h-20 bg-white border-b sticky top-0 z-50 shadow-sm">
          <div className="w-[90%] py-5 h-full mx-auto flex items-center justify-between">
            <div className="flex-1 lg:flex-1">
              <Link href="/">
                <div className="w-20 h-12 bg-gray-200 rounded animate-pulse"></div>
              </Link>
            </div>
            <div className="hidden lg:flex flex-1 justify-end">
              <div className="flex items-center gap-6">
                <div className="w-28 h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        {isHomePage && <HeaderBottom />}
      </>
    );
  }

  return (
    <>
      <div className="w-full h-20 bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="w-[90%] py-5 h-full mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex-1 lg:flex-1">
            <Link href="/" className="inline-flex items-center h-20">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="site logo"
                  className="h-14 max-w-[180px] object-contain"
                />
              ) : (
                <span className="text-2xl font-bold text-[#3489FF]">
                  متجرنا
                </span>
              )}
            </Link>
          </div>

          {/* Search Box */}
          <div className="hidden lg:flex flex-1 justify-center">
            <div className="w-full max-w-2xl relative" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true);
                }}
                className="w-full px-4 py-3 pr-16 font-medium border-[2.5px] border-[#3489FF] rounded-md outline-none h-[55px] text-gray-800 placeholder-gray-400 text-right"
                placeholder="ابحث..."
              />
              <div className="w-[60px] h-[55px] bg-[#3489FF] cursor-pointer flex items-center justify-center rounded-md absolute top-0 right-0">
                {isSearching ? (
                  <Loader2
                    size={20}
                    strokeWidth={2.5}
                    className="text-white animate-spin"
                  />
                ) : (
                  <Search size={20} strokeWidth={2.5} className="text-white" />
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-[58px] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-60 max-h-80 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleResultClick(product.slug)}
                        className="w-full text-right px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                      >
                        <Search size={16} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 truncate">
                          {product.title}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      لا توجد نتائج لـ &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Login & User */}
          <div className="hidden lg:flex flex-1 justify-end">
            <div className="flex items-center gap-6">
              {sessionPending ? (
                <div className="w-24 h-4 bg-gray-200 animate-pulse rounded" />
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-1 cursor-pointer p-1 hover:bg-gray-100 rounded"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{user.name}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white shadow-lg rounded-md border border-gray-200 z-50 py-1">
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        أهلاً، {user.name}
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 hover:bg-gray-100 text-sm text-gray-800"
                      >
                        الملف الشخصي
                      </Link>
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 text-sm"
                      >
                        {isLoggingOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  تسجيل الدخول
                </Link>
              )}

              {/* Wishlist & Cart */}
              <div className="flex items-center gap-5">
                <Link
                  href="/whishlist"
                  className="relative hover:text-red-500 transition-colors"
                >
                  <HeartIcon size={24} />
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {wishlist?.length || 0}
                  </div>
                </Link>
                <Link
                  href="/cart"
                  className="relative hover:text-blue-600 transition-colors"
                >
                  <ShoppingCart size={24} />
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {cart?.length || 0}
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="flex lg:hidden items-center gap-4">
            <Link href="/cart" className="relative">
              <ShoppingCart size={24} />
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {cart?.length || 0}
              </div>
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg absolute top-20 left-0 right-0 z-40 max-h-[calc(100vh-80px)] overflow-y-auto">
            <div className="w-full px-4 sm:px-[5%] py-4">
              <div className="space-y-3">
                {/* Mobile Search */}
                <div className="relative" ref={searchRef}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowResults(true);
                    }}
                    className="w-full px-4 py-3 pr-12 border-2 border-[#3489FF] rounded-md outline-none text-sm text-gray-800 placeholder-gray-400 text-right"
                    placeholder="ابحث..."
                  />
                  <div className="absolute top-0 right-0 h-full w-12 bg-[#3489FF] rounded-r-md flex items-center justify-center">
                    {isSearching ? (
                      <Loader2 size={18} className="text-white animate-spin" />
                    ) : (
                      <Search size={18} className="text-white" />
                    )}
                  </div>
                  {showResults && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-60 max-h-60 overflow-y-auto mt-1">
                      {searchResults.length > 0 ? (
                        searchResults.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              handleResultClick(product.slug);
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full text-right px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                          >
                            <Search
                              size={14}
                              className="text-gray-400 shrink-0"
                            />
                            <span className="text-sm text-gray-700 truncate">
                              {product.title}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-4 text-center text-sm text-gray-500">
                          لا توجد نتائج
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {sessionPending ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full" />
                    <div className="w-32 h-4 bg-gray-200 animate-pulse rounded" />
                  </div>
                ) : user ? (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <User size={20} />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="font-medium">الملف الشخصي</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left text-red-600"
                    >
                      <span className="font-medium">
                        {isLoggingOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
                      </span>
                    </button>
                  </>
                ) : (
                  <Link
                  href="/auth/login"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={20} />
                    <span className="font-medium">
                      تسجيل الدخول / إنشاء حساب
                    </span>
                  </Link>
                )}

                <Link
                  href="/whishlist"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <HeartIcon size={20} />
                  <span className="font-medium">المفضلة</span>
                  <div className="mr-auto bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {wishlist?.length || 0}
                  </div>
                </Link>

                <Link
                  href="/cart"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ShoppingCart size={20} />
                  <span className="font-medium">السلة</span>
                  <div className="mr-auto bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {cart?.length || 0}
                  </div>
                </Link>

                {/* Categories - Mobile Only */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">
                    الأقسام
                  </h3>
                  <MobileCategoryList
                    categories={categories}
                    onCategoryClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>

                {/* Additional Navigation Links - Mobile Only */}
                <div className="pt-4 border-t border-gray-100 pb-10">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">
                    روابط سريعة
                  </h3>
                  {links.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="block p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium "
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {isHomePage && <HeaderBottom />}
    </>
  );
};

export default Header;
