/* eslint-disable no-unused-vars */
import { queryClient, queryKeys } from "../lib/queryClient";

// Cache optimization utilities
export const cacheOptimization = {
  // Preload critical data on app start
  preloadCriticalData: async () => {
    const promises = [
      // Preload trending posts
      queryClient.prefetchQuery({
        queryKey: queryKeys.posts.trending(5),
        staleTime: 15 * 60 * 1000,
      }),

      // Preload popular tags
      queryClient.prefetchQuery({
        queryKey: queryKeys.tags.popular(10),
        staleTime: 10 * 60 * 1000,
      }),

      // Preload user notifications if logged in
      ...(localStorage.getItem("token")
        ? [
            queryClient.prefetchQuery({
              queryKey: queryKeys.notifications.unreadCount(),
              staleTime: 1 * 60 * 1000,
            }),
          ]
        : []),
    ];

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.warn("⚠️ Failed to preload some critical data:", error);
    }
  },

  // Smart prefetching based on user behavior
  smartPrefetch: {
    // Prefetch related posts when user hovers over a post
    onPostHover: (postData) => {
      if (postData.tags && postData.tags.length > 0) {
        // Prefetch posts with similar tags
        postData.tags.slice(0, 2).forEach((tag) => {
          queryClient.prefetchQuery({
            queryKey: queryKeys.posts.byTag(tag, { limit: 3 }),
            staleTime: 5 * 60 * 1000,
          });
        });
      }
    },

    // Prefetch next page when user is near bottom
    onNearBottom: (currentFilters) => {
      const currentData = queryClient.getQueryData(
        queryKeys.posts.list(currentFilters)
      );
      if (currentData?.pagination?.hasNextPage) {
        const nextPageFilters = {
          ...currentFilters,
          page: currentData.pagination.currentPage + 1,
        };

        queryClient.prefetchQuery({
          queryKey: queryKeys.posts.list(nextPageFilters),
          staleTime: 2 * 60 * 1000,
        });
      }
    },

    // Prefetch user profile when hovering over author
    onAuthorHover: (authorId) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.users.detail(authorId),
        staleTime: 10 * 60 * 1000,
      });
    },

    // Prefetch tag details when hovering over tag
    onTagHover: (tagName) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.tags.detail(tagName),
        staleTime: 5 * 60 * 1000,
      });
    },
  },

  // Cache warming strategies
  warmCache: {
    // Warm cache with popular content
    popular: async () => {
      const promises = [
        queryClient.prefetchQuery({
          queryKey: queryKeys.posts.popular("week"),
          staleTime: 30 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.posts.popular("month"),
          staleTime: 60 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.tags.trending(15),
          staleTime: 20 * 60 * 1000,
        }),
      ];

      await Promise.allSettled(promises);
    },

    // Warm cache for admin dashboard
    dashboard: async () => {
      if (!localStorage.getItem("token")) return;

      const promises = [
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.summary(),
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.posts.pending(),
          staleTime: 2 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.comments.pending(),
          staleTime: 2 * 60 * 1000,
        }),
      ];

      await Promise.allSettled(promises);
    },

    // Warm cache for search functionality
    search: async () => {
      const promises = [
        queryClient.prefetchQuery({
          queryKey: queryKeys.search.popular(),
          staleTime: 30 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.tags.suggestions(""),
          staleTime: 15 * 60 * 1000,
        }),
      ];

      await Promise.allSettled(promises);
    },
  },

  // Cache cleanup strategies
  cleanup: {
    // Remove stale data older than specified time
    removeStaleData: (maxAge = 60 * 60 * 1000) => {
      // 1 hour default
      const cache = queryClient.getQueryCache();
      const now = Date.now();

      cache.getAll().forEach((query) => {
        if (
          query.state.dataUpdatedAt &&
          now - query.state.dataUpdatedAt > maxAge
        ) {
          queryClient.removeQueries({ queryKey: query.queryKey });
        }
      });
    },

    // Remove unused queries
    removeUnused: () => {
      const cache = queryClient.getQueryCache();

      cache.getAll().forEach((query) => {
        if (query.getObserversCount() === 0) {
          queryClient.removeQueries({ queryKey: query.queryKey });
        }
      });
    },

    // Selective cleanup based on memory usage
    selectiveCleanup: () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();

      // Sort by last access time and data size
      const sortedQueries = queries
        .filter((query) => query.state.data)
        .sort((a, b) => {
          const aSize = JSON.stringify(a.state.data).length;
          const bSize = JSON.stringify(b.state.data).length;
          const aTime = a.state.dataUpdatedAt || 0;
          const bTime = b.state.dataUpdatedAt || 0;

          // Prioritize removing large, old data
          return bSize * (Date.now() - bTime) - aSize * (Date.now() - aTime);
        });

      // Remove top 20% of least valuable queries
      const toRemove = sortedQueries.slice(
        0,
        Math.ceil(sortedQueries.length * 0.2)
      );
      toRemove.forEach((query) => {
        queryClient.removeQueries({ queryKey: query.queryKey });
      });
    },
  },

  // Cache monitoring and analytics
  monitor: {
    // Get cache statistics
    getStats: () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();

      const stats = {
        totalQueries: queries.length,
        activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
        staleQueries: queries.filter((q) => q.isStale()).length,
        errorQueries: queries.filter((q) => q.state.status === "error").length,
        loadingQueries: queries.filter((q) => q.state.status === "loading")
          .length,
        totalDataSize: queries.reduce((size, query) => {
          if (query.state.data) {
            return size + JSON.stringify(query.state.data).length;
          }
          return size;
        }, 0),
        oldestQuery: Math.min(
          ...queries.map((q) => q.state.dataUpdatedAt || Date.now())
        ),
        newestQuery: Math.max(
          ...queries.map((q) => q.state.dataUpdatedAt || 0)
        ),
      };

      return stats;
    },

    // Log cache performance
    logPerformance: () => {
      const stats = cacheOptimization.monitor.getStats();

      console.group("📊 React Query Cache Stats");

      console.groupEnd();
    },

    // Monitor cache hit rate
    trackHitRate: (() => {
      let hits = 0;
      let misses = 0;

      return {
        recordHit: () => hits++,
        recordMiss: () => misses++,
        getRate: () => ({
          hits,
          misses,
          total: hits + misses,
          rate:
            hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(2) : 0,
        }),
        reset: () => {
          hits = 0;
          misses = 0;
        },
      };
    })(),
  },

  // Background sync strategies
  backgroundSync: {
    // Sync critical data in background
    syncCritical: async () => {
      const criticalQueries = [
        queryKeys.notifications.unreadCount(),
        queryKeys.dashboard.summary(),
        queryKeys.posts.trending(5),
      ];

      const promises = criticalQueries.map((queryKey) =>
        queryClient.refetchQueries({
          queryKey,
          type: "active",
        })
      );

      await Promise.allSettled(promises);
    },

    // Periodic background refresh
    startPeriodicRefresh: (interval = 5 * 60 * 1000) => {
      // 5 minutes
      return setInterval(() => {
        cacheOptimization.backgroundSync.syncCritical();
      }, interval);
    },

    // Smart refresh based on user activity
    refreshOnActivity: (() => {
      let lastActivity = Date.now();
      let refreshTimeout;

      const updateActivity = () => {
        lastActivity = Date.now();

        // Clear existing timeout
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
        }

        // Set new timeout for 2 minutes of inactivity
        refreshTimeout = setTimeout(() => {
          cacheOptimization.backgroundSync.syncCritical();
        }, 2 * 60 * 1000);
      };

      // Listen for user activity
      ["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach(
        (event) => {
          document.addEventListener(event, updateActivity, { passive: true });
        }
      );

      return {
        getLastActivity: () => lastActivity,
        forceRefresh: () => {
          clearTimeout(refreshTimeout);
          cacheOptimization.backgroundSync.syncCritical();
        },
      };
    })(),
  },

  // Memory optimization
  memory: {
    // Estimate memory usage
    estimateUsage: () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();

      let totalSize = 0;
      const breakdown = {};

      queries.forEach((query) => {
        if (query.state.data) {
          const size = JSON.stringify(query.state.data).length;
          totalSize += size;

          const category = query.queryKey[0] || "unknown";
          breakdown[category] = (breakdown[category] || 0) + size;
        }
      });

      return {
        totalBytes: totalSize,
        totalKB: (totalSize / 1024).toFixed(2),
        totalMB: (totalSize / 1024 / 1024).toFixed(2),
        breakdown: Object.entries(breakdown)
          .map(([category, size]) => ({
            category,
            bytes: size,
            kb: (size / 1024).toFixed(2),
            percentage: ((size / totalSize) * 100).toFixed(2),
          }))
          .sort((a, b) => b.bytes - a.bytes),
      };
    },

    // Optimize memory usage
    optimize: () => {
      const usage = cacheOptimization.memory.estimateUsage();

      // If memory usage is high, perform cleanup
      if (usage.totalBytes > 5 * 1024 * 1024) {
        // 5MB threshold
        console.warn("🚨 High memory usage detected, performing cleanup");
        cacheOptimization.cleanup.selectiveCleanup();
      }

      return usage;
    },
  },
};

// Auto-initialize cache optimization
if (typeof window !== "undefined") {
  // Preload critical data on app start
  setTimeout(() => {
    cacheOptimization.preloadCriticalData();
  }, 1000);

  // Start periodic cleanup
  setInterval(() => {
    cacheOptimization.cleanup.removeStaleData();
  }, 30 * 60 * 1000); // Every 30 minutes

  // Monitor memory usage
  setInterval(() => {
    cacheOptimization.memory.optimize();
  }, 10 * 60 * 1000); // Every 10 minutes

  // Log performance in development
  if (import.meta.env.MODE === "development") {
    setInterval(() => {
      cacheOptimization.monitor.logPerformance();
    }, 60 * 1000); // Every minute in dev
  }
}

export default cacheOptimization;
