import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { queryKeys } from "../lib/queryClient";
import { blogPostResponseSchema } from "../lib/schemas";
import { localStorageCache } from "../utils/localStorageCache";
import toast from "react-hot-toast";

// Get all posts
export const usePosts = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.all,
    queryFn: async () => {
      try {
        // Try to get from localStorage cache first
        const cacheKey = "posts_all";
        const cachedData = localStorageCache.get(cacheKey);
        if (cachedData) {
          console.log("📦 Using cached posts data");
          return cachedData;
        }

        console.log("🌐 Fetching posts from API...");
        const response = await axiosInstance.get(API_PATHS.POSTS.GET_ALL);
        console.log("Posts API Response:", response.data);

        // Handle paginated response structure
        const postsData = response.data.posts || response.data;

        // Safely validate response data
        if (!postsData || !Array.isArray(postsData)) {
          console.warn("Invalid posts data structure:", response.data);
          return [];
        }

        const validatedPosts = postsData.map((post, index) => {
          try {
            return blogPostResponseSchema.parse(post);
          } catch (validationError) {
            console.warn(
              `Post validation failed at index ${index}:`,
              validationError,
              post
            );
            // Return the post without validation for now
            return post;
          }
        });

        // Cache the validated data for 1 hour
        localStorageCache.set(cacheKey, validatedPosts, 60 * 60 * 1000);

        return validatedPosts;
      } catch (error) {
        console.error("Posts fetch error:", error);

        // Try to return cached data even if expired as fallback
        const fallbackData = localStorageCache.get("posts_all");
        if (fallbackData) {
          console.log("🔄 Using expired cache as fallback");
          return fallbackData;
        }

        throw error;
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour - aggressive caching to avoid rate limits
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
    ...options,
  });
};

// Get trending posts
export const useTrendingPosts = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.trending,
    queryFn: async () => {
      try {
        // Try to get from localStorage cache first
        const cacheKey = "posts_trending";
        const cachedData = localStorageCache.get(cacheKey);
        if (cachedData) {
          console.log("📦 Using cached trending posts data");
          return cachedData;
        }

        console.log("🌐 Fetching trending posts from API...");
        const response = await axiosInstance.get(
          API_PATHS.POSTS.GET_TRENDING_POST
        );
        console.log("Trending Posts API Response:", response.data);

        // Handle paginated response structure
        const postsData = response.data.posts || response.data;

        if (!postsData || !Array.isArray(postsData)) {
          console.warn("Invalid trending posts data structure:", response.data);
          return [];
        }

        const validatedPosts = postsData.map((post, index) => {
          try {
            return blogPostResponseSchema.parse(post);
          } catch (validationError) {
            console.warn(
              `Trending post validation failed at index ${index}:`,
              validationError,
              post
            );
            return post;
          }
        });

        // Cache for 2 hours since trending changes less frequently
        localStorageCache.set(cacheKey, validatedPosts, 2 * 60 * 60 * 1000);

        return validatedPosts;
      } catch (error) {
        console.error("Trending posts fetch error:", error);

        // Try to return cached data as fallback
        const fallbackData = localStorageCache.get("posts_trending");
        if (fallbackData) {
          console.log("🔄 Using expired trending cache as fallback");
          return fallbackData;
        }

        throw error;
      }
    },
    staleTime: 2 * 60 * 60 * 1000, // 2 hours - extra aggressive for trending
    cacheTime: 4 * 60 * 60 * 1000, // 4 hours
    ...options,
  });
};

// Get post by slug
export const usePostBySlug = (slug, options = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.bySlug(slug),
    queryFn: async () => {
      const response = await axiosInstance.get(
        API_PATHS.POSTS.GET_BY_SLUG(slug)
      );
      return blogPostResponseSchema.parse(response.data);
    },
    enabled: !!slug,
    staleTime: 2 * 60 * 60 * 1000, // 2 hours - posts don't change often
    cacheTime: 4 * 60 * 60 * 1000, // 4 hours
    ...options,
  });
};

// Get posts by tag
export const usePostsByTag = (tag, options = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.byTag(tag),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(
          API_PATHS.POSTS.GET_BY_TAG(tag)
        );
        console.log("Posts by tag API Response:", response.data);

        // Handle paginated response structure
        const postsData = response.data.posts || response.data;

        if (!postsData || !Array.isArray(postsData)) {
          console.warn("Invalid posts by tag data structure:", response.data);
          return [];
        }

        return postsData.map((post, index) => {
          try {
            return blogPostResponseSchema.parse(post);
          } catch (validationError) {
            console.warn(
              `Posts by tag validation failed at index ${index}:`,
              validationError,
              post
            );
            return post;
          }
        });
      } catch (error) {
        console.error("Posts by tag fetch error:", error);
        throw error;
      }
    },
    enabled: !!tag,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

// Search posts
export const useSearchPosts = (query, options = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.search(query),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.POSTS.SEARCH, {
          params: { q: query },
        });
        console.log("Search posts API Response:", response.data);

        // Handle paginated response structure
        const postsData = response.data.posts || response.data;

        if (!postsData || !Array.isArray(postsData)) {
          console.warn("Invalid search posts data structure:", response.data);
          return [];
        }

        return postsData.map((post, index) => {
          try {
            return blogPostResponseSchema.parse(post);
          } catch (validationError) {
            console.warn(
              `Search posts validation failed at index ${index}:`,
              validationError,
              post
            );
            return post;
          }
        });
      } catch (error) {
        console.error("Search posts fetch error:", error);
        throw error;
      }
    },
    enabled: !!query && query.length >= 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

// Create post mutation
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData) => {
      const response = await axiosInstance.post(
        API_PATHS.POSTS.CREATE,
        postData
      );
      return blogPostResponseSchema.parse(response.data);
    },
    onSuccess: (newPost) => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.trending });

      // Add the new post to the cache
      queryClient.setQueryData(queryKeys.posts.bySlug(newPost.slug), newPost);

      toast.success("Post created successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create post");
    },
  });
};

// Update post mutation
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, postData }) => {
      const response = await axiosInstance.put(
        API_PATHS.POSTS.UPDATE(id),
        postData
      );
      return blogPostResponseSchema.parse(response.data);
    },
    onSuccess: (updatedPost) => {
      // Update specific post in cache
      queryClient.setQueryData(
        queryKeys.posts.bySlug(updatedPost.slug),
        updatedPost
      );

      // Invalidate posts list to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.trending });

      toast.success("Post updated successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update post");
    },
  });
};

// Delete post mutation
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(API_PATHS.POSTS.DELETE(id));
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from all relevant caches
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.trending });

      // Remove specific post queries
      queryClient.removeQueries({
        predicate: (query) => {
          return query.queryKey[0] === "posts" && query.queryKey[1] === "slug";
        },
      });

      toast.success("Post deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete post");
    },
  });
};

// Like post mutation
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosInstance.post(API_PATHS.POSTS.LIKE(id));
      return { id, likes: response.data.likes };
    },
    onSuccess: ({ id, likes }) => {
      // Update posts list cache
      queryClient.setQueryData(queryKeys.posts.all, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((post) =>
          post._id === id ? { ...post, likes } : post
        );
      });

      // Update trending posts cache
      queryClient.setQueryData(queryKeys.posts.trending, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((post) =>
          post._id === id ? { ...post, likes } : post
        );
      });

      // Update individual post caches
      queryClient
        .getQueryCache()
        .findAll({
          predicate: (query) =>
            query.queryKey[0] === "posts" && query.queryKey[1] === "slug",
        })
        .forEach((query) => {
          queryClient.setQueryData(query.queryKey, (oldData) => {
            if (!oldData || oldData._id !== id) return oldData;
            return { ...oldData, likes };
          });
        });

      toast.success("Post liked!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to like post");
    },
  });
};

// Increment view mutation
export const useIncrementView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosInstance.post(
        API_PATHS.POSTS.INCREMENT_VIEW(id)
      );
      return { id, views: response.data.views };
    },
    onSuccess: ({ id, views }) => {
      // Update post views in cache silently
      queryClient
        .getQueryCache()
        .findAll({
          predicate: (query) => query.queryKey[0] === "posts",
        })
        .forEach((query) => {
          queryClient.setQueryData(query.queryKey, (oldData) => {
            if (!oldData) return oldData;
            if (Array.isArray(oldData)) {
              return oldData.map((post) =>
                post._id === id ? { ...post, views } : post
              );
            } else if (oldData._id === id) {
              return { ...oldData, views };
            }
            return oldData;
          });
        });
    },
    // Don't show error toast for view increments
    onError: () => {},
  });
};
