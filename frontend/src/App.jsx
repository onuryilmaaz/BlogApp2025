import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import cacheOptimization from "./utils/cacheOptimization";
import BlogLandingPage from "./pages/Blog/BlogLandingPage";
import BlogPostView from "./pages/Blog/BlogPostView";
import PostByTags from "./pages/Blog/PostByTags";
import SearchPosts from "./pages/Blog/SearchPosts";
import useUserStore from "./stores/userStore";
import axiosInstance from "./utils/axiosInstance";
import { API_PATHS } from "./utils/apiPaths";
import { SocketProvider } from "./contexts/SocketContext";

// Lazy load admin components for better performance
const AdminLogin = lazy(() => import("./pages/Admin/AdminLogin"));
const Dashboard = lazy(() => import("./pages/Admin/Dashboard"));
const BlogPosts = lazy(() => import("./pages/Admin/BlogPosts"));
const BlogPostEditor = lazy(() => import("./pages/Admin/BlogPostEditor"));
const Comments = lazy(() => import("./pages/Admin/Comments"));
const UserManagement = lazy(() => import("./pages/Admin/UserManagement"));

// Lazy load auth components
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/Auth/ResetPassword"));

// Lazy load user components
const UserProfile = lazy(() => import("./pages/User/UserProfile"));

import PrivateRoute from "./routes/PrivateRoute";

// Development components
const PerformanceMonitor = lazy(() =>
  import("./components/dev/PerformanceMonitor")
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    // Only show error boundary for critical errors, not loading/network issues
    if (
      error.message &&
      (error.message.includes("Loading") ||
        error.message.includes("Network") ||
        error.message.includes("fetch") ||
        error.message.includes("timeout") ||
        error.message.includes("Failed to resolve import"))
    ) {
      // For loading/network errors, just log and let components handle it
      console.warn(
        "🔄 Network/Loading error handled by component:",
        error.message
      );
      // Don't show error boundary for these cases
      setTimeout(() => {
        this.setState({ hasError: false });
      }, 100);
      return;
    }

    // Log specific primitive value errors
    if (error.message && error.message.includes("primitive value")) {
      console.error("🚨 PRIMITIVE VALUE ERROR:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                An error occurred while loading the application.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// User Initialization Component
const UserInitializer = () => {
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const setLoading = useUserStore((state) => state.setLoading);

  useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        // Warm cache for public content
        cacheOptimization.warmCache.popular();
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_USER_INFO);
        setUser(response.data);

        // Warm cache for authenticated user
        if (response.data.role === "Admin") {
          cacheOptimization.warmCache.dashboard();
        }
        cacheOptimization.warmCache.popular();
      } catch (error) {
        console.error("❌ Failed to initialize user:", error);
        clearUser();
        // Still warm public cache on error
        cacheOptimization.warmCache.popular();
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [setUser, clearUser, setLoading]);

  return null; // This component doesn't render anything
};

const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <UserInitializer />
          <SocketProvider>
            <div>
              <Router>
                <Suspense
                  fallback={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                  }
                >
                  <Routes>
                    {/* Default Route */}
                    <Route path="/" element={<BlogLandingPage />} />
                    <Route path="/:slug" element={<BlogPostView />} />
                    <Route path="/tag/:tagName" element={<PostByTags />} />
                    <Route path="/search" element={<SearchPosts />} />

                    {/* Auth Routes */}
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* User Routes */}
                    <Route
                      path="/profile"
                      element={
                        <PrivateRoute allowedRoles={["Admin", "Member"]}>
                          <UserProfile />
                        </PrivateRoute>
                      }
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin/dashboard"
                      element={
                        <PrivateRoute allowedRoles={["Admin"]}>
                          <Dashboard />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/admin/posts"
                      element={
                        <PrivateRoute allowedRoles={["Admin"]}>
                          <BlogPosts />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <PrivateRoute allowedRoles={["Admin"]}>
                          <UserManagement />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/admin/create"
                      element={
                        <PrivateRoute allowedRoles={["Admin"]}>
                          <BlogPostEditor />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/admin/edit/:postSlug"
                      element={
                        <PrivateRoute allowedRoles={["Admin"]}>
                          <BlogPostEditor isEdit={true} />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/admin/comments"
                      element={
                        <PrivateRoute allowedRoles={["Admin"]}>
                          <Comments />
                        </PrivateRoute>
                      }
                    />

                    {/* Catch-all admin route */}
                    <Route
                      path="/admin"
                      element={
                        <PrivateRoute allowedRoles={["Admin"]}>
                          <Dashboard />
                        </PrivateRoute>
                      }
                    />

                    <Route path="/admin-login" element={<AdminLogin />} />
                  </Routes>
                </Suspense>
              </Router>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "oklch(0.723 0.219 149.579)",
                    color: "#fff",
                  },
                }}
              />
            </div>
          </SocketProvider>

          {/* Development tools */}
          {import.meta.env.MODE === "development" && (
            <Suspense fallback={null}>
              <PerformanceMonitor />
              <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
          )}
        </ErrorBoundary>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
