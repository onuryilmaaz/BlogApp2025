import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import toast from "react-hot-toast";

// Get all notifications
export const useNotifications = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["notifications", page, limit],
    queryFn: async () => {
      const response = await axiosInstance.get(
        API_PATHS.NOTIFICATIONS.GET_ALL,
        {
          params: { page, limit },
        }
      );
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
  });
};

// Get unread count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        API_PATHS.NOTIFICATIONS.GET_UNREAD_COUNT
      );
      return response.data;
    },
    staleTime: 10000, // 10 seconds
    cacheTime: 60000, // 1 minute
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Mark notification as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      const response = await axiosInstance.patch(
        API_PATHS.NOTIFICATIONS.MARK_AS_READ(notificationId)
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries(["notifications"]);
    },
    onError: (error) => {
      toast.error("Failed to mark notification as read");
      console.error("Error marking notification as read:", error);
    },
  });
};

// Mark all notifications as read
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.patch(
        API_PATHS.NOTIFICATIONS.MARK_ALL_AS_READ
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries(["notifications"]);
      toast.success("All notifications marked as read");
    },
    onError: (error) => {
      toast.error("Failed to mark all notifications as read");
      console.error("Error marking all notifications as read:", error);
    },
  });
};

// Delete notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      const response = await axiosInstance.delete(
        API_PATHS.NOTIFICATIONS.DELETE(notificationId)
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries(["notifications"]);
      toast.success("Notification deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete notification");
      console.error("Error deleting notification:", error);
    },
  });
};
