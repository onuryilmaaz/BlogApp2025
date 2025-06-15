require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const http = require("http");
const connectDB = require("./config/db");
const { generalLimiter } = require("./middlewares/rateLimiter");
const { cacheMiddleware } = require("./middlewares/cacheMiddleware");
const {
  compressionMiddleware,
  performanceMonitor,
  optimizeResponse,
} = require("./middlewares/performanceMiddleware");
const { initializeSocket } = require("./socket/socketHandler");

const authRoutes = require("./routes/authRoutes");
const blogPostRoutes = require("./routes/blogPostRoutes");
const commentsRoutes = require("./routes/commentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");
const tagRoutes = require("./routes/tagRoutes");
const searchRoutes = require("./routes/searchRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

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

//Middleware to handle CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === "production") {
        // In production, only allow specific origins
        const allowedOrigins = [
          process.env.FRONTEND_URL || "http://localhost:3000",
        ];
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      } else {
        // In development, allow all origins
        callback(null, true);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    preflightContinue: false,
  })
);

// Additional CORS headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (process.env.NODE_ENV === "development") {
    // In development, allow all origins
    res.header("Access-Control-Allow-Origin", origin || "*");
  } else {
    // In production, be more restrictive
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
    ];
    if (allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Connect DB
connectDB();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Test endpoint for CORS
app.get("/api/test", (req, res) => {
  res.json({
    message: "CORS is working!",
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || "no-origin",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", blogPostRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/dashboard-summary", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

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

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
initializeSocket(server);

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server initialized`);
});
