// hooks/useUserNotifications.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';

export type UserNotification = {
  id: string;
  creatorId?: string;
  recipientId?: string;
  recipientRole?: string;
  type: string;
  title: string;
  message: string;
  redirectLink?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

const fetchUserNotifications = async (): Promise<UserNotification[]> => {
  const res = await axiosInstance.get('/user/api/user/notifications');
  return res.data.data;
};

const markNotificationAsRead = async (id: string): Promise<void> => {
  await axiosInstance.patch(`/user/api/user/notification/${id}/read`);
};

const markAllNotificationsAsRead = async (): Promise<void> => {
  await axiosInstance.patch('/user/api/user/notifications/mark-all-read');
};

const deleteNotification = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/user/api/user/notification/${id}`);
};

const clearAllNotifications = async (): Promise<void> => {
  await axiosInstance.delete('/user/api/user/notifications/clear-all');
};

export const useUserNotifications = () => {
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-notifications'],
    queryFn: fetchUserNotifications,
    staleTime: 2 * 60 * 1000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-notifications'] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-notifications'] }),
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  return {
    notifications,
    isLoading,
    isError,
    error,
    refetch,
    unreadCount,
    readCount,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: string) => deleteMutation.mutate(id),
    clearAll: () => clearAllMutation.mutate(),
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isClearingAll: clearAllMutation.isPending,
  };
};

export default useUserNotifications;
