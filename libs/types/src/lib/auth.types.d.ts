import { User } from './user.types';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface LoginResponse extends AuthTokens {
    user: User;
}
//# sourceMappingURL=auth.types.d.ts.map