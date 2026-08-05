'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HeaderClient;
const jsx_runtime_1 = require("react/jsx-runtime");
const dynamic_1 = __importDefault(require("next/dynamic"));
const react_1 = __importDefault(require("react"));
const HeaderBottom_1 = __importDefault(require("./HeaderBottom"));
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const HeaderDynamic = (0, dynamic_1.default)(() => import('./Header'), {
    loading: () => (0, jsx_runtime_1.jsx)(HeaderSkeleton, {}),
});
function HeaderSkeleton() {
    const pathname = (0, navigation_1.usePathname)();
    const isHomePage = pathname === '/';
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "w-full h-20 bg-white border-b sticky top-0 z-50 shadow-sm", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-[90%] py-5 h-full mx-auto flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 lg:flex-1", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/", children: (0, jsx_runtime_1.jsx)("div", { className: "w-24 h-20 bg-gray-200 rounded animate-pulse" }) }) }), (0, jsx_runtime_1.jsx)("div", { className: "hidden lg:flex flex-1 justify-end", children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-6", children: (0, jsx_runtime_1.jsx)("div", { className: "w-28 h-10 bg-gray-200 rounded animate-pulse" }) }) })] }) }), isHomePage && (0, jsx_runtime_1.jsx)(HeaderBottom_1.default, {})] }));
}
function HeaderClient() {
    return (0, jsx_runtime_1.jsx)(HeaderDynamic, {});
}
//# sourceMappingURL=HeaderClient.js.map