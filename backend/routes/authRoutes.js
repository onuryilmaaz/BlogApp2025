const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const {
  upload,
  optimizeImage,
  handleUploadError,
} = require("../middlewares/uploadMiddleware");
const { authLimiter } = require("../middlewares/rateLimiter");
const {
  validateRegister,
  validateLogin,
} = require("../middlewares/validation");

const router = express.Router();

// Auth Routes with rate limiting and validation
router.post("/register", authLimiter, validateRegister, registerUser);
router.post("/login", authLimiter, validateLogin, loginUser);
router.get("/profile", protect, getUserProfile);

router.post(
  "/upload-image",
  upload.single("image"),
  handleUploadError,
  optimizeImage,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/optimized/${
      req.file.filename
    }`;
    res.status(200).json({
      imageUrl,
      originalSize: req.file.size,
      filename: req.file.filename,
    });
  }
);

module.exports = router;
