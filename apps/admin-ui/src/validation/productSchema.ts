import { z } from 'zod';

export const productSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  short_description: z.string().min(1, 'الوصف المختصر مطلوب'),
  detailed_description: z.string().min(1, 'الوصف التفصيلي مطلوب'),
  brandId: z.string().nullable(),
  brandName: z.string().nullable(),
  categoryId: z.string().min(1, 'التصنيف مطلوب'),
  sku: z.string(),
  slug: z
    .string()
    .min(1, 'الرابط مطلوب')
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'الرابط يجب أن يكون أحرف إنجليزية صغيرة وأرقام وشرطات فقط',
    }),
  cashOnDelivery: z.string(),
  isReturnable: z.boolean(),
  tags: z.string(),
  hasVariants: z.boolean(),
  warranty: z.string(),
});

export type ProductFormData = z.infer<typeof productSchema>;
