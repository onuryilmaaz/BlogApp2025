import { toast } from "react-hot-toast";

// Error types and categories
export const ERROR_TYPES = {
  NETWORK: "NETWORK_ERROR",
  VALIDATION: "VALIDATION_ERROR",
  AUTHENTICATION: "AUTH_ERROR",
  AUTHORIZATION: "AUTHORIZATION_ERROR",
  NOT_FOUND: "NOT_FOUND_ERROR",
  SERVER: "SERVER_ERROR",
  CLIENT: "CLIENT_ERROR",
  TIMEOUT: "TIMEOUT_ERROR",
  RATE_LIMIT: "RATE_LIMIT_ERROR",
  UNKNOWN: "UNKNOWN_ERROR",
};

export const ERROR_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

// Error logging service
class ErrorLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.enableConsoleLogging = import.meta.env.MODE === "development";
    this.enableRemoteLogging = import.meta.env.MODE === "production";
    this.remoteEndpoint = "/api/logs/client-errors";
  }

  log(error, context = {}) {
    const errorLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      error: this.serializeError(error),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      severity: this.determineSeverity(error),
      type: this.determineErrorType(error),
    };

    this.addToLocalLogs(errorLog);

    if (this.enableConsoleLogging) {
      this.logToConsole(errorLog);
    }

    if (this.enableRemoteLogging) {
      this.logToRemote(errorLog);
    }

    return errorLog;
  }

  serializeError(error) {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    if (typeof error === "string") {
      return { message: error };
    }

    if (error && typeof error === "object") {
      return {
        ...error,
        message: error.message || "Unknown error",
      };
    }

    return { message: String(error) };
  }

  determineSeverity(error) {
    if (error?.response?.status >= 500) return ERROR_SEVERITY.HIGH;
    if (error?.response?.status === 401) return ERROR_SEVERITY.MEDIUM;
    if (error?.response?.status === 403) return ERROR_SEVERITY.MEDIUM;
    if (error?.response?.status === 404) return ERROR_SEVERITY.LOW;
    if (error?.code === "NETWORK_ERROR") return ERROR_SEVERITY.HIGH;
    return ERROR_SEVERITY.LOW;
  }

  determineErrorType(error) {
    if (error?.code === "NETWORK_ERROR") return ERROR_TYPES.NETWORK;
    if (error?.response?.status === 401) return ERROR_TYPES.AUTHENTICATION;
    if (error?.response?.status === 403) return ERROR_TYPES.AUTHORIZATION;
    if (error?.response?.status === 404) return ERROR_TYPES.NOT_FOUND;
    if (error?.response?.status === 429) return ERROR_TYPES.RATE_LIMIT;
    if (error?.response?.status >= 500) return ERROR_TYPES.SERVER;
    if (error?.response?.status >= 400) return ERROR_TYPES.CLIENT;
    if (error?.name === "TimeoutError") return ERROR_TYPES.TIMEOUT;
    return ERROR_TYPES.UNKNOWN;
  }

  addToLocalLogs(errorLog) {
    this.logs.unshift(errorLog);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    try {
      const recentLogs = this.logs.slice(0, 50);
      localStorage.setItem("errorLogs", JSON.stringify(recentLogs));
    } catch (e) {
      console.warn("Failed to store error logs:", e);
    }
  }

  logToConsole(errorLog) {
    const { error, context, severity, type } = errorLog;

    console.group(`🚨 ${type} [${severity.toUpperCase()}]`);
    console.error("Error:", error);
    console.error("Context:", context);
    console.groupEnd();
  }

  async logToRemote(errorLog) {
    try {
      if (this.remoteLogTimeout) {
        clearTimeout(this.remoteLogTimeout);
      }

      this.remoteLogTimeout = setTimeout(async () => {
        await fetch(this.remoteEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(errorLog),
        });
      }, 1000);
    } catch (e) {
      console.warn("Failed to log error to remote service:", e);
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getUserId() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.id || "anonymous";
    } catch {
      return "anonymous";
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
  }

  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    if (filters.severity) {
      filteredLogs = filteredLogs.filter(
        (log) => log.severity === filters.severity
      );
    }

    if (filters.type) {
      filteredLogs = filteredLogs.filter((log) => log.type === filters.type);
    }

    return filteredLogs;
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem("errorLogs");
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

// Error handler functions
export const handleError = (error, context = {}, showToast = true) => {
  const errorLog = errorLogger.log(error, context);

  if (showToast) {
    showErrorToast(error, errorLog.type);
  }

  // Handle specific error types
  switch (errorLog.type) {
    case ERROR_TYPES.AUTHENTICATION:
      handleAuthError(error);
      break;
    case ERROR_TYPES.NETWORK:
      handleNetworkError(error);
      break;
    default:
      break;
  }

  return errorLog;
};

// Specific error handlers
const handleAuthError = (error) => {
  console.error(error);
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (!window.location.pathname.includes("login")) {
    setTimeout(() => {
      window.location.href = "/admin-login";
    }, 2000);
  }
};

const handleNetworkError = (error) => {
  if (!navigator.onLine) {
    toast.error("You appear to be offline. Please check your connection.");
    return;
  }
  toast.error("Network error. Please try again.");
  console.error(error);
};

// User-friendly error messages
const getErrorMessage = (error, errorType) => {
  const messages = {
    [ERROR_TYPES.NETWORK]: "Connection problem. Please check your internet.",
    [ERROR_TYPES.AUTHENTICATION]: "Please log in to continue.",
    [ERROR_TYPES.AUTHORIZATION]: "You do not have permission for this action.",
    [ERROR_TYPES.NOT_FOUND]: "The requested resource was not found.",
    [ERROR_TYPES.SERVER]: "Server error. Please try again later.",
    [ERROR_TYPES.VALIDATION]: "Please check your input and try again.",
    [ERROR_TYPES.TIMEOUT]: "Request timed out. Please try again.",
    [ERROR_TYPES.RATE_LIMIT]: "Too many requests. Please slow down.",
    [ERROR_TYPES.UNKNOWN]: "Something went wrong. Please try again.",
  };

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message && typeof error.message === "string") {
    return error.message;
  }

  return messages[errorType] || messages[ERROR_TYPES.UNKNOWN];
};

const showErrorToast = (error, errorType) => {
  const message = getErrorMessage(error, errorType);

  if (
    errorType === ERROR_TYPES.NOT_FOUND &&
    window.location.pathname.includes("admin")
  ) {
    return;
  }

  toast.error(message, {
    duration: 5000,
    id: `error-${errorType}`,
  });
};

// Global error handlers
export const setupGlobalErrorHandlers = () => {
  window.addEventListener("unhandledrejection", (event) => {
    handleError(event.reason, {
      type: "unhandledrejection",
    });
  });

  window.addEventListener("error", (event) => {
    handleError(event.error || event.message, {
      type: "javascript",
      filename: event.filename,
      lineno: event.lineno,
    });
  });
};

// Initialize global error handling
if (typeof window !== "undefined") {
  setupGlobalErrorHandlers();

  try {
    const storedLogs = localStorage.getItem("errorLogs");
    if (storedLogs) {
      errorLogger.logs = JSON.parse(storedLogs);
    }
  } catch (e) {
    console.warn("Failed to load persisted error logs:", e);
  }
}

export default {
  handleError,
  errorLogger,
  ERROR_TYPES,
  ERROR_SEVERITY,
};
