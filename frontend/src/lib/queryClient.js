/* eslint-disable no-unused-vars */
import { QueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Enhanced QueryClient with optimized caching and error handling
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimized cache timing based on data type
      staleTime: 5 * 60 * 1000, // 5 minutes - more aggressive for better UX
      gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime)

      // Smart retry logic
      retry: (failureCount, error) => {
        const status = error?.response?.status;

        // Don't retry client errors (except 429)
        if (status >= 400 && status < 500 && status !== 429) {
          return false;
        }

        // Don't retry network errors more than 2 times
        if (error?.code === "NETWORK_ERROR" && failureCount >= 2) {
          return false;
        }

        // Retry server errors up to 3 times
        return failureCount < 3;
      },

      // Exponential backoff with jitter
      retryDelay: (attemptIndex, error) => {
        const baseDelay = Math.min(1000 * 2 ** attemptIndex, 30000);
        const jitter = Math.random() * 1000;

        // Special handling for rate limiting
        if (error?.response?.status === 429) {
          const retryAfter = error.response.headers["retry-after"];
          return retryAfter ? parseInt(retryAfter) * 1000 : baseDelay + jitter;
        }

        return baseDelay + jitter;
      },

      // Smart refetching based on context
      refetchOnWindowFocus: (query) => {
        // Only refetch critical data on focus
        const criticalQueries = ["user", "notifications"];
        return criticalQueries.some((key) => query.queryKey.includes(key));
      },

      refetchOnReconnect: true, // Always refetch on reconnect
      refetchOnMount: (query) => {
        // Refetch if data is older than 2 minutes
        return Date.now() - query.state.dataUpdatedAt > 2 * 60 * 1000;
      },

      // Enhanced error handling
      onError: (error, query) => {
        console.error("🚨 React Query Error:", {
          error: error.message,
          queryKey: query.queryKey,
          status: error?.response?.status,
          timestamp: new Date().toISOString(),
        });

        // Handle specific error types
        if (error?.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem("token");
          window.location.href = "/admin-login";
          return;
        }

        if (error?.response?.status === 403) {
          toast.error(
            "Access denied. You do not have permission for this action."
          );
          return;
        }

        if (error?.response?.status >= 500) {
          toast.error("Server error. Please try again later.");
          return;
        }

        // Network errors
        if (error?.code === "NETWORK_ERROR") {
          toast.error("Network error. Please check your connection.");
          return;
        }

        // Generic error for unhandled cases
        if (!error?.response?.data?.message) {
          toast.error("Something went wrong. Please try again.");
        }
      },
    },

    mutations: {
      // More aggressive retry for mutations
      retry: (failureCount, error) => {
        const status = error?.response?.status;

        // Don't retry client errors (except network issues)
        if (status >= 400 && status < 500 && status !== 429) {
          return false;
        }

        // Retry network errors and server errors
        return failureCount < 2;
      },

      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

      // Enhanced mutation error handling
      onError: (error, variables, context) => {
        console.error("🚨 React Query Mutation Error:", {
          error: error.message,
          variables,
          status: error?.response?.status,
          timestamp: new Date().toISOString(),
        });

        // Let individual mutations handle their own error toasts
        // This is just for logging and critical error handling

        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/admin-login";
        }
      },
    },
  },
});

// Comprehensive query keys for consistent cache management
export const queryKeys = {
  // Posts
  posts: {
    all: ["posts"],
    lists: () => [...queryKeys.posts.all, "list"],
    list: (filters) => [...queryKeys.posts.lists(), filters],
    details: () => [...queryKeys.posts.all, "detail"],
    detail: (id) => [...queryKeys.posts.details(), id],
    bySlug: (slug) => [...queryKeys.posts.details(), "slug", slug],
    byTag: (tag, filters = {}) => [...queryKeys.posts.all, "tag", tag, filters],
    search: (query, filters = {}) => [
      ...queryKeys.posts.all,
      "search",
      query,
      filters,
    ],
    trending: (limit = 10) => [...queryKeys.posts.all, "trending", limit],
    popular: (period = "week") => [...queryKeys.posts.all, "popular", period],
    drafts: (filters = {}) => [...queryKeys.posts.all, "drafts", filters],
    pending: (filters = {}) => [...queryKeys.posts.all, "pending", filters],
  },

  // Comments
  comments: {
    all: ["comments"],
    lists: () => [...queryKeys.comments.all, "list"],
    list: (filters) => [...queryKeys.comments.lists(), filters],
    byPost: (postId, filters = {}) => [
      ...queryKeys.comments.all,
      "post",
      postId,
      filters,
    ],
    byUser: (userId, filters = {}) => [
      ...queryKeys.comments.all,
      "user",
      userId,
      filters,
    ],
    pending: (filters = {}) => [...queryKeys.comments.all, "pending", filters],
  },

  // Users
  users: {
    all: ["users"],
    lists: () => [...queryKeys.users.all, "list"],
    list: (filters) => [...queryKeys.users.lists(), filters],
    details: () => [...queryKeys.users.all, "detail"],
    detail: (id) => [...queryKeys.users.details(), id],
    profile: () => [...queryKeys.users.all, "profile"],
    current: () => [...queryKeys.users.profile(), "current"],
  },

  // Tags
  tags: {
    all: ["tags"],
    lists: () => [...queryKeys.tags.all, "list"],
    list: (filters) => [...queryKeys.tags.lists(), filters],
    details: () => [...queryKeys.tags.all, "detail"],
    detail: (name) => [...queryKeys.tags.details(), name],
    popular: (limit = 10) => [...queryKeys.tags.all, "popular", limit],
    trending: (limit = 10) => [...queryKeys.tags.all, "trending", limit],
    suggestions: (query) => [...queryKeys.tags.all, "suggestions", query],
    stats: () => [...queryKeys.tags.all, "stats"],
  },

  // Notifications
  notifications: {
    all: ["notifications"],
    lists: () => [...queryKeys.notifications.all, "list"],
    list: (filters) => [...queryKeys.notifications.lists(), filters],
    unreadCount: () => [...queryKeys.notifications.all, "unread-count"],
  },

  // Dashboard
  dashboard: {
    all: ["dashboard"],
    summary: () => [...queryKeys.dashboard.all, "summary"],
    analytics: (period = "week") => [
      ...queryKeys.dashboard.all,
      "analytics",
      period,
    ],
    stats: () => [...queryKeys.dashboard.all, "stats"],
  },

  // Search
  search: {
    all: ["search"],
    posts: (query, filters = {}) => [
      ...queryKeys.search.all,
      "posts",
      query,
      filters,
    ],
    suggestions: (query) => [...queryKeys.search.all, "suggestions", query],
    popular: () => [...queryKeys.search.all, "popular"],
    analytics: (period = "week") => [
      ...queryKeys.search.all,
      "analytics",
      period,
    ],
  },

  // Auth
  auth: {
    all: ["auth"],
    user: () => [...queryKeys.auth.all, "user"],
    permissions: () => [...queryKeys.auth.all, "permissions"],
  },
};

// Cache invalidation helpers
export const invalidateQueries = {
  // Invalidate all posts
  allPosts: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),

  // Invalidate specific post
  post: (id) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(id) }),

  // Invalidate posts by tag
  postsByTag: (tag) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.byTag(tag) }),

  // Invalidate all comments
  allComments: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.comments.all }),

  // Invalidate comments for a post
  postComments: (postId) =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.comments.byPost(postId),
    }),

  // Invalidate all tags
  allTags: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.tags.all }),

  // Invalidate notifications
  notifications: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),

  // Invalidate user data
  user: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.users.current() }),

  // Invalidate dashboard
  dashboard: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
};

// Prefetch helpers for better UX
export const prefetchQueries = {
  // Prefetch popular posts
  popularPosts: () =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.posts.popular(),
      staleTime: 10 * 60 * 1000, // 10 minutes
    }),

  // Prefetch trending tags
  trendingTags: () =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.tags.trending(),
      staleTime: 15 * 60 * 1000, // 15 minutes
    }),

  // Prefetch user notifications
  notifications: () =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.notifications.unreadCount(),
      staleTime: 1 * 60 * 1000, // 1 minute
    }),
};
