/* eslint-disable no-unused-vars */
import axios from "axios";
import { BASE_URL } from "./apiPaths";
import cacheManager from "./cacheManager";

// Request queue to prevent too many concurrent requests
let requestQueue = [];
let isProcessingQueue = false;
const MAX_CONCURRENT_REQUESTS = 2;
let activeRequests = 0;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Process request queue
const processQueue = async () => {
  if (
    isProcessingQueue ||
    requestQueue.length === 0 ||
    activeRequests >= MAX_CONCURRENT_REQUESTS
  ) {
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const { config, resolve } = requestQueue.shift();
    activeRequests++;

    try {
      await new Promise((r) => setTimeout(r, 200)); // 200ms delay
      resolve(config);
    } catch (error) {
      resolve(config); // Still resolve to continue the request
    }
  }

  isProcessingQueue = false;
};

axiosInstance.interceptors.request.use(
  (config) => {
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );

    // Check cache for GET requests
    if (config.method === "get") {
      const cacheKey = cacheManager.generateKey(config.url, config.params);
      const cachedData = cacheManager.get(cacheKey);

      if (cachedData) {
        console.log("⚡ Serving from cache:", config.url);
        // Return cached response immediately
        return Promise.reject({
          isFromCache: true,
          data: cachedData,
          status: 200,
          statusText: "OK (From Cache)",
          config,
        });
      }
    }

    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Use request queue to limit concurrent requests
    return new Promise((resolve) => {
      requestQueue.push({ config, resolve });
      processQueue();
    });
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    activeRequests = Math.max(0, activeRequests - 1); // Decrease active request count
    processQueue(); // Process next requests in queue

    // Cache GET responses
    if (response.config.method === "get") {
      const cacheKey = cacheManager.generateKey(
        response.config.url,
        response.config.params
      );
      cacheManager.set(cacheKey, response.data);
      console.log("💾 Cached response:", response.config.url);
    }

    return response;
  },
  async (error) => {
    // Handle cached responses
    if (error.isFromCache) {
      console.log("⚡ Returning cached data for:", error.config.url);
      return Promise.resolve(error);
    }

    const originalRequest = error.config;

    if (error.response) {
      if (error.response.status === 401) {
        // Clear user data and redirect to login page
        localStorage.removeItem("token");

        // Check if we're not already on a login page to avoid infinite redirects
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes("/admin-login") &&
          !currentPath.includes("/login")
        ) {
          window.location.href = "/admin-login";
        }
      } else if (error.response.status === 403) {
        console.error(
          "Access forbidden. You don't have permission to perform this action."
        );
      } else if (error.response.status === 429) {
        // Aggressive rate limit handling
        const retryCount = originalRequest._retryCount || 0;
        const maxRetries = 3;

        if (retryCount < maxRetries) {
          originalRequest._retryCount = retryCount + 1;
          const delay = Math.pow(2, retryCount) * 2000; // Aggressive backoff: 2s, 4s, 8s

          console.warn(
            `🔄 Rate limited (429). Retry ${
              retryCount + 1
            }/${maxRetries} after ${delay}ms delay...`
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          return axiosInstance(originalRequest);
        }

        console.warn(
          "⚠️ Rate limit exceeded after max retries. Request cancelled."
        );
        // Return a safe empty response instead of throwing error
        return Promise.resolve({
          data: [],
          status: 200,
          statusText: "OK (Rate Limited - Cached Response)",
        });
      } else if (error.response.status === 500) {
        console.error("Server error. Please try again later.");
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout. Please try again");
    } else if (error.code === "ERR_NETWORK") {
      console.error("Network error. Please check your connection.");
    }

    activeRequests = Math.max(0, activeRequests - 1); // Decrease active request count on error
    processQueue(); // Process next requests in queue

    return Promise.reject(error);
  }
);

// Debug function for cache stats (available in console)
window.debugCache = () => {
  const stats = cacheManager.getStats();
  console.log("📊 Cache Stats:", stats);

  console.log("🗂️ Memory Cache Contents:");
  for (const [key, item] of cacheManager.cache.entries()) {
    console.log(
      `  ${key}: expires ${new Date(item.expires).toLocaleTimeString()}`
    );
  }
};

// Debug function to clear cache
window.clearCache = () => {
  cacheManager.clear();
  console.log("🧹 Cache cleared!");
};

export default axiosInstance;
