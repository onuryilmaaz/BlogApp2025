import React, { useState, useEffect, useCallback, useMemo } from "react";
import { queryClient } from "../../lib/queryClient";
import cacheOptimization from "../../utils/cacheOptimization";

// Performance metrics collection
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      navigation: null,
      paint: {},
      resources: [],
      memory: null,
      vitals: {},
      reactQuery: {},
      customMetrics: {},
    };

    this.observers = new Map();
    this.startTime = performance.now();
    this.init();
  }

  init() {
    this.collectNavigationMetrics();
    this.collectPaintMetrics();
    this.collectResourceMetrics();
    this.collectMemoryMetrics();
    this.collectWebVitals();
    this.collectReactQueryMetrics();
    this.setupPerformanceObserver();
  }

  collectNavigationMetrics() {
    if ("navigation" in performance) {
      const nav = performance.getEntriesByType("navigation")[0];
      if (nav) {
        this.metrics.navigation = {
          domContentLoaded:
            nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          domInteractive: nav.domInteractive - nav.navigationStart,
          firstByte: nav.responseStart - nav.requestStart,
          dns: nav.domainLookupEnd - nav.domainLookupStart,
          tcp: nav.connectEnd - nav.connectStart,
          ssl:
            nav.secureConnectionStart > 0
              ? nav.connectEnd - nav.secureConnectionStart
              : 0,
          redirect: nav.redirectEnd - nav.redirectStart,
          unload: nav.unloadEventEnd - nav.unloadEventStart,
        };
      }
    }
  }

  collectPaintMetrics() {
    const paintEntries = performance.getEntriesByType("paint");
    paintEntries.forEach((entry) => {
      this.metrics.paint[entry.name] = entry.startTime;
    });
  }

  collectResourceMetrics() {
    const resources = performance.getEntriesByType("resource");
    this.metrics.resources = resources.map((resource) => ({
      name: resource.name,
      type: resource.initiatorType,
      size: resource.transferSize || 0,
      duration: resource.duration,
      startTime: resource.startTime,
      cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
    }));
  }

  collectMemoryMetrics() {
    if ("memory" in performance) {
      this.metrics.memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        usage: (
          (performance.memory.usedJSHeapSize /
            performance.memory.jsHeapSizeLimit) *
          100
        ).toFixed(2),
      };
    }
  }

  collectWebVitals() {
    // Collect Core Web Vitals
    if ("PerformanceObserver" in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.vitals.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.set("lcp", lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.vitals.fid = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
      this.observers.set("fid", fidObserver);

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.vitals.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
      this.observers.set("cls", clsObserver);
    }
  }

  collectReactQueryMetrics() {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    this.metrics.reactQuery = {
      totalQueries: queries.length,
      activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      errorQueries: queries.filter((q) => q.state.status === "error").length,
      loadingQueries: queries.filter((q) => q.state.status === "loading")
        .length,
      cacheSize: this.calculateCacheSize(queries),
      hitRate: cacheOptimization.monitor.trackHitRate.getRate(),
    };
  }

  calculateCacheSize(queries) {
    return queries.reduce((size, query) => {
      if (query.state.data) {
        return size + JSON.stringify(query.state.data).length;
      }
      return size;
    }, 0);
  }

  setupPerformanceObserver() {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === "measure") {
            this.metrics.customMetrics[entry.name] = entry.duration;
          }
        });
      });
      observer.observe({ entryTypes: ["measure"] });
      this.observers.set("custom", observer);
    }
  }

  // Custom performance markers
  mark(name) {
    if ("performance" in window && "mark" in performance) {
      performance.mark(name);
    }
  }

  measure(name, startMark, endMark) {
    if ("performance" in window && "measure" in performance) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn("Performance measure failed:", error);
      }
    }
  }

  getMetrics() {
    this.collectMemoryMetrics();
    this.collectReactQueryMetrics();
    return { ...this.metrics };
  }

  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Performance monitoring component
const PerformanceMonitor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [performanceMetrics] = useState(() => new PerformanceMetrics());
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMetrics.getMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [performanceMetrics, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      performanceMetrics.cleanup();
    };
  }, [performanceMetrics]);

  // Keyboard shortcut to toggle visibility
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === "P") {
        event.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Performance score calculation
  const performanceScore = useMemo(() => {
    if (!metrics) return 0;

    let score = 100;

    // Deduct points based on Core Web Vitals
    if (metrics.vitals.lcp > 2500) score -= 20;
    else if (metrics.vitals.lcp > 1200) score -= 10;

    if (metrics.vitals.fid > 100) score -= 20;
    else if (metrics.vitals.fid > 50) score -= 10;

    if (metrics.vitals.cls > 0.25) score -= 20;
    else if (metrics.vitals.cls > 0.1) score -= 10;

    // Deduct points for memory usage
    if (metrics.memory && metrics.memory.usage > 80) score -= 15;
    else if (metrics.memory && metrics.memory.usage > 60) score -= 8;

    // Deduct points for cache efficiency
    if (metrics.reactQuery.hitRate.rate < 70) score -= 10;
    else if (metrics.reactQuery.hitRate.rate < 85) score -= 5;

    return Math.max(0, Math.min(100, score));
  }, [metrics]);

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
          title="Open Performance Monitor (Ctrl+Shift+P)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Performance Monitor
            </h2>
            <div
              className={`text-2xl font-bold ${getScoreColor(
                performanceScore
              )}`}
            >
              {performanceScore}/100
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {["overview", "vitals", "network", "memory", "cache"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  selectedTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {selectedTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Core Web Vitals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Core Web Vitals</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>LCP:</span>
                    <span
                      className={
                        metrics?.vitals.lcp > 2500
                          ? "text-red-600"
                          : metrics?.vitals.lcp > 1200
                          ? "text-yellow-600"
                          : "text-green-600"
                      }
                    >
                      {metrics?.vitals.lcp
                        ? formatTime(metrics.vitals.lcp)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>FID:</span>
                    <span
                      className={
                        metrics?.vitals.fid > 100
                          ? "text-red-600"
                          : metrics?.vitals.fid > 50
                          ? "text-yellow-600"
                          : "text-green-600"
                      }
                    >
                      {metrics?.vitals.fid
                        ? formatTime(metrics.vitals.fid)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLS:</span>
                    <span
                      className={
                        metrics?.vitals.cls > 0.25
                          ? "text-red-600"
                          : metrics?.vitals.cls > 0.1
                          ? "text-yellow-600"
                          : "text-green-600"
                      }
                    >
                      {metrics?.vitals.cls
                        ? metrics.vitals.cls.toFixed(3)
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              {metrics?.memory && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Memory Usage</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span>{formatBytes(metrics.memory.used)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>{formatBytes(metrics.memory.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usage:</span>
                      <span
                        className={
                          metrics.memory.usage > 80
                            ? "text-red-600"
                            : metrics.memory.usage > 60
                            ? "text-yellow-600"
                            : "text-green-600"
                        }
                      >
                        {metrics.memory.usage}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* React Query Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">React Query</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Queries:</span>
                    <span>{metrics?.reactQuery.totalQueries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active:</span>
                    <span>{metrics?.reactQuery.activeQueries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Size:</span>
                    <span>
                      {formatBytes(metrics?.reactQuery.cacheSize || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hit Rate:</span>
                    <span
                      className={
                        metrics?.reactQuery.hitRate.rate < 70
                          ? "text-red-600"
                          : metrics?.reactQuery.hitRate.rate < 85
                          ? "text-yellow-600"
                          : "text-green-600"
                      }
                    >
                      {metrics?.reactQuery.hitRate.rate || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === "vitals" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold mb-2 text-blue-600">
                    {metrics?.vitals.lcp
                      ? formatTime(metrics.vitals.lcp)
                      : "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Largest Contentful Paint
                  </div>
                  <div className="text-xs text-gray-500">
                    Good: &lt; 1.2s, Needs Improvement: 1.2s-2.5s, Poor: &gt;
                    2.5s
                  </div>
                </div>

                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold mb-2 text-green-600">
                    {metrics?.vitals.fid
                      ? formatTime(metrics.vitals.fid)
                      : "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    First Input Delay
                  </div>
                  <div className="text-xs text-gray-500">
                    Good: &lt; 50ms, Needs Improvement: 50ms-100ms, Poor: &gt;
                    100ms
                  </div>
                </div>

                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold mb-2 text-yellow-600">
                    {metrics?.vitals.cls
                      ? metrics.vitals.cls.toFixed(3)
                      : "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Cumulative Layout Shift
                  </div>
                  <div className="text-xs text-gray-500">
                    Good: &lt; 0.1, Needs Improvement: 0.1-0.25, Poor: &gt; 0.25
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === "network" && (
            <div className="space-y-4">
              <h3 className="font-semibold">Resource Loading</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cached
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics?.resources.slice(0, 20).map((resource, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">
                          {resource.name.split("/").pop()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {resource.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatBytes(resource.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(resource.duration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              resource.cached
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {resource.cached ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedTab === "memory" && metrics?.memory && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">Heap Memory</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span className="font-mono">
                        {formatBytes(metrics.memory.used)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-mono">
                        {formatBytes(metrics.memory.total)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Limit:</span>
                      <span className="font-mono">
                        {formatBytes(metrics.memory.limit)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Usage</span>
                      <span>{metrics.memory.usage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          metrics.memory.usage > 80
                            ? "bg-red-500"
                            : metrics.memory.usage > 60
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${metrics.memory.usage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">Memory Recommendations</h3>
                  <div className="space-y-2 text-sm">
                    {metrics.memory.usage > 80 && (
                      <div className="text-red-600">
                        ⚠️ High memory usage detected
                      </div>
                    )}
                    {metrics.memory.usage > 60 && (
                      <div className="text-yellow-600">
                        ⚡ Consider optimizing memory usage
                      </div>
                    )}
                    {metrics.memory.usage <= 60 && (
                      <div className="text-green-600">
                        ✅ Memory usage is optimal
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === "cache" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Query Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>{metrics?.reactQuery.totalQueries || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <span className="text-green-600">
                        {metrics?.reactQuery.activeQueries || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stale:</span>
                      <span className="text-yellow-600">
                        {metrics?.reactQuery.staleQueries || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error:</span>
                      <span className="text-red-600">
                        {metrics?.reactQuery.errorQueries || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loading:</span>
                      <span className="text-blue-600">
                        {metrics?.reactQuery.loadingQueries || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Cache Performance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Hit Rate:</span>
                      <span
                        className={
                          metrics?.reactQuery.hitRate.rate < 70
                            ? "text-red-600"
                            : metrics?.reactQuery.hitRate.rate < 85
                            ? "text-yellow-600"
                            : "text-green-600"
                        }
                      >
                        {metrics?.reactQuery.hitRate.rate || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hits:</span>
                      <span className="text-green-600">
                        {metrics?.reactQuery.hitRate.hits || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Misses:</span>
                      <span className="text-red-600">
                        {metrics?.reactQuery.hitRate.misses || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cache Size:</span>
                      <span>
                        {formatBytes(metrics?.reactQuery.cacheSize || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        cacheOptimization.cleanup.removeStaleData()
                      }
                      className="w-full text-left px-3 py-2 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                    >
                      Clean Stale Data
                    </button>
                    <button
                      onClick={() => cacheOptimization.cleanup.removeUnused()}
                      className="w-full text-left px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      Remove Unused
                    </button>
                    <button
                      onClick={() => cacheOptimization.monitor.logPerformance()}
                      className="w-full text-left px-3 py-2 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                    >
                      Log Performance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
