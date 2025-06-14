import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 30 minutes by default to reduce API calls
      staleTime: 30 * 60 * 1000,
      // Keep data in cache for 1 hour
      cacheTime: 60 * 60 * 1000,
      // Very conservative retry for rate limiting
      retry: (failureCount, error) => {
        // For 429 errors, let axios handle retries
        if (error?.response?.status === 429) {
          return false;
        }
        // Don't retry on other 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 2 times for server errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 30000),
      // Disable all automatic refetching to reduce API calls
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      // Global error handling
      onError: (error) => {
        console.error("🚨 React Query Error:", error);
        if (error.message && error.message.includes("primitive value")) {
          console.error("🔥 PRIMITIVE VALUE ERROR IN QUERY:", error);
        }
      },
    },
    mutations: {
      // Retry failed mutations once with delay
      retry: (failureCount, error) => {
        if (
          error?.response?.status >= 400 &&
          error?.response?.status < 500 &&
          error?.response?.status !== 429
        ) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: 1000,
      // Global mutation error handling
      onError: (error) => {
        console.error("🚨 React Query Mutation Error:", error);
        if (error.message && error.message.includes("primitive value")) {
          console.error("🔥 PRIMITIVE VALUE ERROR IN MUTATION:", error);
        }
      },
    },
  },
});

// Query keys for consistent cache management
export const queryKeys = {
  // Posts
  posts: {
    all: ["posts"],
    trending: ["posts", "trending"],
    bySlug: (slug) => ["posts", "slug", slug],
    byTag: (tag) => ["posts", "tag", tag],
    search: (query) => ["posts", "search", query],
  },
  // Comments
  comments: {
    all: ["comments"],
    byPost: (postId) => ["comments", "post", postId],
  },
  // User
  user: {
    profile: ["user", "profile"],
  },
  // Dashboard
  dashboard: {
    summary: ["dashboard", "summary"],
  },
};
