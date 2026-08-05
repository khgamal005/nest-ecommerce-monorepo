'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const HeaderBottom_1 = __importDefault(require("./HeaderBottom"));
const MobileCategoryList_1 = __importDefault(require("./MobileCategoryList"));
const use_user_1 = require("@/hooks/use-user");
const enums_1 = require("@/constants/enums");
const store_1 = require("@/store");
const useLayout_1 = require("@/hooks/useLayout");
const links = [
    { title: 'الرئيسية', href: enums_1.Routes.Home },
    { title: 'المنتجات', href: enums_1.Routes.Products },
    { title: 'العلامات التجارية', href: enums_1.Routes.Brands },
    { title: 'العروض', href: enums_1.Routes.Offers },
    { title: 'الطلبات', href: enums_1.Routes.Orders },
    // Multi-vendor links removed: this is single-vendor.
    // { title: 'المحلات', href: Routes.Shops },
    // { title: 'كن بائعاً', href: RoutesExternal.BecomeSeller },
];
const Header = () => {
    const pathname = (0, navigation_1.usePathname)();
    const router = (0, navigation_1.useRouter)();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = (0, react_1.useState)(false);
    const [mounted, setMounted] = (0, react_1.useState)(false);
    const [userMenuOpen, setUserMenuOpen] = (0, react_1.useState)(false);
    const { user, sessionPending, logout, isLoggingOut } = (0, use_user_1.useUser)();
    const { categories } = (0, useLayout_1.useLayout)();
    const cart = (0, store_1.useStore)((state) => state.cart);
    const wishlist = (0, store_1.useStore)((state) => state.wishlist);
    // Search state
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [searchResults, setSearchResults] = (0, react_1.useState)([]);
    const [isSearching, setIsSearching] = (0, react_1.useState)(false);
    const [showResults, setShowResults] = (0, react_1.useState)(false);
    const searchRef = (0, react_1.useRef)(null);
    const debounceTimerRef = (0, react_1.useRef)(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    // Check if current page is homepage
    const isHomePage = pathname === '/';
    (0, react_1.useEffect)(() => {
        setMounted(true);
    }, []);
    // Close search dropdown when clicking outside
    (0, react_1.useEffect)(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowResults(false);
            }
            setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    // Debounced search handler
    const handleSearchChange = (0, react_1.useCallback)((e) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (debounceTimerRef.current)
            clearTimeout(debounceTimerRef.current);
        if (!value.trim()) {
            setSearchResults([]);
            setShowResults(false);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        debounceTimerRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/product/api/search-products?q=${encodeURIComponent(value.trim())}`);
                const data = await res.json();
                if (data.success) {
                    setSearchResults(data.products || []);
                    setShowResults(true);
                }
            }
            catch (err) {
                console.error('Search error:', err);
            }
            finally {
                setIsSearching(false);
            }
        }, 400);
    }, [API_URL]);
    const handleResultClick = (slug) => {
        setShowResults(false);
        setSearchQuery('');
        setSearchResults([]);
        router.push(`/product/${slug}`);
    };
    const handleLogout = async () => {
        try {
            await logout();
        }
        catch {
            // NetworkError during logout is expected if session expired
        }
        setIsMobileMenuOpen(false);
        router.push('/auth/login');
    };
    if (!mounted) {
        return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "w-full h-20 bg-white border-b sticky top-0 z-50 shadow-sm", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-[90%] py-5 h-full mx-auto flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 lg:flex-1", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/", children: (0, jsx_runtime_1.jsx)("div", { className: "w-20 h-12 bg-gray-200 rounded animate-pulse" }) }) }), (0, jsx_runtime_1.jsx)("div", { className: "hidden lg:flex flex-1 justify-end", children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-6", children: (0, jsx_runtime_1.jsx)("div", { className: "w-28 h-10 bg-gray-200 rounded animate-pulse" }) }) })] }) }), isHomePage && (0, jsx_runtime_1.jsx)(HeaderBottom_1.default, {})] }));
    }
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-full h-20 bg-white border-b sticky top-0 z-50 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-[90%] py-5 h-full mx-auto flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 lg:flex-1", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/", className: "inline-flex items-center h-20", children: (0, jsx_runtime_1.jsx)("span", { className: "text-2xl font-bold text-[#3489FF]", children: "\u0645\u062A\u062C\u0631\u0646\u0627" }) }) }), (0, jsx_runtime_1.jsx)("div", { className: "hidden lg:flex flex-1 justify-center", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-2xl relative", ref: searchRef, children: [(0, jsx_runtime_1.jsx)("input", { type: "text", value: searchQuery, onChange: handleSearchChange, onFocus: () => {
                                                if (searchResults.length > 0)
                                                    setShowResults(true);
                                            }, className: "w-full px-4 py-3 pr-16 font-medium border-[2.5px] border-[#3489FF] rounded-md outline-none h-[55px] text-gray-800 placeholder-gray-400 text-right", placeholder: "\u0627\u0628\u062D\u062B..." }), (0, jsx_runtime_1.jsx)("div", { className: "w-[60px] h-[55px] bg-[#3489FF] cursor-pointer flex items-center justify-center rounded-md absolute top-0 right-0", children: isSearching ? ((0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { size: 20, strokeWidth: 2.5, className: "text-white animate-spin" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 20, strokeWidth: 2.5, className: "text-white" })) }), showResults && ((0, jsx_runtime_1.jsx)("div", { className: "absolute top-[58px] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-60 max-h-80 overflow-y-auto", children: searchResults.length > 0 ? (searchResults.map((product) => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => handleResultClick(product.slug), className: "w-full text-right px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "text-gray-400 shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-gray-700 truncate", children: product.title })] }, product.id)))) : ((0, jsx_runtime_1.jsxs)("div", { className: "px-4 py-6 text-center text-sm text-gray-500", children: ["\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u062A\u0627\u0626\u062C \u0644\u0640 \"", searchQuery, "\""] })) }))] }) }), (0, jsx_runtime_1.jsx)("div", { className: "hidden lg:flex flex-1 justify-end", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-6", children: [sessionPending ? ((0, jsx_runtime_1.jsx)("div", { className: "w-24 h-4 bg-gray-200 animate-pulse rounded" })) : user ? ((0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setUserMenuOpen((v) => !v), className: "flex items-center gap-1 cursor-pointer p-1 hover:bg-gray-100 rounded", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.User, { className: "w-5 h-5" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium", children: user.name }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "w-3 h-3" })] }), userMenuOpen && ((0, jsx_runtime_1.jsxs)("div", { className: "absolute left-0 top-full mt-1 w-48 bg-white shadow-lg rounded-md border border-gray-200 z-50 py-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "px-4 py-2 text-gray-500 text-sm", children: ["\u0623\u0647\u0644\u0627\u064B\u060C ", user.name] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/profile", onClick: () => setUserMenuOpen(false), className: "block px-4 py-2 hover:bg-gray-100 text-sm text-gray-800", children: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleLogout, disabled: isLoggingOut, className: "w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 text-sm", children: isLoggingOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج' })] }))] })) : ((0, jsx_runtime_1.jsx)(link_1.default, { href: "/auth/login", className: "text-gray-700 hover:text-gray-900 font-medium px-3 py-2 rounded-md hover:bg-gray-50 transition-colors", children: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" })), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-5", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/whishlist", className: "relative hover:text-red-500 transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.HeartIcon, { size: 24 }), (0, jsx_runtime_1.jsx)("div", { className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs", children: wishlist?.length || 0 })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/cart", className: "relative hover:text-blue-600 transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShoppingCart, { size: 24 }), (0, jsx_runtime_1.jsx)("div", { className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs", children: cart?.length || 0 })] })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex lg:hidden items-center gap-4", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/cart", className: "relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShoppingCart, { size: 24 }), (0, jsx_runtime_1.jsx)("div", { className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs", children: cart?.length || 0 })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen), className: "p-2 rounded-md hover:bg-gray-100 transition-colors", children: isMobileMenuOpen ? (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 24 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Menu, { size: 24 }) })] })] }), isMobileMenuOpen && ((0, jsx_runtime_1.jsx)("div", { className: "lg:hidden bg-white border-t border-gray-200 shadow-lg absolute top-20 left-0 right-0 z-40 max-h-[calc(100vh-80px)] overflow-y-auto", children: (0, jsx_runtime_1.jsx)("div", { className: "w-full px-4 sm:px-[5%] py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative", ref: searchRef, children: [(0, jsx_runtime_1.jsx)("input", { type: "text", value: searchQuery, onChange: handleSearchChange, onFocus: () => {
                                                    if (searchResults.length > 0)
                                                        setShowResults(true);
                                                }, className: "w-full px-4 py-3 pr-12 border-2 border-[#3489FF] rounded-md outline-none text-sm text-gray-800 placeholder-gray-400 text-right", placeholder: "\u0627\u0628\u062D\u062B..." }), (0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 right-0 h-full w-12 bg-[#3489FF] rounded-r-md flex items-center justify-center", children: isSearching ? ((0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { size: 18, className: "text-white animate-spin" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 18, className: "text-white" })) }), showResults && ((0, jsx_runtime_1.jsx)("div", { className: "absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-60 max-h-60 overflow-y-auto mt-1", children: searchResults.length > 0 ? (searchResults.map((product) => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                                        handleResultClick(product.slug);
                                                        setIsMobileMenuOpen(false);
                                                    }, className: "w-full text-right px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 14, className: "text-gray-400 shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-gray-700 truncate", children: product.title })] }, product.id)))) : ((0, jsx_runtime_1.jsx)("div", { className: "px-4 py-4 text-center text-sm text-gray-500", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u062A\u0627\u0626\u062C" })) }))] }), sessionPending ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-gray-50", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 bg-gray-200 animate-pulse rounded-full" }), (0, jsx_runtime_1.jsx)("div", { className: "w-32 h-4 bg-gray-200 animate-pulse rounded" })] })) : user ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-gray-50", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.User, { size: 20 }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-medium", children: user.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: user.email })] })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/profile", className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors", onClick: () => setIsMobileMenuOpen(false), children: (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: handleLogout, disabled: isLoggingOut, className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left text-red-600", children: (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: isLoggingOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج' }) })] })) : ((0, jsx_runtime_1.jsxs)(link_1.default, { href: "/auth/login", className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors", onClick: () => setIsMobileMenuOpen(false), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.User, { size: 20 }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 / \u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628" })] })), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/whishlist", className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors", onClick: () => setIsMobileMenuOpen(false), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.HeartIcon, { size: 20 }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "\u0627\u0644\u0645\u0641\u0636\u0644\u0629" }), (0, jsx_runtime_1.jsx)("div", { className: "mr-auto bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs", children: wishlist?.length || 0 })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/cart", className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors", onClick: () => setIsMobileMenuOpen(false), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShoppingCart, { size: 20 }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "\u0627\u0644\u0633\u0644\u0629" }), (0, jsx_runtime_1.jsx)("div", { className: "mr-auto bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs", children: cart?.length || 0 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "pt-4 border-t border-gray-100", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3", children: "\u0627\u0644\u0623\u0642\u0633\u0627\u0645" }), (0, jsx_runtime_1.jsx)(MobileCategoryList_1.default, { categories: categories, onCategoryClick: () => setIsMobileMenuOpen(false) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "pt-4 border-t border-gray-100 pb-10", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3", children: "\u0631\u0648\u0627\u0628\u0637 \u0633\u0631\u064A\u0639\u0629" }), links.map((link, index) => ((0, jsx_runtime_1.jsx)(link_1.default, { href: link.href, className: "block p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium ", onClick: () => setIsMobileMenuOpen(false), children: link.title }, index)))] })] }) }) }))] }), isHomePage && (0, jsx_runtime_1.jsx)(HeaderBottom_1.default, {})] }));
};
exports.default = Header;
//# sourceMappingURL=Header.js.map