const config = require("../config/config");

// Initialize Sentry (optional dependency)
let Sentry = null;
try {
  if (config.SENTRY?.DSN) {
    Sentry = require("@sentry/node");
    Sentry.init({
      dsn: config.SENTRY.DSN,
      environment: config.NODE_ENV,
      tracesSampleRate: config.NODE_ENV === "production" ? 0.1 : 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: require("express")() }),
      ],
    });
    console.log("✅ Sentry Error Monitoring Initialized");
  }
} catch (error) {
  console.warn("⚠️ Sentry not available, using local error handling");
}

// Error types for categorization
const ErrorTypes = {
  VALIDATION_ERROR: "ValidationError",
  AUTHENTICATION_ERROR: "AuthenticationError",
  AUTHORIZATION_ERROR: "AuthorizationError",
  NOT_FOUND_ERROR: "NotFoundError",
  DATABASE_ERROR: "DatabaseError",
  EXTERNAL_SERVICE_ERROR: "ExternalServiceError",
  RATE_LIMIT_ERROR: "RateLimitError",
  FILE_UPLOAD_ERROR: "FileUploadError",
  INTERNAL_SERVER_ERROR: "InternalServerError",
};

// Custom Error Classes
class AppError extends Error {
  constructor(
    message,
    statusCode,
    type = ErrorTypes.INTERNAL_SERVER_ERROR,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = {}) {
    super(message, 400, ErrorTypes.VALIDATION_ERROR);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401, ErrorTypes.AUTHENTICATION_ERROR);
  }
}

class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403, ErrorTypes.AUTHORIZATION_ERROR);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, ErrorTypes.NOT_FOUND_ERROR);
  }
}

class DatabaseError extends AppError {
  constructor(message = "Database operation failed") {
    super(message, 500, ErrorTypes.DATABASE_ERROR);
  }
}

class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, ErrorTypes.RATE_LIMIT_ERROR);
  }
}

// Error logging utility
const logError = (error, req = null) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    type: error.type || ErrorTypes.INTERNAL_SERVER_ERROR,
    message: error.message,
    statusCode: error.statusCode || 500,
    stack: error.stack,
    ...(req && {
      url: req.originalUrl || req.url,
      method: req.method,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      userId: req.user?.id,
    }),
  };

  // Log to console in development
  if (config.NODE_ENV === "development") {
    console.error("🚨 Error Log:", JSON.stringify(errorLog, null, 2));
  }

  // Send to Sentry if available
  if (Sentry && error.isOperational !== false) {
    Sentry.withScope((scope) => {
      if (req) {
        scope.setTag("endpoint", `${req.method} ${req.originalUrl}`);
        scope.setUser({
          id: req.user?.id,
          email: req.user?.email,
          ip_address: req.ip,
        });
      }
      scope.setLevel("error");
      scope.setContext("error_details", {
        type: error.type,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
      });
      Sentry.captureException(error);
    });
  }

  return errorLog;
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database error handler
const handleDatabaseError = (error) => {
  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return new ValidationError(`${field} already exists`, {
      [field]: `This ${field} is already taken`,
    });
  }

  // MongoDB validation error
  if (error.name === "ValidationError") {
    const errors = {};
    Object.keys(error.errors).forEach((key) => {
      errors[key] = error.errors[key].message;
    });
    return new ValidationError("Validation failed", errors);
  }

  // MongoDB cast error
  if (error.name === "CastError") {
    return new ValidationError(`Invalid ${error.path}: ${error.value}`);
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return new AuthenticationError("Invalid token");
  }

  if (error.name === "TokenExpiredError") {
    return new AuthenticationError("Token expired");
  }

  // Default database error
  return new DatabaseError("Database operation failed");
};

// Main error handling middleware
const errorHandler = (error, req, res, next) => {
  let handledError = error;

  // Handle known error types
  if (!error.isOperational) {
    handledError = handleDatabaseError(error);
  }

  // Log the error
  const errorLog = logError(handledError, req);

  // Prepare response
  const response = {
    error: {
      message: handledError.message,
      type: handledError.type,
      timestamp: handledError.timestamp,
      ...(config.NODE_ENV === "development" && {
        stack: handledError.stack,
        details: errorLog,
      }),
    },
  };

  // Add validation errors if present
  if (handledError.errors) {
    response.error.errors = handledError.errors;
  }

  // Send error response
  res.status(handledError.statusCode || 500).json(response);
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Health check for error monitoring
const errorMonitoringHealth = async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    errorMonitoring: {
      sentry: !!Sentry,
      environment: config.NODE_ENV,
      ...(Sentry && {
        dsn: config.SENTRY?.DSN ? "configured" : "not configured",
      }),
    },
  };

  res.json(health);
};

// Performance monitoring for errors
const trackErrorMetrics = () => {
  const metrics = {
    totalErrors: 0,
    errorsByType: {},
    errorsByEndpoint: {},
    lastErrors: [],
  };

  return (error, req) => {
    metrics.totalErrors++;

    // Track by type
    const type = error.type || "unknown";
    metrics.errorsByType[type] = (metrics.errorsByType[type] || 0) + 1;

    // Track by endpoint
    if (req) {
      const endpoint = `${req.method} ${req.route?.path || req.originalUrl}`;
      metrics.errorsByEndpoint[endpoint] =
        (metrics.errorsByEndpoint[endpoint] || 0) + 1;
    }

    // Keep last 10 errors
    metrics.lastErrors.unshift({
      type,
      message: error.message,
      timestamp: new Date().toISOString(),
      endpoint: req ? `${req.method} ${req.originalUrl}` : "unknown",
    });

    if (metrics.lastErrors.length > 10) {
      metrics.lastErrors.pop();
    }

    return metrics;
  };
};

const errorMetrics = trackErrorMetrics();

// Get error statistics
const getErrorStats = (req, res) => {
  res.json(errorMetrics);
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  RateLimitError,
  ErrorTypes,

  // Middleware
  errorHandler,
  notFoundHandler,
  asyncHandler,

  // Utilities
  logError,
  errorMonitoringHealth,
  getErrorStats,

  // Sentry instance (if available)
  Sentry,
};
