'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNotifications, Notification } from '../../../hooks/useNotifications';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

// Get notification icon based on type
const getNotificationIcon = (type: string) => {
  const icons = {
    order: {
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    payment: {
      icon: AlertCircle,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    refund: {
      icon: AlertCircle,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
    },
    error: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    info: {
      icon: Info,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    default: {
      icon: Bell,
      color: 'text-gray-500',
      bg: 'bg-gray-50',
    },
  };
  return icons[type as keyof typeof icons] || icons.default;
};

// Notification item component
const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const { icon: Icon, color, bg } = getNotificationIcon(notification.type);

  // Handle notification click to navigate to redirectLink
  const handleNotificationClick = () => {
    if (notification.redirectLink) {
      // Mark as read when clicked
      if (!notification.isRead) {
        onMarkAsRead(notification.id);
      }
      // Navigate to the redirect link
      window.open(notification.redirectLink, '_blank');
    }
  };

  return (
    <div
      className={`group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
        notification.isRead
          ? 'bg-white border-gray-200 hover:border-gray-300'
          : 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
      } ${notification.redirectLink ? 'hover:shadow-md' : ''}`}
      onClick={handleNotificationClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 rounded-full ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                className={`font-semibold text-sm ${
                  notification.isRead ? 'text-gray-700' : 'text-gray-900'
                } ${notification.redirectLink ? 'hover:text-blue-600' : ''}`}
              >
                {notification.title}
              </h4>
              <p
                className={`text-sm mt-1 ${
                  notification.isRead ? 'text-gray-500' : 'text-gray-600'
                }`}
              >
                {notification.message}
              </p>
              {notification.redirectLink && (
                <p className="text-xs text-blue-500 mt-1 hover:text-blue-700">
                  انقر لعرض التفاصيل ←
                </p>
              )}
            </div>
            {!notification.isRead && (
              <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-2" />
            )}
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-gray-400">
              {format(new Date(notification.createdAt), 'dd MMM yyyy • hh:mm a', { locale: ar })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
              title="تحديد كمقروء"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Notifications Page
export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    notifications,
    isLoading,
    isError,
    error,
    refetch,
    unreadCount,
    readCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  // Filter notifications
  const filteredNotifications = notifications.filter((notification: Notification) => {
    // Apply read/unread filter
    if (filter === 'unread' && notification.isRead) return false;
    if (filter === 'read' && !notification.isRead) return false;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Handle mark as read
  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  // Handle delete notification
  const handleDelete = (id: string) => {
    deleteNotification(id);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Handle clear all
  const handleClearAll = () => {
    clearAll();
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-700/50 rounded" />
          <div className="h-8 w-32 bg-gray-700/50 rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-700/30 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-red-500/20 p-4 mb-4">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          خطأ في تحميل الإشعارات
        </h3>
        <p className="text-gray-400 mb-4">
          {(error as Error)?.message || 'فشل في تحميل الإشعارات'}
        </p>
        <button
          onClick={() => refetch()}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الإشعارات</h1>
          <p className="text-gray-400 mt-1">
            {unreadCount} غير مقروءة، {readCount} مقروءة
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              تحديد الكل كمقروء
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              مسح الكل
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="البحث في الإشعارات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            الكل ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            غير مقروء ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'read'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            مقروء ({readCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-gray-800 p-6 mb-4">
            <Bell className="h-12 w-12 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchQuery
              ? 'لم يتم العثور على إشعارات'
              : filter === 'unread'
              ? 'لا توجد إشعارات غير مقروءة'
              : filter === 'read'
              ? 'لا توجد إشعارات مقروءة'
              : 'لا توجد إشعارات بعد'}
          </h3>
          <p className="text-gray-400">
            {searchQuery
              ? 'حاول تعديل مصطلحات البحث'
              : 'ستظهر إشعاراتك هنا'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
