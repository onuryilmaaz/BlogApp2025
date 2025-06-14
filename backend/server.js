require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
const logger = require("./config/logger");
const { generalLimiter } = require("./middlewares/rateLimiter");

const authRoutes = require("./routes/authRoutes");
const blogPostRoutes = require("./routes/blogPostRoutes");
const commentsRoutes = require("./routes/commentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Allow embedding for uploads
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests
    contentSecurityPolicy: false, // Disable CSP for development
  })
);

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

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : err.message,
  });
});

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
