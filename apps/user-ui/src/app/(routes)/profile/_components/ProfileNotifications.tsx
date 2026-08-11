'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useUserNotifications, UserNotification } from '../../../../hooks/useUserNotifications';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from 'lucide-react';

// Get notification icon based on type
const getNotificationIcon = (type: string) => {
  const icons = {
    NEW_ORDER: {
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    PAYMENT_SUCCESS: {
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    PAYMENT_FAILED: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    ORDER_ISSUE: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
    },
    SYSTEM_ERROR: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
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
  notification: UserNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const router = useRouter();
  const { icon: Icon, color, bg } = getNotificationIcon(notification.type);

  const handleNotificationClick = () => {
    if (notification.redirectLink) {
      if (!notification.isRead) {
        onMarkAsRead(notification.id);
      }
      // Normalize old links that are missing /profile prefix
      const link = notification.redirectLink.startsWith('/orders/')
        ? `/profile${notification.redirectLink}`
        : notification.redirectLink;
      router.push(link);
    }
  };

  return (
    <div
      className={`group relative p-4 rounded-lg border transition-all duration-200 ${
        notification.redirectLink ? 'cursor-pointer hover:shadow-md' : ''
      } ${
        notification.isRead
          ? 'bg-white border-gray-200 hover:border-gray-300'
          : 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
      }`}
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
                <div className="flex items-center gap-1 text-xs text-blue-500 mt-1 hover:text-blue-700">
                  <ExternalLink className="h-3 w-3" />
                  <span>Click to view details</span>
                </div>
              )}
            </div>
            {!notification.isRead && (
              <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-2" />
            )}
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-gray-400">
              {format(new Date(notification.createdAt), 'MMM dd, yyyy • hh:mm a')}
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
              title="Mark as read"
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
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main ProfileNotifications component
const ProfileNotifications = () => {
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
  } = useUserNotifications();

  // Filter notifications
  const filteredNotifications = notifications.filter((notification: UserNotification) => {
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
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-8 w-32 bg-gray-200 rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-red-100 p-4 mb-4">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error loading notifications
        </h3>
        <p className="text-gray-600 mb-4">
          {(error as Error)?.message || 'Failed to load notifications'}
        </p>
        <button
          onClick={() => refetch()}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {unreadCount} unread, {readCount} read
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Mark all as read</span>
              <span className="xs:hidden">Mark all</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Clear all</span>
              <span className="xs:hidden">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter tabs - Scrollable on mobile */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap ${
              filter === 'unread'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap ${
              filter === 'read'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Read ({readCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
          <div className="rounded-full bg-gray-100 p-4 sm:p-6 mb-4">
            <Bell className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {searchQuery
              ? 'No notifications found'
              : filter === 'unread'
              ? 'No unread notifications'
              : filter === 'read'
              ? 'No read notifications'
              : 'No notifications yet'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'You will see your notifications here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
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
};

export default ProfileNotifications;