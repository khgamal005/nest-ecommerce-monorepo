export type UserRole = 'customer' | 'admin' | 'staff';
export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    createdAt: string;
}
//# sourceMappingURL=user.types.d.ts.map