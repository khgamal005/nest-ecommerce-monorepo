import { AxiosInstance } from 'axios';
declare module 'axios' {
    interface AxiosRequestConfig {
        requiresAuth?: boolean;
    }
}
declare const axiosInstance: AxiosInstance;
export default axiosInstance;
//# sourceMappingURL=axiosInstance.d.ts.map