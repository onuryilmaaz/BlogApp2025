/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useEffect, useState } from "react";
// import { io } from "socket.io-client";
import useUserStore from "../stores/userStore";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Use userStore instead of AuthContext
  const user = useUserStore((state) => state.user);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {}, [user, token]);

  const joinPostRoom = (postId) => {
    // if (socket && isConnected) {
    //   socket.emit("join_post", postId);
    // }
  };

  const leavePostRoom = (postId) => {
    // if (socket && isConnected) {
    //   socket.emit("leave_post", postId);
    // }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    joinPostRoom,
    leavePostRoom,
    markNotificationAsRead,
    clearAllNotifications,
    setUnreadCount,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
