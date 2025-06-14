const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const logger = require("../config/logger");

// Configure Storage for temporary files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = "uploads/temp/";
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File Filter with enhanced validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  const maxSize = 30 * 1024 * 1024; // 30MB

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only .jpeg, .jpg, .png and .webp formats are allowed"),
      false
    );
  }

  cb(null, true);
};

// Multer configuration with size limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only one file at a time
  },
});

// Image optimization middleware
const optimizeImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const tempPath = req.file.path;
    const optimizedDir = "uploads/optimized/";

    if (!fs.existsSync(optimizedDir)) {
      fs.mkdirSync(optimizedDir, { recursive: true });
    }

    const optimizedFilename = `optimized-${req.file.filename}`;
    const optimizedPath = path.join(optimizedDir, optimizedFilename);

    // Optimize image with sharp
    await sharp(tempPath)
      .resize(1200, 800, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toFile(optimizedPath);

    // Remove temporary file
    fs.unlinkSync(tempPath);

    // Update req.file with optimized file info
    req.file.path = optimizedPath;
    req.file.filename = optimizedFilename;
    req.file.destination = optimizedDir;

    logger.info(`Image optimized: ${optimizedFilename}`);
    next();
  } catch (error) {
    logger.error("Image optimization failed:", error);

    // If optimization fails, clean up temp file and return error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      message: "Image processing failed",
      error: error.message,
    });
  }
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large. Maximum size is 10MB.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Too many files. Only one file is allowed.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: 'Unexpected field name. Use "image" as field name.',
      });
    }
  }

  if (error.message.includes("Only")) {
    return res.status(400).json({
      message: error.message,
    });
  }

  logger.error("Upload error:", error);
  return res.status(500).json({
    message: "Upload failed",
    error: error.message,
  });
};

module.exports = {
  upload,
  optimizeImage,
  handleUploadError,
};
