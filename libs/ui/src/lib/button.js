"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = Button;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
function Button({ variant = 'primary', className = '', ...props }) {
    const base = 'px-4 py-2 rounded-md text-sm font-medium transition-colors';
    const variants = {
        primary: 'bg-black text-white hover:bg-gray-800',
        secondary: 'bg-gray-100 text-black hover:bg-gray-200',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    };
    return (0, jsx_runtime_1.jsx)("button", { className: `${base} ${variants[variant]} ${className}`, ...props });
}
//# sourceMappingURL=button.js.map