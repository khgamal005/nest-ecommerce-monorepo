import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z
      .string()
      .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      .max(128, 'كلمة المرور طويلة جداً')
      .regex(/^\S+$/, 'كلمة المرور يجب أن لا تحتوي على مسافات'),
    confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
    address: z.object({
      label: z.enum(['Home', 'Work', 'Other']).default('Home'),
      country: z.string().min(1, 'الدولة مطلوبة'),
      city: z.string().min(1, 'المدينة مطلوبة'),
      street: z.string().min(1, 'الشارع مطلوب'),
      phone: z.string().min(1, 'رقم الهاتف مطلوب'),
      isDefault: z.boolean().default(true),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمة المرور غير متطابقة',
    path: ['confirmPassword'],
  });

export type RegisterFormInputs = z.infer<typeof registerSchema>;
