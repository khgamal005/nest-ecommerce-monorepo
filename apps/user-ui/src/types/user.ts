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
  orders?: any[];
  createdAt: string;
  updatedAt: string;
}
