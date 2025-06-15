const rateLimit = require("express-rate-limit");

// General rate limiter for most endpoints (very lenient for development)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased from 5 to 50 login/register attempts per windowMs
  message: {
    error:
      "Too many authentication attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for comment creation
const commentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Increased from 10 to 100 comments per 5 minutes
  message: {
    error: "Too many comments from this IP, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for AI endpoints (more restrictive due to API costs)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Increased from 20 to 100 AI requests per hour
  message: {
    error: "Too many AI requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  commentLimiter,
  aiLimiter,
};
