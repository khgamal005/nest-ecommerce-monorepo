import { CustomAxiosInstanceConfig } from './axiosinstance.type';

export const isProtected: CustomAxiosInstanceConfig = {
  requiresAuth: true,
};
