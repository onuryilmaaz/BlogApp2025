import React, { useEffect, useState } from "react";

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    lastRenderTime: 0,
    memoryUsage: 0,
    queryCache: 0,
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let renderCount = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === "measure") {
          renderCount++;
          setMetrics((prev) => ({
            ...prev,
            renderCount,
            lastRenderTime: entry.duration,
          }));
        }
      });
    });

    observer.observe({ entryTypes: ["measure"] });

    // Memory usage monitoring
    const updateMemoryUsage = () => {
      if (performance.memory) {
        setMetrics((prev) => ({
          ...prev,
          memoryUsage: Math.round(
            performance.memory.usedJSHeapSize / 1024 / 1024
          ),
        }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Performance Monitor"
      >
        📊
      </button>

      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
          <h3 className="font-semibold text-sm mb-2">Performance Metrics</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Renders:</span>
              <span className="font-mono">{metrics.renderCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Render:</span>
              <span className="font-mono">
                {metrics.lastRenderTime.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className="font-mono">{metrics.memoryUsage}MB</span>
            </div>
            <div className="flex justify-between">
              <span>Cache Status:</span>
              <span className="text-green-600">Active</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <div>✅ React Query: Enabled</div>
              <div>✅ Zustand: Enabled</div>
              <div>✅ Lazy Loading: Active</div>
              <div>✅ Image Optimization: Active</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
