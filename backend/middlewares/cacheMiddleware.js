const config = require("../config/config");

// In-memory cache as fallback when Redis is not available
let memoryCache = new Map();
let redisClient = null;

// Initialize Redis client (optional dependency)
const initializeRedis = async () => {
  try {
    if (
      config.CACHE.REDIS_URL &&
      config.CACHE.REDIS_URL !== "redis://localhost:6379"
    ) {
      const redis = require("redis");
      redisClient = redis.createClient({
        url: config.CACHE.REDIS_URL,
        retry_strategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      redisClient.on("error", (err) => {
        console.error("Redis Cache Error:", err);
        redisClient = null; // Fallback to memory cache
      });

      redisClient.on("connect", () => {
        console.log("✅ Redis Cache Connected");
      });

      await redisClient.connect();
    }
  } catch (error) {
    console.warn("⚠️ Redis not available, using memory cache:", error.message);
    redisClient = null;
  }
};

// Get from cache
const getFromCache = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } else {
      // Fallback to memory cache
      const cached = memoryCache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      } else if (cached) {
        memoryCache.delete(key); // Remove expired
      }
      return null;
    }
  } catch (error) {
    console.error("Cache Get Error:", error);
    return null;
  }
};

// Set to cache
const setToCache = async (key, data, ttlSeconds = 300) => {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
    } else {
      // Fallback to memory cache
      memoryCache.set(key, {
        data,
        expiry: Date.now() + ttlSeconds * 1000,
      });

      // Prevent memory leak - limit cache size
      if (memoryCache.size > 1000) {
        const firstKey = memoryCache.keys().next().value;
        memoryCache.delete(firstKey);
      }
    }
  } catch (error) {
    console.error("Cache Set Error:", error);
  }
};

// Delete from cache
const deleteFromCache = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (error) {
    console.error("Cache Delete Error:", error);
  }
};

// Clear cache by pattern
const clearCachePattern = async (pattern) => {
  try {
    if (redisClient && redisClient.isReady) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } else {
      // For memory cache, delete keys that match pattern
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace("*", ""))) {
          memoryCache.delete(key);
        }
      }
    }
  } catch (error) {
    console.error("Cache Pattern Clear Error:", error);
  }
};

// Cache middleware factory
const createCacheMiddleware = (cacheKey, ttl) => {
  return async (req, res, next) => {
    try {
      // Generate cache key with request specifics
      const key =
        typeof cacheKey === "function"
          ? cacheKey(req)
          : `${cacheKey}:${req.originalUrl || req.url}`;

      // Try to get from cache
      const cachedData = await getFromCache(key);

      if (cachedData) {
        console.log(`🚀 Cache HIT: ${key}`);
        return res.json(cachedData);
      }

      console.log(`💾 Cache MISS: ${key}`);

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function (data) {
        // Cache successful responses only
        if (res.statusCode === 200 && data) {
          setToCache(key, data, ttl).catch((err) =>
            console.error("Failed to cache response:", err)
          );
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Cache Middleware Error:", error);
      next(); // Continue without caching
    }
  };
};

// Specific cache middlewares
const cacheMiddleware = {
  // Posts cache
  posts: createCacheMiddleware(
    (req) =>
      `posts:${req.query.page || 1}:${req.query.status || "all"}:${
        req.query.tags || ""
      }`,
    config.CACHE.TTL.POSTS
  ),

  // Post detail cache
  postDetail: createCacheMiddleware(
    (req) => `post:${req.params.slug || req.params.id}`,
    config.CACHE.TTL.POSTS
  ),

  // Comments cache
  comments: createCacheMiddleware(
    (req) => `comments:${req.params.postId || req.query.postId}`,
    config.CACHE.TTL.COMMENTS
  ),

  // Dashboard cache
  dashboard: createCacheMiddleware(
    "dashboard:stats",
    config.CACHE.TTL.DASHBOARD
  ),

  // Users cache
  users: createCacheMiddleware(
    (req) => `users:${req.query.page || 1}:${req.query.role || "all"}`,
    config.CACHE.TTL.USERS
  ),

  // Search cache
  search: createCacheMiddleware(
    (req) => `search:${req.query.q}:${req.query.page || 1}`,
    300 // 5 minutes for search results
  ),

  // Top posts cache
  topPosts: createCacheMiddleware(
    "top-posts",
    600 // 10 minutes for trending content
  ),
};

// Cache invalidation helpers
const invalidateCache = {
  // Invalidate post-related caches
  posts: async () => {
    await clearCachePattern("posts:*");
    await clearCachePattern("post:*");
    await clearCachePattern("top-posts*");
    await clearCachePattern("dashboard:*");
  },

  // Invalidate comment-related caches
  comments: async (postId) => {
    await clearCachePattern(`comments:${postId}*`);
    await clearCachePattern("dashboard:*");
  },

  // Invalidate user-related caches
  users: async () => {
    await clearCachePattern("users:*");
    await clearCachePattern("dashboard:*");
  },

  // Invalidate dashboard caches
  dashboard: async () => {
    await clearCachePattern("dashboard:*");
  },

  // Invalidate all caches
  all: async () => {
    if (redisClient && redisClient.isReady) {
      await redisClient.flushAll();
    } else {
      memoryCache.clear();
    }
  },
};

// Health check
const getCacheStats = async () => {
  try {
    if (redisClient && redisClient.isReady) {
      const info = await redisClient.info("memory");
      const keyspace = await redisClient.info("keyspace");
      return {
        type: "redis",
        connected: true,
        memory: info,
        keyspace: keyspace,
      };
    } else {
      return {
        type: "memory",
        connected: true,
        size: memoryCache.size,
        keys: Array.from(memoryCache.keys()).slice(0, 10), // Show first 10 keys
      };
    }
  } catch (error) {
    return {
      type: "unknown",
      connected: false,
      error: error.message,
    };
  }
};

module.exports = {
  initializeRedis,
  cacheMiddleware,
  invalidateCache,
  getCacheStats,
  getFromCache,
  setToCache,
  deleteFromCache,
};
