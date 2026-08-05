"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Hero;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const enums_1 = require("@/constants/enums");
/**
 * Homepage hero banner.
 * The banner image is a placeholder — the admin will upload the real one
 * from the dashboard. Replace `bannerImage` with the actual asset URL once
 * the banner endpoint/file is available.
 */
const bannerImage = null; // TODO: admin uploads banner image later
function Hero() {
    return ((0, jsx_runtime_1.jsx)("section", { className: "relative w-full overflow-hidden", children: (0, jsx_runtime_1.jsxs)("div", { className: `relative h-[420px] lg:h-[480px] ${bannerImage
                ? 'bg-cover bg-center'
                : 'bg-gradient-to-l from-[#3489FF] via-[#5a9dff] to-[#9dc4ff]'}`, style: bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined, children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 bg-gradient-to-l from-transparent via-[#3489FF]/40 to-[#0f172a]/30" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative z-10 w-[90%] max-w-7xl mx-auto h-full flex flex-col justify-center", children: [(0, jsx_runtime_1.jsx)("span", { className: "inline-flex w-fit items-center gap-2 bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4", children: "\uD83C\uDFF7\uFE0F \u0639\u0631\u0648\u0636 \u062D\u0635\u0631\u064A\u0629 \u0644\u0641\u062A\u0631\u0629 \u0645\u062D\u062F\u0648\u062F\u0629" }), (0, jsx_runtime_1.jsxs)("h1", { className: "text-4xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg max-w-2xl", children: ["\u062A\u0633\u0648\u0642 \u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A", (0, jsx_runtime_1.jsx)("br", {}), "\u0628\u0623\u0641\u0636\u0644 \u0627\u0644\u0623\u0633\u0639\u0627\u0631"] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-white/90 text-base lg:text-lg max-w-xl", children: "\u0627\u0643\u062A\u0634\u0641 \u062A\u0634\u0643\u064A\u0644\u0629 \u0648\u0627\u0633\u0639\u0629 \u0645\u0646 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0645\u0645\u064A\u0632\u0629 \u0645\u0639 \u062A\u0648\u0635\u064A\u0644 \u0633\u0631\u064A\u0639 \u0648\u062F\u0641\u0639 \u0622\u0645\u0646 \u0648\u0636\u0645\u0627\u0646 \u0627\u0644\u062C\u0648\u062F\u0629." }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 flex flex-wrap items-center gap-4", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: enums_1.Routes.Products, className: "inline-flex items-center gap-2 bg-white text-[#3489FF] font-semibold px-8 py-3.5 rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all", children: ["\u062A\u0633\u0648\u0642 \u0627\u0644\u0622\u0646", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { size: 18 })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: `/category/electronics`, className: "inline-flex items-center gap-2 border-2 border-white/70 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors", children: "\u0627\u0643\u062A\u0634\u0641 \u0627\u0644\u0623\u0642\u0633\u0627\u0645" })] })] }), !bannerImage && ((0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-3 left-3 z-10 bg-black/30 backdrop-blur-sm text-white/70 text-[11px] px-3 py-1.5 rounded-md", children: "\u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u0628\u0627\u0646\u0631 \u2014 \u0633\u064A\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631\u0629 \u0645\u0646 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645" }))] }) }));
}
//# sourceMappingURL=Hero.js.map