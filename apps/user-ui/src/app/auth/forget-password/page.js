"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const ForgetPasswordForm_1 = __importDefault(require("./ForgetPasswordForm"));
const page = () => {
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-gray-100 flex justify-center items-center", children: (0, jsx_runtime_1.jsx)(ForgetPasswordForm_1.default, {}) }));
};
exports.default = page;
//# sourceMappingURL=page.js.map