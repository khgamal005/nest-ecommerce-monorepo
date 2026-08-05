import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    address: z.ZodObject<{
        label: z.ZodDefault<z.ZodEnum<{
            Home: "Home";
            Work: "Work";
            Other: "Other";
        }>>;
        country: z.ZodString;
        city: z.ZodString;
        street: z.ZodString;
        phone: z.ZodString;
        isDefault: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type RegisterFormInputs = z.infer<typeof registerSchema>;
//# sourceMappingURL=registerSchema.d.ts.map