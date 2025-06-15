/* eslint-disable no-unused-vars */
// Enhanced cache manager for avoiding 429 rate limit errors
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = {
      posts: 5 * 60 * 1000, // 5 minutes for posts
      trending: 10 * 60 * 1000, // 10 minutes for trending
      comments: 2 * 60 * 1000, // 2 minutes for comments
      default: 3 * 60 * 1000, // 3 minutes default
    };
  }

  // Generate cache key from URL and params
  generateKey(url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");
    return `${url}${paramString ? "?" + paramString : ""}`;
  }

  // Get cache duration based on endpoint
  getCacheDuration(url) {
    if (url.includes("/posts") && url.includes("trending")) {
      return this.cacheDuration.trending;
    } else if (url.includes("/posts")) {
      return this.cacheDuration.posts;
    } else if (url.includes("/comments")) {
      return this.cacheDuration.comments;
    }
    return this.cacheDuration.default;
  }

  // Set cache with localStorage backup
  set(key, data, customDuration = null) {
    const duration = customDuration || this.getCacheDuration(key);
    const cacheItem = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + duration,
    };

    // Store in memory cache
    this.cache.set(key, cacheItem);

    // Store in localStorage for persistence
    try {
      const storageKey = `api_cache_${btoa(key).slice(0, 50)}`;
      localStorage.setItem(storageKey, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn("Failed to save to localStorage cache:", error);
    }
  }

  // Get from cache with localStorage fallback
  get(key) {
    // Try memory cache first
    const memoryItem = this.cache.get(key);
    if (memoryItem && Date.now() < memoryItem.expires) {
      console.log("📦 Cache hit (memory):", key);
      return memoryItem.data;
    }

    // Try localStorage cache
    try {
      const storageKey = `api_cache_${btoa(key).slice(0, 50)}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const storageItem = JSON.parse(stored);
        if (Date.now() < storageItem.expires) {
          console.log("📦 Cache hit (localStorage):", key);
          // Restore to memory cache
          this.cache.set(key, storageItem);
          return storageItem.data;
        } else {
          // Remove expired cache
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.warn("Failed to read from localStorage cache:", error);
    }

    return null;
  }

  // Check if we have valid cache
  has(key) {
    return this.get(key) !== null;
  }

  // Clear specific cache entry
  delete(key) {
    this.cache.delete(key);
    try {
      const storageKey = `api_cache_${btoa(key).slice(0, 50)}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("Failed to remove from localStorage cache:", error);
    }
  }

  // Clear all cache
  clear() {
    this.cache.clear();

    // Clear localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("api_cache_")) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to clear localStorage cache:", error);
    }
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();

    // Clean memory cache
    for (const [key, item] of this.cache.entries()) {
      if (now >= item.expires) {
        this.cache.delete(key);
      }
    }

    // Clean localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("api_cache_")) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (now >= item.expires) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // Remove corrupted cache entries
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn("Failed to cleanup localStorage cache:", error);
    }
  }

  // Get cache stats
  getStats() {
    const memorySize = this.cache.size;
    let localStorageSize = 0;

    try {
      const keys = Object.keys(localStorage);
      localStorageSize = keys.filter((key) =>
        key.startsWith("api_cache_")
      ).length;
    } catch (error) {
      localStorageSize = 0;
    }

    return {
      memoryEntries: memorySize,
      localStorageEntries: localStorageSize,
    };
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Auto cleanup every 5 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 5 * 60 * 1000);

export default cacheManager;
