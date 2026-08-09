// hooks/useNotifications.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';

// Define the Notification type
export type Notification = {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  redirectLink?: string; // Add redirectLink field
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  data?: any;
};

// Fetch notifications
const fetchNotifications = async (): Promise<Notification[]> => {
  const res = await axiosInstance.get('/api/notifications');
  const data = res.data;
  return Array.isArray(data) ? data : (data?.notifications ?? []);
};

// Mark notification as read
const markNotificationAsRead = async (id: string): Promise<void> => {
  await axiosInstance.patch(`/api/notifications/${id}`, { isRead: true });
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (): Promise<void> => {
  await axiosInstance.patch('/api/notifications/mark-all-read');
};

// Delete notification
const deleteNotification = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/notifications/${id}`);
};

// Clear all notifications
const clearAllNotifications = async (): Promise<void> => {
  await axiosInstance.delete('/api/notifications/clear-all');
};

// Custom hook for notifications
export const useNotifications = () => {
  const queryClient = useQueryClient();

  // Fetch notifications query
  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: fetchNotifications,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  // Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  // Helper functions
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

export default useNotifications;
