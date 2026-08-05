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
const react_1 = __importStar(require("react"));
const react_hook_form_1 = require("react-hook-form");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation"); // ✅ useRouter import for App Router
const lucide_react_1 = require("lucide-react");
const GoogleSignInButton_1 = __importDefault(require("./GoogleSignInButton"));
const react_query_1 = require("@tanstack/react-query");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const authStore_1 = require("../../../../store/authStore");
const axiosInstance_1 = __importDefault(require("../../../../utils/axiosInstance"));
const LoginForm = () => {
    const router = (0, navigation_1.useRouter)();
    const queryClient = (0, react_query_1.useQueryClient)();
    const setClientSession = (0, authStore_1.useAuthStore)((state) => state.setClientSession);
    const setUser = (0, authStore_1.useAuthStore)((state) => state.setUser);
    const { register, handleSubmit, formState: { errors }, } = (0, react_hook_form_1.useForm)();
    const [serverError, setServerError] = (0, react_1.useState)(null);
    const [successMessage, setSuccessMessage] = (0, react_1.useState)(null);
    const [passwordVisible, setPasswordVisible] = (0, react_1.useState)(false);
    const [rememberMe, setRememberMe] = (0, react_1.useState)(false);
    // ✅ React Query — Login Mutation
    const loginMutation = (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            const { data: json } = await axiosInstance_1.default.post('/api/auth/login', data, { requiresAuth: false });
            return json;
        },
        onSuccess: (json) => {
            react_hot_toast_1.default.success(json.message);
            authStore_1.useAuthStore.getState().setClientSession(true);
            if (json.user) {
                authStore_1.useAuthStore.getState().setUser(json.user);
                queryClient.setQueryData(['user'], json.user);
            }
            // Refresh server layout so SSR picks up the new cookies, then navigate.
            router.refresh();
            router.push('/');
        },
        onError: (err) => {
            // ✅ error toast
            react_hot_toast_1.default.error(` ${err.message} || 'Login failed'`);
        },
    });
    const onSubmit = (data) => {
        loginMutation.mutate(data);
    };
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full p-y", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-full max-w-md mx-auto mt-10 mb-4 px-2", children: (0, jsx_runtime_1.jsx)(GoogleSignInButton_1.default, { callbackUrl: `/` }) }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit(onSubmit), className: "w-full max-w-md mx-auto mt-0 p-6 shadow-lg border rounded-xl bg-white", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold mb-5 text-center", children: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u062D\u0633\u0627\u0628\u0643" }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("input", { type: "email", placeholder: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A", ...register('email', { required: 'البريد الإلكتروني مطلوب' }), className: "border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500" }), (0, jsx_runtime_1.jsx)("p", { className: "text-red-600 text-sm mt-1", children: errors.email?.message })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-2 relative", children: [(0, jsx_runtime_1.jsx)("input", { type: passwordVisible ? 'text' : 'password', placeholder: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", ...register('password', { required: 'كلمة المرور مطلوبة' }), className: "border rounded px-3 py-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setPasswordVisible(!passwordVisible), className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-600", children: passwordVisible ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 20 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 20 }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-red-600 text-sm mt-1", children: errors.password?.message })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", id: "rememberMe", checked: rememberMe, onChange: (e) => setRememberMe(e.target.checked), className: "h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 rounded" }), (0, jsx_runtime_1.jsx)("label", { htmlFor: "rememberMe", className: "ml-2 text-sm text-gray-700", children: "\u062A\u0630\u0643\u0631\u0646\u064A" })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/auth/forget-password", className: "text-sm text-blue-500 hover:underline", children: "\u0646\u0633\u064A\u062A \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631\u061F" })] }), (0, jsx_runtime_1.jsxs)("button", { type: "submit", disabled: loginMutation.isPending, className: "w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 rounded-lg flex items-center justify-center font-medium transition-colors duration-200 mb-4", children: [loginMutation.isPending && ((0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "animate-spin ml-2" })), loginMutation.isPending ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'] }), serverError && ((0, jsx_runtime_1.jsx)("p", { className: "text-red-600 text-sm mb-3", children: serverError })), successMessage && ((0, jsx_runtime_1.jsx)("p", { className: "text-green-600 text-sm mb-3", children: successMessage })), (0, jsx_runtime_1.jsxs)("p", { className: "mt-4 text-center text-sm text-gray-600", children: ["\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u062D\u0633\u0627\u0628\u061F", ' ', (0, jsx_runtime_1.jsx)(link_1.default, { href: "/auth/register-user", className: "text-blue-500 hover:underline font-medium", children: "\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628" })] })] })] }) }));
};
exports.default = LoginForm;
//# sourceMappingURL=LoginForm.js.map