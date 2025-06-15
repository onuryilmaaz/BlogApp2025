const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");

// Image optimization configurations
const IMAGE_CONFIGS = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 300, height: 200, quality: 85 },
  medium: { width: 600, height: 400, quality: 90 },
  large: { width: 1200, height: 800, quality: 95 },
  hero: { width: 1920, height: 1080, quality: 95 },
  avatar: { width: 200, height: 200, quality: 90 },
  cover: { width: 1200, height: 630, quality: 90 }, // Social media optimized
};

// Supported formats
const SUPPORTED_FORMATS = ["jpeg", "jpg", "png", "webp", "avif"];
const OUTPUT_FORMATS = ["webp", "jpeg"]; // Modern format first

// Generate cache key for processed images
const generateCacheKey = (filename, config, format) => {
  const hash = crypto.createHash("md5");
  hash.update(`${filename}-${JSON.stringify(config)}-${format}`);
  return hash.digest("hex");
};

// Ensure directory exists
const ensureDir = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Get image metadata
const getImageMetadata = async (inputPath) => {
  try {
    const metadata = await sharp(inputPath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha,
      density: metadata.density,
    };
  } catch (error) {
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
};

// Optimize single image with specific config
const optimizeImage = async (
  inputPath,
  outputPath,
  config,
  format = "webp"
) => {
  try {
    let pipeline = sharp(inputPath);

    // Resize if dimensions specified
    if (config.width || config.height) {
      pipeline = pipeline.resize(config.width, config.height, {
        fit: config.fit || "cover",
        position: config.position || "center",
        withoutEnlargement: true,
      });
    }

    // Apply format-specific optimizations
    switch (format) {
      case "webp":
        pipeline = pipeline.webp({
          quality: config.quality || 90,
          effort: 6, // Maximum compression effort
          smartSubsample: true,
        });
        break;

      case "avif":
        pipeline = pipeline.avif({
          quality: config.quality || 90,
          effort: 9, // Maximum compression effort
        });
        break;

      case "jpeg":
      case "jpg":
        pipeline = pipeline.jpeg({
          quality: config.quality || 90,
          progressive: true,
          mozjpeg: true, // Use mozjpeg encoder for better compression
        });
        break;

      case "png":
        pipeline = pipeline.png({
          quality: config.quality || 90,
          compressionLevel: 9,
          progressive: true,
        });
        break;
    }

    // Apply additional optimizations
    pipeline = pipeline
      .sharpen() // Slight sharpening after resize
      .normalize(); // Normalize contrast

    await pipeline.toFile(outputPath);

    // Get output file stats
    const stats = await fs.stat(outputPath);
    return {
      path: outputPath,
      size: stats.size,
      format,
    };
  } catch (error) {
    throw new Error(`Failed to optimize image: ${error.message}`);
  }
};

// Generate multiple image variants
const generateImageVariants = async (
  inputPath,
  baseOutputPath,
  variants = ["thumbnail", "medium", "large"]
) => {
  const results = {};
  const originalName = path.parse(baseOutputPath).name;
  const outputDir = path.dirname(baseOutputPath);

  // Ensure output directory exists
  await ensureDir(outputDir);

  // Get original image metadata
  const metadata = await getImageMetadata(inputPath);

  for (const variant of variants) {
    const config = IMAGE_CONFIGS[variant];
    if (!config) {
      console.warn(`Unknown image variant: ${variant}`);
      continue;
    }

    // Skip if original is smaller than target
    if (metadata.width < config.width && metadata.height < config.height) {
      continue;
    }

    const variantResults = {};

    // Generate multiple formats for each variant
    for (const format of OUTPUT_FORMATS) {
      const outputPath = path.join(
        outputDir,
        `${originalName}-${variant}.${format}`
      );

      try {
        const result = await optimizeImage(
          inputPath,
          outputPath,
          config,
          format
        );
        variantResults[format] = {
          ...result,
          width: config.width,
          height: config.height,
          url: `/uploads/optimized/${path.basename(outputPath)}`,
        };
      } catch (error) {
        console.error(
          `Failed to generate ${variant} ${format}:`,
          error.message
        );
      }
    }

    if (Object.keys(variantResults).length > 0) {
      results[variant] = variantResults;
    }
  }

  return results;
};

// Middleware for processing uploaded images
const processUploadedImage = async (req, res, next) => {
  if (!req.file || !req.file.path) {
    return next();
  }

  try {
    const inputPath = req.file.path;
    const filename = req.file.filename;
    const optimizedDir = path.join(path.dirname(inputPath), "optimized");

    // Ensure optimized directory exists
    await ensureDir(optimizedDir);

    // Determine variants based on image type
    let variants = ["thumbnail", "medium", "large"];

    // Add specific variants based on context
    if (req.body.type === "avatar") {
      variants = ["avatar", "thumbnail"];
    } else if (req.body.type === "cover") {
      variants = ["cover", "large", "medium"];
    } else if (req.body.type === "hero") {
      variants = ["hero", "large", "medium"];
    }

    // Generate optimized variants
    const baseOutputPath = path.join(optimizedDir, filename);
    const optimizedImages = await generateImageVariants(
      inputPath,
      baseOutputPath,
      variants
    );

    // Get original image metadata
    const metadata = await getImageMetadata(inputPath);

    // Attach optimized images to request
    req.optimizedImages = {
      original: {
        path: inputPath,
        url: `/uploads/${filename}`,
        metadata,
      },
      variants: optimizedImages,
    };

    
  } catch (error) {
    console.error("Image optimization error:", error);
    // Don't fail the request if optimization fails
  }

  next();
};

// Middleware for serving optimized images
const serveOptimizedImage = async (req, res, next) => {
  const { filename } = req.params;
  const { format = "webp", variant = "medium" } = req.query;

  try {
    const uploadsDir = path.join(__dirname, "../uploads");
    const optimizedDir = path.join(uploadsDir, "optimized");
    const originalPath = path.join(uploadsDir, filename);

    // Parse filename to get base name and extension
    const parsedPath = path.parse(filename);
    const baseName = parsedPath.name;

    // Construct optimized image path
    const optimizedFilename = `${baseName}-${variant}.${format}`;
    const optimizedPath = path.join(optimizedDir, optimizedFilename);

    // Check if optimized version exists
    try {
      await fs.access(optimizedPath);
      // Serve optimized version
      return res.sendFile(optimizedPath);
    } catch {
      // Optimized version doesn't exist, generate it
      if (
        await fs
          .access(originalPath)
          .then(() => true)
          .catch(() => false)
      ) {
        const config = IMAGE_CONFIGS[variant] || IMAGE_CONFIGS.medium;
        await ensureDir(optimizedDir);
        await optimizeImage(originalPath, optimizedPath, config, format);
        return res.sendFile(optimizedPath);
      }
    }

    // Fall back to original if available
    try {
      await fs.access(originalPath);
      return res.sendFile(originalPath);
    } catch {
      return res.status(404).json({ error: "Image not found" });
    }
  } catch (error) {
    console.error("Error serving optimized image:", error);
    next(error);
  }
};

// Clean up old optimized images
const cleanupOptimizedImages = async (maxAge = 30 * 24 * 60 * 60 * 1000) => {
  // 30 days
  try {
    const optimizedDir = path.join(__dirname, "../uploads/optimized");
    const files = await fs.readdir(optimizedDir);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      const filePath = path.join(optimizedDir, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        cleaned++;
      }
    }

    return cleaned;
  } catch (error) {
    console.error("Error cleaning up optimized images:", error);
    return 0;
  }
};

// Get image optimization stats
const getOptimizationStats = async () => {
  try {
    const uploadsDir = path.join(__dirname, "../uploads");
    const optimizedDir = path.join(uploadsDir, "optimized");

    const [originalFiles, optimizedFiles] = await Promise.all([
      fs.readdir(uploadsDir).catch(() => []),
      fs.readdir(optimizedDir).catch(() => []),
    ]);

    // Calculate total sizes
    let originalSize = 0;
    let optimizedSize = 0;

    for (const file of originalFiles) {
      if (
        file.endsWith(".jpg") ||
        file.endsWith(".jpeg") ||
        file.endsWith(".png")
      ) {
        const stats = await fs
          .stat(path.join(uploadsDir, file))
          .catch(() => null);
        if (stats) originalSize += stats.size;
      }
    }

    for (const file of optimizedFiles) {
      const stats = await fs
        .stat(path.join(optimizedDir, file))
        .catch(() => null);
      if (stats) optimizedSize += stats.size;
    }

    return {
      originalFiles: originalFiles.length,
      optimizedFiles: optimizedFiles.length,
      originalSize,
      optimizedSize,
      compressionRatio:
        originalSize > 0
          ? (((originalSize - optimizedSize) / originalSize) * 100).toFixed(2)
          : 0,
      spaceSaved: originalSize - optimizedSize,
    };
  } catch (error) {
    console.error("Error getting optimization stats:", error);
    return null;
  }
};

// Schedule periodic cleanup
if (process.env.NODE_ENV === "production") {
  setInterval(() => {
    cleanupOptimizedImages();
  }, 24 * 60 * 60 * 1000); // Daily cleanup
}

module.exports = {
  processUploadedImage,
  serveOptimizedImage,
  generateImageVariants,
  optimizeImage,
  getImageMetadata,
  cleanupOptimizedImages,
  getOptimizationStats,
  IMAGE_CONFIGS,
};
