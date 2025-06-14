const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { aiLimiter } = require("../middlewares/rateLimiter");
const { validateAIGeneration } = require("../middlewares/validation");
const {
  generateBlogPost,
  generateBlogPostIdeas,
  generateCommentReply,
  generatePostSummary,
} = require("../controllers/aiController");

router.post(
  "/generate",
  aiLimiter,
  protect,
  validateAIGeneration,
  generateBlogPost
);
router.post(
  "/generate-ideas",
  aiLimiter,
  protect,
  validateAIGeneration,
  generateBlogPostIdeas
);
router.post(
  "/generate-reply",
  aiLimiter,
  protect,
  validateAIGeneration,
  generateCommentReply
);
router.post(
  "/generate-summary",
  aiLimiter,
  validateAIGeneration,
  generatePostSummary
);

module.exports = router;
