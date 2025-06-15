require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
const logger = require("./config/logger");
const { generalLimiter } = require("./middlewares/rateLimiter");
const { cacheMiddleware } = require("./middlewares/cacheMiddleware");
const {
  compressionMiddleware,
  performanceMonitor,
  optimizeResponse,
} = require("./middlewares/performanceMiddleware");

const authRoutes = require("./routes/authRoutes");
const blogPostRoutes = require("./routes/blogPostRoutes");
const commentsRoutes = require("./routes/commentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");
const tagRoutes = require("./routes/tagRoutes");
const searchRoutes = require("./routes/searchRoutes");
const userRoutes = require("./routes/userRoutes");

// Import error handling middleware
const {
  errorHandler,
  notFoundHandler,
} = require("./middlewares/errorMiddleware");

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Allow embedding for uploads
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests
    contentSecurityPolicy: false, // Disable CSP for development
  })
);

// Apply performance middleware (compression, etc.)
app.use(compressionMiddleware);
// app.use(performanceMonitor);
// app.use(optimizeResponse);

// Apply general rate limiting to all requests
app.use(generalLimiter);

// HTTP request logging
app.use(morgan("combined", { stream: logger.stream }));

//Middleware to handle CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "http://localhost:3000"
        : ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Connect DB
connectDB();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", blogPostRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/dashboard-summary", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/users", userRoutes);

// Server Uploads folder with CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  },
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, path) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  })
);

app.use(
  "/uploads/optimized",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  },
  express.static(path.join(__dirname, "uploads/optimized"), {
    setHeaders: (res, path) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  })
);

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last middleware)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
