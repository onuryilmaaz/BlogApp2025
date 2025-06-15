import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { API_PATHS } from "../utils/apiPaths";
import { apiRequest } from "../utils/apiRequest";
import { queryKeys, invalidateQueries } from "../lib/queryClient";

// Get all posts with pagination and filtering
export const useBlogPosts = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value);
        }
      });

      const url = `${API_PATHS.POSTS.GET_ALL}?${params.toString()}`;
      const response = await apiRequest(url);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for post lists
    gcTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true, // Keep previous data while fetching new
  });
};

// Infinite query for posts (for infinite scroll)
export const useInfiniteBlogPosts = (filters = {}) => {
  return useInfiniteQuery({
    queryKey: [...queryKeys.posts.list(filters), "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        ...filters,
        page: pageParam,
        limit: filters.limit || 10,
      });

      const url = `${API_PATHS.POSTS.GET_ALL}?${params.toString()}`;
      const response = await apiRequest(url);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Get single post by slug or ID
export const useBlogPost = (identifier, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.posts.bySlug(identifier),
    queryFn: async () => {
      const response = await apiRequest(
        API_PATHS.POSTS.GET_BY_SLUG(identifier)
      );
      return response.data;
    },
    enabled: enabled && !!identifier,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual posts
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry 404s for posts
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

// Get posts by tag
export const usePostsByTag = (tagName, filters = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.byTag(tagName, filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const url = `${API_PATHS.POSTS.GET_BY_TAG(tagName)}?${params.toString()}`;
      const response = await apiRequest(url);
      return response.data;
    },
    enabled: !!tagName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Search posts
export const useSearchPosts = (query, filters = {}, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.posts.search(query, filters),
    queryFn: async () => {
      if (!query || query.length < 2) return { posts: [], total: 0 };

      const params = new URLSearchParams({
        q: query,
        ...filters,
      });

      const url = `${API_PATHS.POSTS.SEARCH}?${params.toString()}`;
      const response = await apiRequest(url);
      return response.data;
    },
    enabled: enabled && !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get trending posts
export const useTrendingPosts = (limit = 10) => {
  return useQuery({
    queryKey: queryKeys.posts.trending(limit),
    queryFn: async () => {
      const response = await apiRequest(
        `${API_PATHS.POSTS.GET_TRENDING}?limit=${limit}`
      );
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes for trending
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Get popular posts
export const usePopularPosts = (period = "week", limit = 10) => {
  return useQuery({
    queryKey: queryKeys.posts.popular(period),
    queryFn: async () => {
      const response = await apiRequest(
        `${API_PATHS.POSTS.GET_POPULAR}?period=${period}&limit=${limit}`
      );
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes for popular posts
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

// Create new post
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData) => {
      const response = await apiRequest(API_PATHS.POSTS.CREATE, {
        method: "POST",
        data: postData,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      invalidateQueries.allPosts();
      invalidateQueries.dashboard();

      // Add to cache optimistically
      queryClient.setQueryData(queryKeys.posts.bySlug(data.slug), data);

      toast.success("Post created successfully!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to create post";
      toast.error(message);
    },
  });
};

// Update post
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, updateData }) => {
      const response = await apiRequest(`${API_PATHS.POSTS.UPDATE}/${postId}`, {
        method: "PUT",
        data: updateData,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update specific post in cache
      queryClient.setQueryData(queryKeys.posts.bySlug(data.slug), data);

      // Invalidate lists to reflect changes
      invalidateQueries.allPosts();

      toast.success("Post updated successfully!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to update post";
      toast.error(message);
    },
  });
};

// Delete post
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId) => {
      const response = await apiRequest(`${API_PATHS.POSTS.DELETE}/${postId}`, {
        method: "DELETE",
      });
      return response.data;
    },
    onSuccess: (data, postId) => {
      // Remove from all relevant caches
      queryClient.removeQueries({
        queryKey: queryKeys.posts.details(),
        exact: false,
      });

      // Invalidate lists
      invalidateQueries.allPosts();
      invalidateQueries.dashboard();

      toast.success("Post deleted successfully!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to delete post";
      toast.error(message);
    },
  });
};

// Like/Unlike post
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId) => {
      const response = await apiRequest(`${API_PATHS.POSTS.LIKE}/${postId}`, {
        method: "POST",
      });
      return response.data;
    },
    onMutate: async (postId) => {
      // Optimistic update
      const queryKey = queryKeys.posts.details();

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous values
      const previousPosts = queryClient.getQueriesData({ queryKey });

      // Optimistically update
      queryClient.setQueriesData({ queryKey }, (old) => {
        if (old && old._id === postId) {
          return {
            ...old,
            likes: old.isLiked ? old.likes - 1 : old.likes + 1,
            isLiked: !old.isLiked,
          };
        }
        return old;
      });

      return { previousPosts };
    },
    onError: (error, postId, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      const message = error.response?.data?.message || "Failed to like post";
      toast.error(message);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.details(),
        exact: false,
      });
    },
  });
};

// Increment view count
export const useIncrementView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId) => {
      const response = await apiRequest(
        `${API_PATHS.POSTS.INCREMENT_VIEW}/${postId}`,
        {
          method: "POST",
        }
      );
      return response.data;
    },
    onSuccess: (data, postId) => {
      // Update view count in cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.posts.details(), exact: false },
        (old) => {
          if (old && old._id === postId) {
            return { ...old, views: old.views + 1 };
          }
          return old;
        }
      );
    },
    // Don't show error toasts for view increments
    onError: () => {},
  });
};

// Review post (approve/reject)
export const useReviewPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, approve }) => {
      const response = await apiRequest(`${API_PATHS.POSTS.REVIEW}/${postId}`, {
        method: "PUT",
        data: { approve },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate pending posts and all posts
      invalidateQueries.allPosts();
      invalidateQueries.dashboard();

      const action = variables.approve ? "approved" : "rejected";
      toast.success(`Post ${action} successfully!`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to review post";
      toast.error(message);
    },
  });
};

// Prefetch related posts
export const usePrefetchRelatedPosts = () => {
  const queryClient = useQueryClient();

  return {
    prefetchByTag: (tagName) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.posts.byTag(tagName, { limit: 5 }),
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    },

    prefetchTrending: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.posts.trending(5),
        staleTime: 15 * 60 * 1000, // 15 minutes
      });
    },

    prefetchPopular: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.posts.popular("week"),
        staleTime: 30 * 60 * 1000, // 30 minutes
      });
    },
  };
};
