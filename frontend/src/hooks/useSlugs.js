import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { API_PATHS } from "../utils/apiPaths";
import { apiRequest } from "../utils/apiRequest";

// Query Keys
export const SLUG_QUERY_KEYS = {
  VALIDATE: (slug, excludeId) => ["slugs", "validate", slug, excludeId],
  GENERATE: (title, excludeId) => ["slugs", "generate", title, excludeId],
};

// Generate slug from title
export const useGenerateSlug = () => {
  return useMutation({
    mutationFn: async ({ title, excludeId }) => {
      const response = await apiRequest(API_PATHS.SLUGS.GENERATE, {
        method: "POST",
        data: { title, excludeId },
      });
      return response.data;
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to generate slug";
      toast.error(message);
    },
  });
};

// Validate slug format and availability
export const useValidateSlug = () => {
  return useMutation({
    mutationFn: async ({ slug, excludeId }) => {
      const response = await apiRequest(API_PATHS.SLUGS.VALIDATE, {
        method: "POST",
        data: { slug, excludeId },
      });
      return response.data;
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to validate slug";
      toast.error(message);
    },
  });
};

// Regenerate slug for existing post
export const useRegenerateSlug = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId) => {
      const response = await apiRequest(API_PATHS.SLUGS.REGENERATE(postId), {
        method: "PUT",
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate post queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      toast.success(`Slug regenerated: ${data.oldSlug} → ${data.newSlug}`);
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to regenerate slug";
      toast.error(message);
    },
  });
};

// Real-time slug validation hook
export const useSlugValidation = (slug, excludeId, enabled = true) => {
  return useQuery({
    queryKey: SLUG_QUERY_KEYS.VALIDATE(slug, excludeId),
    queryFn: async () => {
      if (!slug || slug.length < 3) {
        return {
          isValid: false,
          isAvailable: false,
          message: "Slug must be at least 3 characters long",
        };
      }

      const response = await apiRequest(API_PATHS.SLUGS.VALIDATE, {
        method: "POST",
        data: { slug, excludeId },
      });
      return response.data;
    },
    enabled: enabled && !!slug && slug.length >= 3,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
    retry: false, // Don't retry validation requests
  });
};

// Auto-generate slug from title hook
export const useAutoSlugGeneration = (title, excludeId, enabled = true) => {
  return useQuery({
    queryKey: SLUG_QUERY_KEYS.GENERATE(title, excludeId),
    queryFn: async () => {
      if (!title || title.length < 3) {
        return { slug: "", isValid: false };
      }

      const response = await apiRequest(API_PATHS.SLUGS.GENERATE, {
        method: "POST",
        data: { title, excludeId },
      });
      return response.data;
    },
    enabled: enabled && !!title && title.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Utility functions for slug handling
export const slugUtils = {
  // Basic slug formatting (client-side preview)
  formatSlug: (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  },

  // Validate slug format (client-side)
  isValidSlugFormat: (slug) => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100;
  },

  // Generate preview slug from title
  previewSlug: (title) => {
    if (!title) return "";
    return slugUtils.formatSlug(title);
  },

  // Check if slug needs regeneration
  needsRegeneration: (currentSlug, title) => {
    const expectedSlug = slugUtils.previewSlug(title);
    return currentSlug !== expectedSlug;
  },
};
