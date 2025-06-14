import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import BlogLandingPage from "./pages/Blog/BlogLandingPage";
import BlogPostView from "./pages/Blog/BlogPostView";
import PostByTags from "./pages/Blog/PostByTags";
import SearchPosts from "./pages/Blog/SearchPosts";
import useUserStore from "./stores/userStore";
import axiosInstance from "./utils/axiosInstance";
import { API_PATHS } from "./utils/apiPaths";

// Lazy load admin components for better performance
const AdminLogin = lazy(() => import("./pages/Admin/AdminLogin"));
const Dashboard = lazy(() => import("./pages/Admin/Dashboard"));
const BlogPosts = lazy(() => import("./pages/Admin/BlogPosts"));
const BlogPostEditor = lazy(() => import("./pages/Admin/BlogPostEditor"));
const Comments = lazy(() => import("./pages/Admin/Comments"));

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
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_USER_INFO);
        setUser(response.data);
        console.log("✅ User initialized:", response.data);
      } catch (error) {
        console.error("❌ Failed to initialize user:", error);
        clearUser();
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
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <UserInitializer />
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

                {/* Admin Routes */}
                <Route element={<PrivateRoute allowedRoles={["Admin"]} />} />
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/posts" element={<BlogPosts />} />
                <Route path="/admin/create" element={<BlogPostEditor />} />
                <Route
                  path="/admin/edit/:postSlug"
                  element={<BlogPostEditor isEdit={true} />}
                />
                <Route path="/admin/comments" element={<Comments />} />
                <Route />

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

        {/* Development tools */}
        {import.meta.env.MODE === "development" && (
          <Suspense fallback={null}>
            <PerformanceMonitor />
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
