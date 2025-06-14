import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { queryKeys } from "../lib/queryClient";
import { commentResponseSchema } from "../lib/schemas";
import toast from "react-hot-toast";

// Get all comments
export const useAllComments = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.comments.all,
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.COMMENTS.GET_ALL);
        console.log("All comments API Response:", response.data);

        // Handle potential paginated or direct array response
        const commentsData = response.data.comments || response.data;

        if (!commentsData || !Array.isArray(commentsData)) {
          console.warn("Invalid comments data structure:", response.data);
          return [];
        }

        return commentsData.map((comment, index) => {
          try {
            return commentResponseSchema.parse(comment);
          } catch (validationError) {
            console.warn(
              `Comment validation failed at index ${index}:`,
              validationError,
              comment
            );
            return comment;
          }
        });
      } catch (error) {
        console.error("Comments fetch error:", error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get comments by post
export const useCommentsByPost = (postId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.comments.byPost(postId),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(
          API_PATHS.COMMENTS.GET_ALL_BY_POST(postId)
        );
        console.log("Comments by post API Response:", response.data);

        // Handle potential paginated or direct array response
        const commentsData = response.data.comments || response.data;

        if (!commentsData || !Array.isArray(commentsData)) {
          console.warn(
            "Invalid comments by post data structure:",
            response.data
          );
          return [];
        }

        return commentsData.map((comment, index) => {
          try {
            return commentResponseSchema.parse(comment);
          } catch (validationError) {
            console.warn(
              `Comment by post validation failed at index ${index}:`,
              validationError,
              comment
            );
            return comment;
          }
        });
      } catch (error) {
        console.error("Comments by post fetch error:", error);
        throw error;
      }
    },
    enabled: !!postId,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
};

// Add comment mutation
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content, parentComment }) => {
      const response = await axiosInstance.post(
        API_PATHS.COMMENTS.ADD(postId),
        {
          content,
          parentComment,
        }
      );
      return commentResponseSchema.parse(response.data);
    },
    onSuccess: (newComment, { postId }) => {
      // Invalidate comments for this post
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byPost(postId),
      });

      // Also invalidate all comments if needed
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.all,
      });

      toast.success("Comment added successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add comment");
    },
  });
};

// Delete comment mutation
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId) => {
      await axiosInstance.delete(API_PATHS.COMMENTS.DELETE(commentId));
      return commentId;
    },
    onSuccess: (deletedCommentId) => {
      // Invalidate all comment queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: ["comments"],
      });

      toast.success("Comment deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete comment");
    },
  });
};

// Optimistic update helper for comments
export const useOptimisticCommentUpdate = () => {
  const queryClient = useQueryClient();

  const addOptimisticComment = (postId, tempComment) => {
    queryClient.setQueryData(
      queryKeys.comments.byPost(postId),
      (oldComments) => {
        if (!oldComments) return [tempComment];
        return [...oldComments, tempComment];
      }
    );
  };

  const removeOptimisticComment = (postId, tempId) => {
    queryClient.setQueryData(
      queryKeys.comments.byPost(postId),
      (oldComments) => {
        if (!oldComments) return [];
        return oldComments.filter((comment) => comment._id !== tempId);
      }
    );
  };

  return { addOptimisticComment, removeOptimisticComment };
};
