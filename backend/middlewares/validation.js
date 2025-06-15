const { body, param, validationResult } = require("express-validator");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Auth validation rules
const validateRegister = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),

  body("profileImageUrl")
    .optional()
    .isURL()
    .withMessage("Profile image must be a valid URL"),

  body("adminAccessToken")
    .optional()
    .isLength({ min: 1 })
    .withMessage("Admin access token cannot be empty"),

  handleValidationErrors,
];

const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

// Blog post validation rules
const validateBlogPost = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),

  body("content")
    .trim()
    .isLength({ min: 50, max: 50000 })
    .withMessage("Content must be between 50 and 50,000 characters"),

  body("summary")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Summary cannot exceed 500 characters"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("tags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Each tag must be between 1 and 30 characters"),

  body("coverImageUrl")
    .optional()
    .isURL()
    .withMessage("Cover image must be a valid URL"),

  handleValidationErrors,
];

// Comment validation rules
const validateComment = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Comment must be between 1 and 1000 characters")
    .escape(), // Sanitize HTML entities

  body("parentComment")
    .optional()
    .isMongoId()
    .withMessage("Parent comment must be a valid MongoDB ID"),

  param("postId").isMongoId().withMessage("Post ID must be a valid MongoDB ID"),

  handleValidationErrors,
];

// AI generation validation rules
const validateAIGeneration = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),

  body("tone")
    .optional()
    .isIn([
      "professional",
      "casual",
      "technical",
      "friendly",
      "formal",
      "teknik",
      "günlük",
      "başlangıç",
      "profesyonel",
      "eğlenceli",
    ])
    .withMessage(
      "Tone must be one of: professional, casual, technical, friendly, formal, teknik, günlük, başlangıç, profesyonel, eğlenceli"
    ),

  body("topics")
    .optional()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage("Topics must be between 3 and 500 characters"),

  body("content")
    .optional()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage("Content must be between 10 and 10,000 characters"),

  body("author")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Author name must be between 1 and 100 characters"),

  handleValidationErrors,
];

// MongoDB ID validation
const validateMongoId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} must be a valid MongoDB ID`),

  handleValidationErrors,
];

// Password reset validation rules
const validateForgotPassword = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  handleValidationErrors,
];

const validateResetPassword = [
  body("password")
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  param("token").notEmpty().withMessage("Reset token is required"),

  handleValidationErrors,
];

// Profile update validation rules
const validateProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),

  body("profileImageUrl")
    .optional()
    .isURL()
    .withMessage("Profile image must be a valid URL"),

  handleValidationErrors,
];

// Comment update validation rules
const validateCommentUpdate = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Comment must be between 1 and 1000 characters")
    .escape(), // Sanitize HTML entities

  handleValidationErrors,
];

// User update validation rules (for admin)
const validateUserUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),

  body("profileImageUrl")
    .optional()
    .isURL()
    .withMessage("Profile image must be a valid URL"),

  body("role")
    .optional()
    .isIn(["Admin", "Member"])
    .withMessage("Role must be either Admin or Member"),

  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateBlogPost,
  validateComment,
  validateAIGeneration,
  validateMongoId,
  validateForgotPassword,
  validateResetPassword,
  validateProfileUpdate,
  validateCommentUpdate,
  validateUserUpdate,
  handleValidationErrors,
};
