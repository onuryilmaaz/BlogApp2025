import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useUserStore from "../stores/userStore";

const PrivateRoute = ({ allowedRoles }) => {
  const user = useUserStore((state) => state.user);
  const loading = useUserStore((state) => state.loading);
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
