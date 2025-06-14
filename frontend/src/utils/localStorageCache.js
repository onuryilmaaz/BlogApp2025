const CACHE_PREFIX = "blogapp_cache_";
const DEFAULT_EXPIRY = 30 * 60 * 1000; // 30 minutes

export const localStorageCache = {
  set(key, data, expiry = DEFAULT_EXPIRY) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry: expiry,
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Failed to cache data:", error);
    }
  },

  get(key) {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now - cacheData.timestamp > cacheData.expiry) {
        this.remove(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn("Failed to retrieve cached data:", error);
      return null;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.warn("Failed to remove cached data:", error);
    }
  },

  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to clear cache:", error);
    }
  },

  // Check cache size and clean if too large
  cleanup() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

      // If we have more than 50 cache entries, remove oldest ones
      if (cacheKeys.length > 50) {
        const cacheData = cacheKeys
          .map((key) => {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              return { key, timestamp: data.timestamp };
            } catch {
              return { key, timestamp: 0 };
            }
          })
          .sort((a, b) => a.timestamp - b.timestamp);

        // Remove oldest 20 entries
        cacheData.slice(0, 20).forEach((item) => {
          localStorage.removeItem(item.key);
        });
      }
    } catch (error) {
      console.warn("Failed to cleanup cache:", error);
    }
  },
};

// Auto cleanup on app start
localStorageCache.cleanup();
