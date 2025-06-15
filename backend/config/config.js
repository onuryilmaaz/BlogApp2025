const config = {
  JWT_SECRET: process.env.JWT_SECRET || "your-fallback-jwt-secret-key",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/blog-app",
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Email configuration
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || "gmail",
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,

  // Admin configuration
  ADMIN_ACCESS_TOKEN: process.env.ADMIN_ACCESS_TOKEN || "admin-secret-token",

  // CDN Configuration
  CDN: {
    ENABLED: process.env.CDN_ENABLED === "true" || false,
    BASE_URL: process.env.CDN_BASE_URL || "",
    API_KEY: process.env.CDN_API_KEY || "",
    SECRET_KEY: process.env.CDN_SECRET_KEY || "",
    BUCKET_NAME: process.env.CDN_BUCKET_NAME || "",
    REGION: process.env.CDN_REGION || "us-east-1",
  },

  // Cache Configuration
  CACHE: {
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
    TTL: {
      POSTS: parseInt(process.env.CACHE_POSTS_TTL) || 300, // 5 minutes
      COMMENTS: parseInt(process.env.CACHE_COMMENTS_TTL) || 180, // 3 minutes
      USERS: parseInt(process.env.CACHE_USERS_TTL) || 600, // 10 minutes
      DASHBOARD: parseInt(process.env.CACHE_DASHBOARD_TTL) || 120, // 2 minutes
    },
  },

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    SKIP_SUCCESSFUL: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === "true" || false,
  },

  // Performance
  PERFORMANCE: {
    ENABLE_COMPRESSION: process.env.ENABLE_COMPRESSION !== "false",
    ENABLE_STATIC_CACHE: process.env.ENABLE_STATIC_CACHE !== "false",
    MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE || "10mb",
    PAGINATION_LIMIT: parseInt(process.env.PAGINATION_LIMIT) || 10,
  },

  // Security
  SECURITY: {
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
    HELMET_ENABLED: process.env.HELMET_ENABLED !== "false",
    SESSION_SECRET: process.env.SESSION_SECRET || "session-secret-key",
  },

  // Sentry Configuration
  SENTRY: {
    DSN: process.env.SENTRY_DSN,
    ENVIRONMENT: process.env.NODE_ENV || "development",
    TRACES_SAMPLE_RATE:
      parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
  },
};

module.exports = config;
