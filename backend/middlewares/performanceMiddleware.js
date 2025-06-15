const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const config = require("../config/config");

// Compression middleware
const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (1-9)
  threshold: 1024, // Only compress if response is larger than 1KB
});

// Security headers middleware
const securityMiddleware = helmet({
  contentSecurityPolicy: config.NODE_ENV === "production" ? undefined : false,
  crossOriginEmbedderPolicy: false,
});

// Rate limiting middleware
const createRateLimiter = (
  windowMs,
  max,
  message,
  skipSuccessfulRequests = false
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error:
        message || "Too many requests from this IP, please try again later.",
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req) => {
      // Use IP and user ID if available for more precise limiting
      return `${req.ip}-${req.user?.id || "anonymous"}`;
    },
  });
};

// Different rate limits for different endpoints
const rateLimiters = {
  // General API rate limit
  general: createRateLimiter(
    config.RATE_LIMIT.WINDOW_MS,
    config.RATE_LIMIT.MAX_REQUESTS,
    "Too many API requests, please try again later.",
    config.RATE_LIMIT.SKIP_SUCCESSFUL
  ),

  // Strict rate limit for auth endpoints
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    "Too many authentication attempts, please try again later."
  ),

  // Password reset rate limit
  passwordReset: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    3, // 3 attempts
    "Too many password reset attempts, please try again later."
  ),

  // Content creation rate limit
  contentCreation: createRateLimiter(
    60 * 1000, // 1 minute
    10, // 10 posts/comments per minute
    "You are creating content too quickly, please slow down."
  ),

  // Search rate limit
  search: createRateLimiter(
    60 * 1000, // 1 minute
    30, // 30 searches per minute
    "Too many search requests, please try again later."
  ),
};

// Speed limiting (slow down) middleware
const speedLimiters = {
  // Slow down after many requests
  general: slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: config.RATE_LIMIT.MAX_REQUESTS / 2, // Start slowing down after half the limit
    delayMs: () => 100, // Add 100ms delay per request after delayAfter
    maxDelayMs: 2000, // Maximum delay of 2 seconds
    validate: { delayMs: false },
  }),

  // Heavy operations slowdown
  heavyOps: slowDown({
    windowMs: 10 * 60 * 1000, // 10 minutes
    delayAfter: 5,
    delayMs: () => 500,
    maxDelayMs: 5000,
    validate: { delayMs: false },
  }),
};

// Request size limiting middleware
const requestSizeLimit = (maxSize = config.PERFORMANCE.MAX_REQUEST_SIZE) => {
  return (req, res, next) => {
    const contentLength = req.headers["content-length"];

    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        error: "Request too large",
        maxSize: maxSize,
      });
    }

    next();
  };
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = Date.now();

  // Add performance timing
  req.startTime = start;

  // Monitor response time
  res.on("finish", () => {
    const duration = Date.now() - start;

    // Log slow requests
    if (duration > 1000) {
      // Slower than 1 second
      console.warn(
        `🐌 Slow Request: ${req.method} ${req.originalUrl} - ${duration}ms`
      );
    }

    // Add performance headers only if headers haven't been sent
    if (!res.headersSent) {
      try {
        res.set("X-Response-Time", `${duration}ms`);
      } catch (error) {
        // Silently ignore header errors after response is sent
        console.debug("Headers already sent, skipping performance header");
      }
    }
  });

  next();
};

// Memory usage monitoring
const memoryMonitor = (req, res, next) => {
  const usage = process.memoryUsage();

  // Log high memory usage
  if (usage.heapUsed > 100 * 1024 * 1024) {
    // > 100MB
    console.warn(
      `🧠 High Memory Usage: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`
    );
  }

  // Add memory headers in development only if headers haven't been sent
  if (config.NODE_ENV === "development" && !res.headersSent) {
    try {
      res.set(
        "X-Memory-Usage",
        `${Math.round(usage.heapUsed / 1024 / 1024)}MB`
      );
    } catch (error) {
      // Silently ignore header errors
      console.debug("Headers already sent, skipping memory header");
    }
  }

  next();
};

// Static files caching middleware
const staticCacheMiddleware = (maxAge = 86400) => {
  // 24 hours default
  return (req, res, next) => {
    if (config.PERFORMANCE.ENABLE_STATIC_CACHE && !res.headersSent) {
      // Cache static assets
      if (
        req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
      ) {
        try {
          res.set("Cache-Control", `public, max-age=${maxAge}`);
        } catch (error) {
          console.debug("Headers already sent, skipping cache header");
        }
      }
    }
    next();
  };
};

// CDN URL helper
const getCDNUrl = (originalUrl) => {
  if (config.CDN.ENABLED && config.CDN.BASE_URL && originalUrl) {
    // Handle image URLs
    if (originalUrl.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
      return `${config.CDN.BASE_URL}${originalUrl}`;
    }
  }
  return originalUrl;
};

// Response optimization middleware
const optimizeResponse = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Optimize image URLs for CDN
    if (data && typeof data === "object") {
      data = optimizeImageUrls(data);
    }

    // Add performance metadata
    if (config.NODE_ENV === "development" && req.startTime) {
      const responseTime = Date.now() - req.startTime;

      if (data && typeof data === "object" && !Array.isArray(data)) {
        data._meta = {
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
          cached: res.get("X-Cache-Hit") === "true",
        };
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

// Recursively optimize image URLs in response data
const optimizeImageUrls = (data) => {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(optimizeImageUrls);
  }

  const optimized = { ...data };

  // Common image URL fields
  const imageFields = [
    "profileImageUrl",
    "coverImageUrl",
    "imageUrl",
    "avatar",
    "thumbnail",
  ];

  imageFields.forEach((field) => {
    if (optimized[field]) {
      optimized[field] = getCDNUrl(optimized[field]);
    }
  });

  // Recursively process nested objects
  Object.keys(optimized).forEach((key) => {
    if (typeof optimized[key] === "object" && optimized[key] !== null) {
      optimized[key] = optimizeImageUrls(optimized[key]);
    }
  });

  return optimized;
};

// Health check endpoint for performance monitoring
const performanceHealthCheck = async (req, res) => {
  const usage = process.memoryUsage();
  const uptime = process.uptime();

  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)} minutes`,
    memory: {
      used: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    },
    performance: {
      compression: config.PERFORMANCE.ENABLE_COMPRESSION,
      caching: config.PERFORMANCE.ENABLE_STATIC_CACHE,
      cdn: config.CDN.ENABLED,
    },
  };

  res.json(health);
};

module.exports = {
  compressionMiddleware,
  securityMiddleware,
  rateLimiters,
  speedLimiters,
  requestSizeLimit,
  performanceMonitor,
  memoryMonitor,
  staticCacheMiddleware,
  optimizeResponse,
  getCDNUrl,
  performanceHealthCheck,
};
 