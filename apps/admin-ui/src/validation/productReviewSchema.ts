import { z } from 'zod';

export const reviewSchema = z.object({
  title: z.string(),
  short_description: z.string(),
  detailed_description: z.string(),
  brand: z.string().optional(),
  categoryId: z.string().optional(),
  slug: z.string().optional(),
  warranty: z.string().optional(),
  cashOnDelivery: z.enum(['yes', 'no']).optional(),
  isReturnable: z.boolean().optional(),
  tags: z.string().optional(),
  hasVariants: z.boolean().optional(),
  starting_date: z.string().optional().nullable(),
  ending_date: z.string().optional().nullable(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
