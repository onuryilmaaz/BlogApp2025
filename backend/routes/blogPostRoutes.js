const express = require("express");
const router = express.Router();
const {
  createPost,
  updatePost,
  deletePost,
  getAllPosts,
  reviewPost,
  getPostBySlug,
  getPostsByTags,
  searchPosts,
  incrementView,
  likePost,
  getTopPosts,
} = require("../controllers/blogPostController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { validateMongoId } = require("../middlewares/validation");

router.post("/", protect, adminOnly, createPost);
router.get("/", getAllPosts);
router.get("/slug/:slug", getPostBySlug);
router.put("/:id", protect, adminOnly, updatePost);
router.delete("/:id", protect, adminOnly, deletePost);
router.put(
  "/:id/review",
  protect,
  adminOnly,
  validateMongoId("id"),
  reviewPost
);
router.get("/tag/:tag", getPostsByTags);
router.get("/search", searchPosts);
router.post("/:id/view", incrementView);
router.post("/:id/like", protect, likePost);
router.get("/trending", getTopPosts);

module.exports = router;
