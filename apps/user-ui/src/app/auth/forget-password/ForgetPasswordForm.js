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
const navigation_1 = require("next/navigation");
const react_query_1 = require("@tanstack/react-query");
const lucide_react_1 = require("lucide-react");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const axiosInstance_1 = __importDefault(require("../../../utils/axiosInstance"));
const ForgetPasswordForm = () => {
    const [step, setStep] = (0, react_1.useState)(1); // 1 = forget, 2 = otp, 3 = reset
    const [serverError, setServerError] = (0, react_1.useState)(null);
    const [successMessage, setSuccessMessage] = (0, react_1.useState)(null);
    const [otp, setOtp] = (0, react_1.useState)(['', '', '', '']);
    const [userData, setUserData] = (0, react_1.useState)(null);
    const [resetToken, setResetToken] = (0, react_1.useState)(null);
    const [message, setMessage] = (0, react_1.useState)(null);
    const [canResend, setCanResend] = (0, react_1.useState)(false);
    const [timer, setTimer] = (0, react_1.useState)(60);
    const [passwordVisible, setPasswordVisible] = (0, react_1.useState)(false);
    const inputsRefs = (0, react_1.useRef)([]);
    const timeoutRef = (0, react_1.useRef)(null);
    const intervalRef = (0, react_1.useRef)(null);
    const router = (0, navigation_1.useRouter)();
    const { register, handleSubmit, formState: { errors }, } = (0, react_hook_form_1.useForm)();
    // ------------------- TIMER -------------------
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
    // ------------------- OTP HANDLERS -------------------
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
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputsRefs.current[index - 1]?.focus();
        }
    };
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').trim();
        const digits = pasted.replace(/\D/g, '');
        if (digits.length !== otp.length)
            return;
        setOtp(digits.split(''));
        inputsRefs.current[otp.length - 1]?.focus();
    };
    (0, react_1.useEffect)(() => {
        return () => {
            if (timeoutRef.current)
                clearTimeout(timeoutRef.current);
        };
    }, []);
    // ------------------- MUTATIONS -------------------
    const forgetPasswordMutation = (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            const { data: json } = await axiosInstance_1.default.post('/api/auth/forgot-password', data, { requiresAuth: false });
            return { json, data };
        },
        onSuccess: ({ json, data }) => {
            react_hot_toast_1.default.success(json.message);
            setUserData(data);
            startTimer();
            setStep(2);
        },
        onError: (err) => react_hot_toast_1.default.error(err.message),
    });
    const verifyOtpMutation = (0, react_query_1.useMutation)({
        mutationFn: async () => {
            const otpCode = otp.join('');
            if (otpCode.length !== 4)
                throw new Error('الرجاء إدخال رمز التحقق المكون من 4 أرقام');
            const { data: json } = await axiosInstance_1.default.post('/api/auth/verify-forget-password-otp', { email: userData?.email, otp: otpCode }, { requiresAuth: false });
            return json;
        },
        onSuccess: (json) => {
            react_hot_toast_1.default.success('تم التحقق بنجاح');
            setResetToken(json.resetToken);
            setStep(3);
        },
        onError: (err) => react_hot_toast_1.default.error(err.message),
    });
    const resendOtpMutation = (0, react_query_1.useMutation)({
        mutationFn: async () => {
            await axiosInstance_1.default.post('/api/auth/forgot-password', { email: userData?.email }, { requiresAuth: false });
        },
        onSuccess: () => {
            react_hot_toast_1.default.success('تم إعادة إرسال رمز التحقق');
            setOtp(['', '', '', '']);
            inputsRefs.current[0]?.focus();
            startTimer();
        },
        onError: (err) => react_hot_toast_1.default.error(err.message),
    });
    const resetPasswordMutation = (0, react_query_1.useMutation)({
        mutationFn: async (data) => {
            const { data: json } = await axiosInstance_1.default.post('/api/auth/reset-password', { ...data, resetToken: data.resetToken || resetToken }, { requiresAuth: false });
            return { json, data };
        },
        onSuccess: ({ json }) => {
            react_hot_toast_1.default.success(json.message || 'تم إعادة تعيين كلمة المرور بنجاح!');
            timeoutRef.current = setTimeout(() => router.push('/auth/login'), 2000);
        },
        onError: (err) => react_hot_toast_1.default.error(err.message || 'خطأ في الخادم. الرجاء المحاولة مرة أخرى.'),
    });
    // ------------------- SUBMIT HANDLERS -------------------
    const onForgetSubmit = (data) => {
        setServerError(null);
        setSuccessMessage(null);
        forgetPasswordMutation.mutate(data);
    };
    const onResetSubmit = (data) => {
        setServerError(null);
        setSuccessMessage(null);
        resetPasswordMutation.mutate(data);
    };
    const handleOtpSubmit = () => {
        setServerError(null);
        verifyOtpMutation.mutate();
    };
    // ------------------- RENDER -------------------
    return ((0, jsx_runtime_1.jsx)("div", { className: "w-full min-h-screen flex items-center justify-center bg-gray-50 py-8", dir: "rtl", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-lg mx-auto p-8 shadow-lg border rounded-xl bg-white", children: [step === 1 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-3xl font-semibold mb-6 text-center text-gray-800", children: "\u0646\u0633\u064A\u062A \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 text-center mb-6 text-sm", children: "\u0623\u062F\u062E\u0644 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0633\u0646\u0631\u0633\u0644 \u0644\u0643 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642." }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit(onForgetSubmit), children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { className: "block mb-2 font-medium text-gray-700", children: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" }), (0, jsx_runtime_1.jsx)("input", { type: "email", placeholder: "\u0623\u062F\u062E\u0644 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A", ...register('email', { required: 'البريد الإلكتروني مطلوب' }), className: "border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500" }), errors.email?.message && ((0, jsx_runtime_1.jsx)("p", { className: "text-red-600 text-sm mt-2", children: String(errors.email.message) }))] }), serverError && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg", children: (0, jsx_runtime_1.jsx)("p", { className: "text-red-600 text-sm", children: serverError }) })), successMessage && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 p-3 bg-green-50 border border-green-200 rounded-lg", children: (0, jsx_runtime_1.jsx)("p", { className: "text-green-600 text-sm", children: successMessage }) })), (0, jsx_runtime_1.jsxs)("button", { type: "submit", disabled: forgetPasswordMutation.isPending, className: "w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg flex items-center justify-center font-medium text-lg transition-colors", children: [forgetPasswordMutation.isPending && ((0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "animate-spin ml-2" })), forgetPasswordMutation.isPending
                                            ? 'جاري الإرسال...'
                                            : 'إرسال رمز التحقق'] })] })] })), step === 2 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-3xl font-semibold mb-6 text-center text-gray-800", children: "\u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0631\u0645\u0632" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 text-center mb-8 text-sm", children: "\u0623\u062F\u062E\u0644 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0645\u0643\u0648\u0646 \u0645\u0646 4 \u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0630\u064A \u062A\u0645 \u0625\u0631\u0633\u0627\u0644\u0647 \u0625\u0644\u0649 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A." }), (0, jsx_runtime_1.jsx)("div", { className: "flex justify-center gap-4 dir-ltr", children: otp.map((digit, index) => ((0, jsx_runtime_1.jsx)("input", { type: "text", inputMode: "numeric", maxLength: 1, value: digit, onChange: (e) => handleOtpChange(index, e.target.value), onKeyDown: (e) => handleOtpKeyDown(index, e), onPaste: handleOtpPaste, ref: (el) => {
                                    inputsRefs.current[index] = el;
                                }, className: "w-14 h-14 text-center border-2 rounded-xl text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200", style: {
                                    direction: 'ltr',
                                    borderColor: digit ? '#3b82f6' : '#d1d5db',
                                    backgroundColor: '#f9fafb'
                                } }, index))) }), serverError && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg", children: (0, jsx_runtime_1.jsx)("p", { className: "text-red-600 text-sm text-center", children: serverError }) })), message && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 p-3 bg-green-50 border border-green-200 rounded-lg", children: (0, jsx_runtime_1.jsx)("p", { className: "text-green-600 text-sm text-center", children: message }) })), (0, jsx_runtime_1.jsxs)("button", { onClick: handleOtpSubmit, disabled: verifyOtpMutation.isPending, className: "w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg flex items-center justify-center font-medium text-lg mb-4 transition-colors", children: [verifyOtpMutation.isPending && ((0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "animate-spin ml-2" })), verifyOtpMutation.isPending ? 'جاري التحقق...' : 'تحقق من الرمز'] }), (0, jsx_runtime_1.jsx)("div", { className: "text-center", children: canResend ? ((0, jsx_runtime_1.jsx)("button", { onClick: () => resendOtpMutation.mutate(), className: "text-blue-500 hover:underline text-sm font-medium", children: "\u0625\u0639\u0627\u062F\u0629 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0645\u0632" })) : ((0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-600", children: ["\u0625\u0639\u0627\u062F\u0629 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0645\u0632 \u062E\u0644\u0627\u0644", ' ', (0, jsx_runtime_1.jsx)("span", { className: "text-blue-500 font-semibold", children: timer }), " \u062B\u0627\u0646\u064A\u0629"] })) })] })), step === 3 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-3xl font-semibold mb-6 text-center text-gray-800", children: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 text-center mb-6 text-sm", children: "\u0623\u0646\u0634\u0626 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u062C\u062F\u064A\u062F\u0629 \u0644\u062D\u0633\u0627\u0628\u0643." }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit(onResetSubmit), children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { className: "block mb-2 font-medium text-gray-700", children: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" }), (0, jsx_runtime_1.jsx)("input", { type: "email", placeholder: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A", ...register('email', { required: 'البريد الإلكتروني مطلوب' }), className: "border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500" }), errors.email?.message && ((0, jsx_runtime_1.jsx)("p", { className: "text-red-600 text-sm mt-2", children: String(errors.email.message) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { className: "block mb-2 font-medium text-gray-700", children: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: passwordVisible ? 'text' : 'password', placeholder: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629", ...register('newPassword', {
                                                        required: 'كلمة المرور الجديدة مطلوبة',
                                                    }), className: "border border-gray-300 rounded-lg px-4 py-3 w-full pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setPasswordVisible(!passwordVisible), className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800", children: passwordVisible ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 22 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 22 }) })] }), errors.newPassword?.message && ((0, jsx_runtime_1.jsx)("p", { className: "text-red-600 text-sm mt-2", children: String(errors.newPassword.message) }))] }), serverError && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg", children: (0, jsx_runtime_1.jsx)("p", { className: "text-red-600 text-sm", children: serverError }) })), successMessage && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 p-3 bg-green-50 border border-green-200 rounded-lg", children: (0, jsx_runtime_1.jsx)("p", { className: "text-green-600 text-sm", children: successMessage }) })), (0, jsx_runtime_1.jsxs)("button", { type: "submit", disabled: resetPasswordMutation.isPending, className: "w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg flex items-center justify-center font-medium text-lg transition-colors", children: [resetPasswordMutation.isPending && ((0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "animate-spin ml-2" })), resetPasswordMutation.isPending
                                            ? 'جاري إعادة التعيين...'
                                            : 'إعادة تعيين كلمة المرور'] })] })] }))] }) }));
};
exports.default = ForgetPasswordForm;
//# sourceMappingURL=ForgetPasswordForm.js.map