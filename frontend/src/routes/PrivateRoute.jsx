import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import useUserStore from "../stores/userStore";

const PrivateRoute = ({ allowedRoles, children }) => {
  const user = useUserStore((state) => state.user);
  const loading = useUserStore((state) => state.loading);

  useEffect(() => {
    // Show toast when user tries to access admin routes without permission
    if (!loading && user && !allowedRoles.includes(user.role)) {
      toast.error("Bu sayfaya erişim yetkiniz bulunmamaktadır!", {
        duration: 4000,
        style: {
          background: "#ef4444",
          color: "#fff",
        },
      });
    }

    // Show toast when non-logged user tries to access protected routes
    if (!loading && !user) {
      toast.error("Bu sayfaya erişmek için giriş yapmanız gerekiyor!", {
        duration: 4000,
        style: {
          background: "#f59e0b",
          color: "#fff",
        },
      });
    }
  }, [user, loading, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

export default PrivateRoute;
