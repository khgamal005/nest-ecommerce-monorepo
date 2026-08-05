"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    email: zod_1.z.string().email('البريد الإلكتروني غير صالح'),
    password: zod_1.z
        .string()
        .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .max(128, 'كلمة المرور طويلة جداً')
        .regex(/^\S+$/, 'كلمة المرور يجب أن لا تحتوي على مسافات'),
    confirmPassword: zod_1.z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
    address: zod_1.z.object({
        label: zod_1.z.enum(['Home', 'Work', 'Other']).default('Home'),
        country: zod_1.z.string().min(1, 'الدولة مطلوبة'),
        city: zod_1.z.string().min(1, 'المدينة مطلوبة'),
        street: zod_1.z.string().min(1, 'الشارع مطلوب'),
        phone: zod_1.z.string().min(1, 'رقم الهاتف مطلوب'),
        isDefault: zod_1.z.boolean().default(true),
    }),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمة المرور غير متطابقة',
    path: ['confirmPassword'],
});
//# sourceMappingURL=registerSchema.js.map