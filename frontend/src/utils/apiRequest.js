import axiosInstance from "./axiosInstance";

/**
 * Generic API request function
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} options.data - Request body data
 * @param {Object} options.params - URL parameters
 * @param {Object} options.headers - Additional headers
 * @returns {Promise} - Axios response promise
 */
export const apiRequest = async (url, options = {}) => {
  const {
    method = "GET",
    data = null,
    params = null,
    headers = {},
    ...otherOptions
  } = options;

  try {
    const config = {
      method: method.toLowerCase(),
      url,
      ...otherOptions,
    };

    // Add data for POST, PUT, PATCH requests
    if (data && ["post", "put", "patch"].includes(config.method)) {
      config.data = data;
    }

    // Add params for GET requests or as query parameters
    if (params) {
      config.params = params;
    }

    // Add additional headers
    if (Object.keys(headers).length > 0) {
      config.headers = {
        ...config.headers,
        ...headers,
      };
    }

    const response = await axiosInstance(config);
    return response;
  } catch (error) {
    // Handle cached responses from axios interceptor
    if (error.isFromCache) {
      return error; // This is actually a successful cached response
    }

    // Re-throw other errors to be handled by the calling code
    throw error;
  }
};

// Convenience methods for common HTTP verbs
export const get = (url, params = null, options = {}) =>
  apiRequest(url, { method: "GET", params, ...options });

export const post = (url, data = null, options = {}) =>
  apiRequest(url, { method: "POST", data, ...options });

export const put = (url, data = null, options = {}) =>
  apiRequest(url, { method: "PUT", data, ...options });

export const patch = (url, data = null, options = {}) =>
  apiRequest(url, { method: "PATCH", data, ...options });

export const del = (url, options = {}) =>
  apiRequest(url, { method: "DELETE", ...options });

// Export as default
export default apiRequest;
