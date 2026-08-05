"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
require("./globals.css");
const providers_1 = __importDefault(require("./providers"));
const HeaderClient_1 = __importDefault(require("./shared/header/HeaderClient"));
const Footer_1 = __importDefault(require("./shared/footer/Footer"));
exports.metadata = {
    title: 'Shop',
    description: 'Ecommerce storefront',
};
function RootLayout({ children }) {
    return ((0, jsx_runtime_1.jsx)("html", { lang: "ar", dir: "rtl", children: (0, jsx_runtime_1.jsx)("body", { className: "flex min-h-screen flex-col bg-gray-50", children: (0, jsx_runtime_1.jsxs)(providers_1.default, { children: [(0, jsx_runtime_1.jsx)(HeaderClient_1.default, {}), (0, jsx_runtime_1.jsx)("main", { className: "min-h-screen flex flex-col", children: children }), (0, jsx_runtime_1.jsx)(Footer_1.default, {})] }) }) }));
}
//# sourceMappingURL=layout.js.map