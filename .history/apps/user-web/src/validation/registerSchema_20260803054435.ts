import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .max(128, 'كلمة المرور طويلة جداً')
    .regex(/^\S+$/, 'كلمة المرور يجب أن لا تحتوي على مسافات'),
  address: z.object({
    country: z.string().min(1, 'الدولة مطلوبة'),
    city: z.string().min(1, 'المدينة مطلوبة'),
    street: z.string().min(1, 'الشارع مطلوب'),
    zipCode: z.string().optional(),
    phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  }),
});

export type RegisterFormInputs = z.infer<typeof registerSchema>;
