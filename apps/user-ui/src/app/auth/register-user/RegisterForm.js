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
const zod_1 = require("@hookform/resolvers/zod");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const GoogleSignInButton_1 = __importDefault(require("../login/_components/GoogleSignInButton"));
const react_query_1 = require("@tanstack/react-query");
const navigation_1 = require("next/navigation");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const registerSchema_1 = require("../../../validation/registerSchema");
const axiosInstance_1 = __importDefault(require("../../../utils/axiosInstance"));
const RegisterForm = () => {
    const { register, watch, handleSubmit, formState: { errors }, } = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(registerSchema_1.registerSchema),
    });
    const [serverError, setServerError] = (0, react_1.useState)(null);
    const [successMessage, setSuccessMessage] = (0, react_1.useState)(null);
    const [passwordVisible, setPasswordVisible] = (0, react_1.useState)(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = (0, react_1.useState)(false);
    const [canResend, setCanResend] = (0, react_1.useState)(false);
    const [timer, setTimer] = (0, react_1.useState)(60);
    const [otp, setOtp] = (0, react_1.useState)(['', '', '', '']);
    const [showOtp, setShowOtp] = (0, react_1.useState)(false);
    const [userData, setUserData] = (0, react_1.useState)(null);
    const [message, setMessage] = (0, react_1.useState)(null);
    const router = (0, navigation_1.useRouter)();
    const timeoutRef = (0, react_1.useRef)(null);
    const intervalRef = (0, react_1.useRef)(null);
    const passwordValue = watch('password');
    const inputsRefs = (0, react_1.useRef)([]);
    const getStrengthData = (password) => {
        if (!password)
            return {
                score: 0,
                color: 'text-gray-400',
                label: '',
                bgColor: 'bg-gray-400',
                segments: [],
            };
        let score = 0;
        const requirements = [
            password.length >= 6,
            /[A-Z]/.test(password),
            /[0-9]/.test(password),
            /[^A-Za-z0-9]/.test(password),
        ];
        const metCount = requirements.filter(Boolean).length;
        // Map 4 requirements to 3 strength levels
        if (metCount <= 1) {
            score = 1; // Weak
        }
        else if (metCount <= 2) {
            score = 2; // Medium
        }
        else {
            score = 3; // Strong
        }
        const strengthData = [
            { color: 'text-red-500', label: 'ضعيف', bgColor: 'bg-red-500' },
            { color: 'text-yellow-500', label: 'متوسط', bgColor: 'bg-yellow-500' },
            { color: 'text-green-500', label: 'قوي', bgColor: 'bg-green-500' },
        ];
        const currentStrength = strengthData[score - 1] || strengthData[0];
        return {
            score,
            ...currentStrength,
            segments: requirements.map((met, index) => ({
                met: index < metCount,
                requirement: ['6+ أحرف', 'حرف كبير', 'رقم', 'رمز خاص'][index],
            })),
        };
    };
    // ✅ OTP Auto Focus
    const handleOtpChange = (index, value) => {
        if (!/^[0-9]?$/.test(value))
            return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < otp.length - 1) {
            inputsRefs.current[index + 1]?.focus();
        }
    };
    const handleOtpPaste = (e) => {
        e.preventDefault(); // stop default paste behavior
        const pasted = e.clipboardData.getData('text').trim();
        const digits = pasted.replace(/\D/g, ''); // remove anything not 0–9
        if (digits.length !== otp.length)
            return;
        const newOtp = digits.split(''); // ['4','9','3','1']
        setOtp(newOtp);
        // focus last input
        inputsRefs.current[otp.length - 1]?.focus();
    };
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputsRefs.current[index - 1]?.focus();
        }
    };
    // ✅ Timer logic
    const startTimer = () => {
        // If an old interval exists, clear it first
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        setCanResend(false);
        setTimer(60);
        intervalRef.current = setInterval(() => {
            setTimer((t) => {
                if (t <= 1) {
                    if (intervalRef.current)
                        clearInterval(intervalRef.current);
                    setCanResend(true);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
    };
    // 🧹 Cleanup on unmount to avoid memory leaks
    (0, react_1.useEffect)(() => {
        return () => {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
        };
    }, []);
    // ✅ React Query — Register Mutation
    const registerMutation = (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            const { data: json } = await axiosInstance_1.default.post('/api/auth/register', data, { requiresAuth: false });
            return { json, data };
        },
        onSuccess: ({ json, data }) => {
            react_hot_toast_1.default.success(json.message);
            setShowOtp(true);
            setUserData(data);
            startTimer();
        },
        onError: (err) => react_hot_toast_1.default.error(err.message),
    });
    const onSubmit = (data) => {
        setServerError(null);
        setSuccessMessage(null);
        registerMutation.mutate(data);
    };
    // ✅ React Query — Verify OTP Mutation
    const verifyOtpMutation = (0, react_query_1.useMutation)({
        mutationFn: async () => {
            const otpCode = otp.join('');
            if (otpCode.length !== 4)
                throw new Error('يرجى إدخال رمز التحقق المكون من 4 أرقام');
            const { data: json } = await axiosInstance_1.default.post('/api/auth/verify-registration-otp', { otp: otpCode }, { requiresAuth: false });
            return json;
        },
        onSuccess: () => {
            setMessage('✅ تم تفعيل الحساب بنجاح');
            timeoutRef.current = setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        },
        onError: (err) => setServerError(err.message),
    });
    // ✅ Resend OTP mutation
    const resendOtpMutation = (0, react_query_1.useMutation)({
        mutationFn: async () => {
            if (!userData)
                throw new Error('بيانات التسجيل غير متوفرة');
            await axiosInstance_1.default.post('/api/auth/register', userData, { requiresAuth: false });
        },
        onSuccess: () => {
            startTimer();
            setOtp(['', '', '', '']);
            inputsRefs.current[0]?.focus();
        },
        onError: () => setServerError('فشل في إعادة إرسال رمز التحقق'),
    });
    (0, react_1.useEffect)(() => {
        return () => {
            if (timeoutRef.current)
                clearTimeout(timeoutRef.current);
        };
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { dir: "rtl", className: "relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50 py-6 sm:py-10", children: [(0, jsx_runtime_1.jsx)("div", { className: "pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl sm:h-96 sm:w-96" }), (0, jsx_runtime_1.jsx)("div", { className: "pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl sm:h-96 sm:w-96" }), (0, jsx_runtime_1.jsx)("div", { className: "pointer-events-none absolute left-1/3 top-1/3 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" }), !showOtp ? ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit(onSubmit), className: "relative mx-auto w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:max-w-lg sm:p-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/30", children: (0, jsx_runtime_1.jsx)(lucide_react_1.UserPlus, { size: 26 }) }), (0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold text-slate-900 sm:text-3xl", children: "\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-slate-500", children: "\u0627\u0646\u0636\u0645 \u0625\u0644\u064A\u0646\u0627 \u0648\u0627\u0628\u062F\u0623 \u0627\u0644\u062A\u0633\u0648\u0642 \u0627\u0644\u0622\u0646" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-sm font-medium text-slate-700", children: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644" }), (0, jsx_runtime_1.jsx)("input", { type: "text", ...register('name'), className: "w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "\u0623\u062F\u062E\u0644 \u0627\u0633\u0645\u0643 \u0627\u0644\u0643\u0627\u0645\u0644" }), errors.name && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-xs text-red-600", children: errors.name.message }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-sm font-medium text-slate-700", children: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" }), (0, jsx_runtime_1.jsx)("input", { type: "email", ...register('email'), className: "w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "\u0623\u062F\u062E\u0644 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" }), errors.email && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-xs text-red-600", children: errors.email.message }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-sm font-medium text-slate-700", children: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: passwordVisible ? 'text' : 'password', ...register('password'), className: "w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "\u0623\u0646\u0634\u0626 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setPasswordVisible(!passwordVisible), className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600", children: passwordVisible ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 20 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 20 }) })] }), errors.password && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-xs text-red-600", children: errors.password.message })), passwordValue && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-3 space-y-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex gap-1.5", children: [1, 2, 3].map((segment) => ((0, jsx_runtime_1.jsx)("div", { className: `h-1.5 flex-1 rounded-full transition-all duration-300 ${segment <= getStrengthData(passwordValue).score
                                                    ? getStrengthData(passwordValue).bgColor
                                                    : 'bg-slate-200'}` }, segment))) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-medium text-slate-600", children: ["\u0627\u0644\u0642\u0648\u0629:", ' ', (0, jsx_runtime_1.jsx)("span", { className: getStrengthData(passwordValue).color, children: getStrengthData(passwordValue).label })] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-slate-400", children: [getStrengthData(passwordValue).segments.filter((s) => s.met).length, ' ', "/ 4"] })] })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-sm font-medium text-slate-700", children: "\u062A\u0623\u0643\u064A\u062F \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: confirmPasswordVisible ? 'text' : 'password', ...register('confirmPassword'), className: "w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "\u0623\u0639\u062F \u0625\u062F\u062E\u0627\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setConfirmPasswordVisible(!confirmPasswordVisible), className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600", children: confirmPasswordVisible ? ((0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 20 })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 20 })) })] }), errors.confirmPassword && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-xs text-red-600", children: errors.confirmPassword.message }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-5 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 sm:p-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-4 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { size: 18, className: "text-blue-500" }), (0, jsx_runtime_1.jsx)("h3", { className: "text-base font-semibold text-slate-800", children: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-sm font-medium text-slate-700", children: "\u0646\u0648\u0639 \u0627\u0644\u0639\u0646\u0648\u0627\u0646" }), (0, jsx_runtime_1.jsxs)("select", { ...register('address.label'), className: "w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500", children: [(0, jsx_runtime_1.jsx)("option", { value: "Home", children: "\u0627\u0644\u0645\u0646\u0632\u0644" }), (0, jsx_runtime_1.jsx)("option", { value: "Work", children: "\u0627\u0644\u0639\u0645\u0644" }), (0, jsx_runtime_1.jsx)("option", { value: "Other", children: "\u0623\u062E\u0631\u0649" })] }), errors.address?.label && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-xs text-red-600", children: errors.address.label.message }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-sm font-medium text-slate-700", children: "\u0627\u0644\u062F\u0648\u0644\u0629" }), (0, jsx_runtime_1.jsx)("input", { type: "text", ...register('address.country'), className: "w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "\u0623\u062F\u062E\u0644 \u0627\u0644\u062F\u0648\u0644\u0629" }), errors.address?.country && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-xs text-red-600", children: errors.address.country.message }))] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-sm font-medium text-slate-700", children: "\u0627\u0644\u0645\u062F\u064A\u0646\u0629" }), (0, jsx_runtime_1.jsx)("input", { type: "text", ...register('address.city'), className: "w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "\u0623\u062F\u062E\u0644 \u0627\u0644\u0645\u062F\u064A\u0646\u0629" }), errors.address?.city && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-xs text-red-600", children: errors.address.city.message }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4", children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-sm font-medium text-slate-700", children: "\u0627\u0644\u0634\u0627\u0631\u0639" }), (0, jsx_runtime_1.jsx)("input", { type: "text", ...register('address.street'), className: "w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "\u0623\u062F\u062E\u0644 \u0627\u0644\u0634\u0627\u0631\u0639" }), errors.address?.street && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-xs text-red-600", children: errors.address.street.message }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4", children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-sm font-medium text-slate-700", children: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641" }), (0, jsx_runtime_1.jsx)("input", { type: "tel", ...register('address.phone'), className: "w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "\u0623\u062F\u062E\u0644 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641" }), errors.address?.phone && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-xs text-red-600", children: errors.address.phone.message }))] }), (0, jsx_runtime_1.jsxs)("label", { className: "mt-4 flex cursor-pointer items-center gap-2.5", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", ...register('address.isDefault'), className: "h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-slate-700", children: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A" })] })] }), serverError && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 rounded-xl border border-red-200 bg-red-50 p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-600", children: serverError }) })), successMessage && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 rounded-xl border border-green-200 bg-green-50 p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-green-600", children: successMessage }) })), (0, jsx_runtime_1.jsxs)("button", { type: "submit", disabled: registerMutation.isPending, className: "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60", children: [registerMutation.isPending && ((0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "h-5 w-5 animate-spin" })), registerMutation.isPending
                                    ? 'جاري إنشاء الحساب...'
                                    : 'إنشاء حساب'] }), (0, jsx_runtime_1.jsxs)("div", { className: "my-6 flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-400", children: "\u0623\u0648 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645" }), (0, jsx_runtime_1.jsx)("div", { className: "h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" })] }), (0, jsx_runtime_1.jsx)(GoogleSignInButton_1.default, { callbackUrl: "/" }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-5 text-center text-sm text-slate-500", children: ["\u0644\u062F\u064A\u0643 \u062D\u0633\u0627\u0628 \u0628\u0627\u0644\u0641\u0639\u0644\u061F", ' ', (0, jsx_runtime_1.jsx)(link_1.default, { href: "/auth/login", className: "font-semibold text-blue-500 transition hover:text-blue-600", children: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" })] })] }) })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsxs)("div", { className: "relative mx-auto w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/30", children: (0, jsx_runtime_1.jsx)(lucide_react_1.MailCheck, { size: 26 }) }), (0, jsx_runtime_1.jsx)("h3", { className: "text-center text-xl font-bold text-slate-900 sm:text-2xl", children: "\u062A\u0623\u0643\u064A\u062F \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" }), (0, jsx_runtime_1.jsx)("p", { className: "mb-8 mt-2 text-center text-sm text-slate-500", children: "\u0644\u0642\u062F \u0623\u0631\u0633\u0644\u0646\u0627 \u0631\u0645\u0632 \u062A\u0641\u0639\u064A\u0644 \u0625\u0644\u0649 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A. \u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644\u0647 \u0623\u062F\u0646\u0627\u0647." }), (0, jsx_runtime_1.jsx)("div", { className: "mb-8 flex justify-center gap-3 dir-ltr sm:gap-4", children: otp.map((digit, index) => ((0, jsx_runtime_1.jsx)("input", { type: "text", inputMode: "numeric", maxLength: 1, value: digit, onChange: (e) => handleOtpChange(index, e.target.value), onKeyDown: (e) => handleOtpKeyDown(index, e), onPaste: handleOtpPaste, ref: (el) => {
                                    inputsRefs.current[index] = el;
                                }, className: "h-12 w-12 rounded-xl border-0 bg-slate-50 text-center text-lg font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500 sm:h-14 sm:w-14", style: { direction: 'ltr' } }, index))) }), serverError && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 rounded-xl border border-red-200 bg-red-50 p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-center text-sm text-red-600", children: serverError }) })), message && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 rounded-xl border border-green-200 bg-green-50 p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-center text-sm text-green-600", children: message }) })), (0, jsx_runtime_1.jsxs)("button", { onClick: () => verifyOtpMutation.mutate(), disabled: verifyOtpMutation.isPending, className: "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60", children: [verifyOtpMutation.isPending && ((0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "h-5 w-5 animate-spin" })), verifyOtpMutation.isPending ? 'جاري التحقق...' : 'تفعيل الحساب'] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-5 text-center", children: canResend ? ((0, jsx_runtime_1.jsx)("button", { onClick: () => resendOtpMutation.mutate(), className: "text-sm font-medium text-blue-500 transition hover:text-blue-600", children: "\u0625\u0639\u0627\u062F\u0629 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0645\u0632" })) : ((0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-slate-500", children: ["\u0625\u0639\u0627\u062F\u0629 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0645\u0632 \u062E\u0644\u0627\u0644", ' ', (0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-blue-500", children: timer }), ' ', "\u062B\u0627\u0646\u064A\u0629"] })) }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4 text-center", children: (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowOtp(false), className: "text-sm font-medium text-slate-400 transition hover:text-slate-600", children: "\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0644\u062A\u0633\u062C\u064A\u0644" }) })] }) }))] }));
};
exports.default = RegisterForm;
//# sourceMappingURL=RegisterForm.js.map