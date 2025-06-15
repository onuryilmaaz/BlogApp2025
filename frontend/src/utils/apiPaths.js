export const BASE_URL = "http://localhost:8080";

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GET_PROFILE: "/api/auth/profile",
    GET_USER_INFO: "/api/auth/profile",
    UPDATE_PROFILE: "/api/auth/profile",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password/:token",
  },
  USERS: {
    GET_ALL: "/api/users",
    GET_BY_ID: (id) => `/api/users/${id}`,
    UPDATE: (id) => `/api/users/${id}`,
    DELETE: (id) => `/api/users/${id}`,
  },
  IMAGE: {
    UPLOAD_IMAGE: "/api/auth/upload-image",
  },
  DASHBOARD: {
    GET_DASHBOARD_DATA: "/api/dashboard-summary",
  },
  AI: {
    GENERATE_BLOG_POST: "/api/ai/generate",
    GENERATE_BLOG_POST_IDEAS: "/api/ai/generate-ideas",
    GENERATE_COMMENT_REPLY: "/api/ai/generate-reply",
    GENERATE_POST_SUMMARY: "/api/ai/generate-summary",
  },
  POSTS: {
    CREATE: "/api/posts",
    GET_ALL: "/api/posts",
    GET_TRENDING_POST: "/api/posts/trending",
    GET_BY_SLUG: (slug) => `/api/posts/${slug}`,
    UPDATE: (id) => `/api/posts/${id}`,
    DELETE: (id) => `/api/posts/${id}`,
    GET_BY_TAG: (tag) => `/api/posts/tag/${tag}`,
    SEARCH: "/api/posts/search",
    INCREMENT_VIEW: (id) => `/api/posts/${id}/view`,
    LIKE: (id) => `/api/posts/${id}/like`,
  },
  COMMENTS: {
    ADD: (postId) => `/api/comments/${postId}`,
    GET_ALL: "/api/comments",
    GET_ALL_BY_POST: (postId) => `/api/comments/${postId}`,
    DELETE: (commentId) => `/api/comments/${commentId}`,
    UPDATE: (commentId) => `/api/comments/${commentId}`,
    LIKE: (commentId) => `/api/comments/${commentId}/like`,
  },
  NOTIFICATIONS: {
    GET_ALL: "/api/notifications",
    GET_UNREAD_COUNT: "/api/notifications/unread-count",
    MARK_AS_READ: (id) => `/api/notifications/${id}/read`,
    MARK_ALL_AS_READ: "/api/notifications/mark-all-read",
    DELETE: (id) => `/api/notifications/${id}`,
  },

  // Tag endpoints
  TAGS: {
    GET_ALL: "/api/tags",
    GET_STATS: "/api/tags/stats",
    GET_POPULAR: "/api/tags/popular",
    GET_SUGGESTIONS: "/api/tags/suggestions",
    GET_DETAILS: (tagName) => `/api/tags/${tagName}`,
    CREATE: "/api/tags",
    UPDATE: (id) => `/api/tags/${id}`,
    DELETE: (id) => `/api/tags/${id}`,
    MERGE: "/api/tags/merge",
  },

  // Slug endpoints
  SLUGS: {
    GENERATE: "/api/posts/generate-slug",
    VALIDATE: "/api/posts/validate-slug",
    REGENERATE: (id) => `/api/posts/${id}/regenerate-slug`,
  },
};
