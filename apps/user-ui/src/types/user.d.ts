export type UserRole = 'user' | 'admin';
export type AddressLabel = 'Home' | 'Work' | 'Other';
export interface Address {
    id: string;
    userId: string;
    label: AddressLabel;
    country: string;
    city: string;
    street: string;
    zipCode: string | null;
    phone: string | null;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface User {
    id: string;
    name: string | null;
    email: string | null;
    role: UserRole;
    isBanned: boolean;
    bannedAt: string | null;
    addresses?: Address[];
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=user.d.ts.map