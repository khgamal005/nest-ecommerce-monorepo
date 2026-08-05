import { AxiosRequestConfig } from 'axios';
export interface CustomAxiosInstanceConfig extends AxiosRequestConfig {
    requiresAuth?: boolean;
    _retry?: boolean;
}
//# sourceMappingURL=axiosinstance.type.d.ts.map