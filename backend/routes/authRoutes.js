const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  forgotPassword,
  resetPassword,
  updateProfile,
  getAllUsers,
  updateUser,
  deleteUser,
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const {
  upload,
  optimizeImage,
  handleUploadError,
} = require("../middlewares/uploadMiddleware");
const { authLimiter } = require("../middlewares/rateLimiter");
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateProfileUpdate,
  validateUserUpdate,
  validateMongoId,
} = require("../middlewares/validation");

const router = express.Router();

// Auth Routes with rate limiting and validation
router.post("/register", authLimiter, validateRegister, registerUser);
router.post("/login", authLimiter, validateLogin, loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, validateProfileUpdate, updateProfile);

// Password reset routes
router.post(
  "/forgot-password",
  authLimiter,
  validateForgotPassword,
  forgotPassword
);
router.post(
  "/reset-password/:token",
  authLimiter,
  validateResetPassword,
  resetPassword
);

// User management routes (Admin only)
router.get("/users", protect, adminOnly, getAllUsers);
router.put(
  "/users/:id",
  protect,
  adminOnly,
  validateMongoId("id"),
  validateUserUpdate,
  updateUser
);
router.delete(
  "/users/:id",
  protect,
  adminOnly,
  validateMongoId("id"),
  deleteUser
);

router.post(
  "/upload-image",
  protect,
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
