import React, { useState, useRef, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "../../hooks/useNotifications";
import { LuBell, LuX, LuCheck, LuTrash2, LuCheckCheck } from "react-icons/lu";
import { formatDistanceToNow } from "date-fns";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications: socketNotifications,
    unreadCount,
    markNotificationAsRead,
  } = useSocket();
  const { data: notificationsData, isLoading } = useNotifications(1, 10);
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      markNotificationAsRead(notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "comment":
        return "💬";
      case "like":
        return "❤️";
      case "admin_action":
        return "⚡";
      case "system":
        return "🔔";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "comment":
        return "bg-blue-50 border-blue-200";
      case "like":
        return "bg-red-50 border-red-200";
      case "admin_action":
        return "bg-yellow-50 border-yellow-200";
      case "system":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  // Combine socket notifications with API notifications
  const allNotifications = [
    ...socketNotifications,
    ...(notificationsData?.notifications || []),
  ].slice(0, 10); // Show only latest 10

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
      >
        <LuBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <LuCheckCheck className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">
                  Loading notifications...
                </p>
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <LuBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {allNotifications.map((notification) => (
                  <div
                    key={notification.id || notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.isRead && (
                              <button
                                onClick={() =>
                                  handleMarkAsRead(
                                    notification.id || notification._id
                                  )
                                }
                                disabled={markAsReadMutation.isPending}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                title="Mark as read"
                              >
                                <LuCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleDeleteNotification(
                                  notification.id || notification._id
                                )
                              }
                              disabled={deleteNotificationMutation.isPending}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                              title="Delete notification"
                            >
                              <LuTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {allNotifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
