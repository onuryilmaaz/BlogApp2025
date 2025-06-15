const express = require("express");
const router = express.Router();
const {
  createPost,
  updatePost,
  deletePost,
  getAllPosts,
  getPostBySlug,
  getPostsByTags,
  searchPosts,
  incrementView,
  likePost,
  getTopPosts,
  generateSlug,
  validateSlug,
  regenerateSlug,
} = require("../controllers/blogPostController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { validateMongoId } = require("../middlewares/validation");

// Protected routes
router.post("/", protect, adminOnly, createPost);
router.put("/:id", protect, adminOnly, updatePost);
router.delete("/:id", protect, adminOnly, deletePost);

// Slug management routes (protected)
router.post("/generate-slug", protect, generateSlug);
router.post("/validate-slug", protect, validateSlug);
router.put("/:id/regenerate-slug", protect, regenerateSlug);

// Public routes
router.get("/", getAllPosts);
router.get("/trending", getTopPosts);
router.get("/search", searchPosts);
router.get("/tag/:tag", getPostsByTags);
router.get("/:identifier", getPostBySlug); // Can handle both slug and ID
router.post("/:id/view", incrementView);
router.put("/:id/like", protect, likePost);

module.exports = router;
