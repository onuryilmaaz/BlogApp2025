import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { API_PATHS } from "../utils/apiPaths";
import { apiRequest } from "../utils/apiRequest";

// Query Keys
export const TAG_QUERY_KEYS = {
  ALL: ["tags"],
  LIST: (filters) => ["tags", "list", filters],
  STATS: ["tags", "stats"],
  POPULAR: (limit) => ["tags", "popular", limit],
  SUGGESTIONS: (query) => ["tags", "suggestions", query],
  DETAILS: (tagName) => ["tags", "details", tagName],
};

// Get all tags with filtering and pagination
export const useTags = (filters = {}) => {
  return useQuery({
    queryKey: TAG_QUERY_KEYS.LIST(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value);
        }
      });
      
      const url = `${API_PATHS.TAGS.GET_ALL}?${params.toString()}`;
      const response = await apiRequest(url);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get tag statistics
export const useTagStats = () => {
  return useQuery({
    queryKey: TAG_QUERY_KEYS.STATS,
    queryFn: async () => {
      const response = await apiRequest(API_PATHS.TAGS.GET_STATS);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Get popular tags
export const usePopularTags = (limit = 10) => {
  return useQuery({
    queryKey: TAG_QUERY_KEYS.POPULAR(limit),
    queryFn: async () => {
      const response = await apiRequest(`${API_PATHS.TAGS.GET_POPULAR}?limit=${limit}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get tag suggestions for autocomplete
export const useTagSuggestions = (query, enabled = true) => {
  return useQuery({
    queryKey: TAG_QUERY_KEYS.SUGGESTIONS(query),
    queryFn: async () => {
      if (!query || query.length < 2) return { suggestions: [] };
      
      const response = await apiRequest(`${API_PATHS.TAGS.GET_SUGGESTIONS}?q=${encodeURIComponent(query)}&limit=8`);
      return response.data;
    },
    enabled: enabled && query && query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get tag details with posts
export const useTagDetails = (tagName, enabled = true) => {
  return useQuery({
    queryKey: TAG_QUERY_KEYS.DETAILS(tagName),
    queryFn: async () => {
      const response = await apiRequest(API_PATHS.TAGS.GET_DETAILS(tagName));
      return response.data;
    },
    enabled: enabled && !!tagName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create new tag
export const useCreateTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tagData) => {
      const response = await apiRequest(API_PATHS.TAGS.CREATE, {
        method: "POST",
        data: tagData,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch tag queries
      queryClient.invalidateQueries({ queryKey: TAG_QUERY_KEYS.ALL });
      
      toast.success(`Tag "${data.tag.displayName}" created successfully!`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to create tag";
      toast.error(message);
    },
  });
};

// Update tag
export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tagId, updateData }) => {
      const response = await apiRequest(API_PATHS.TAGS.UPDATE(tagId), {
        method: "PUT",
        data: updateData,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch tag queries
      queryClient.invalidateQueries({ queryKey: TAG_QUERY_KEYS.ALL });
      
      toast.success(`Tag "${data.tag.displayName}" updated successfully!`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to update tag";
      toast.error(message);
    },
  });
};

// Delete tag
export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tagId) => {
      const response = await apiRequest(API_PATHS.TAGS.DELETE(tagId), {
        method: "DELETE",
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch tag queries
      queryClient.invalidateQueries({ queryKey: TAG_QUERY_KEYS.ALL });
      
      toast.success(`Tag "${data.deletedTag.displayName}" deleted successfully!`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to delete tag";
      toast.error(message);
    },
  });
};

// Merge tags
export const useMergeTags = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sourceTagIds, targetTagId }) => {
      const response = await apiRequest(API_PATHS.TAGS.MERGE, {
        method: "POST",
        data: { sourceTagIds, targetTagId },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch tag queries
      queryClient.invalidateQueries({ queryKey: TAG_QUERY_KEYS.ALL });
      
      toast.success(data.message);
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to merge tags";
      toast.error(message);
    },
  });
};

// Bulk operations
export const useBulkTagOperations = () => {
  const queryClient = useQueryClient();
  
  const bulkDelete = useMutation({
    mutationFn: async (tagIds) => {
      const promises = tagIds.map(id => 
        apiRequest(API_PATHS.TAGS.DELETE(id), { method: "DELETE" })
      );
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      
      return { successful, failed, total: tagIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TAG_QUERY_KEYS.ALL });
      
      if (data.failed === 0) {
        toast.success(`Successfully deleted ${data.successful} tags`);
      } else {
        toast.error(`Deleted ${data.successful} tags, failed to delete ${data.failed} tags`);
      }
    },
    onError: () => {
      toast.error("Failed to delete tags");
    },
  });
  
  const bulkUpdate = useMutation({
    mutationFn: async ({ tagIds, updateData }) => {
      const promises = tagIds.map(id => 
        apiRequest(API_PATHS.TAGS.UPDATE(id), { 
          method: "PUT", 
          data: updateData 
        })
      );
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      
      return { successful, failed, total: tagIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TAG_QUERY_KEYS.ALL });
      
      if (data.failed === 0) {
        toast.success(`Successfully updated ${data.successful} tags`);
      } else {
        toast.error(`Updated ${data.successful} tags, failed to update ${data.failed} tags`);
      }
    },
    onError: () => {
      toast.error("Failed to update tags");
    },
  });
  
  return {
    bulkDelete,
    bulkUpdate,
  };
}; 