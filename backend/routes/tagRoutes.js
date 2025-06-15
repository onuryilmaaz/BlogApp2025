const express = require("express");
const router = express.Router();
const {
  getAllTags,
  getTagStats,
  createTag,
  updateTag,
  deleteTag,
  getPopularTags,
  getTagSuggestions,
  mergeTags,
  getTagDetails,
} = require("../controllers/tagController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// Public routes
router.get("/", getAllTags);
router.get("/popular", getPopularTags);
router.get("/suggestions", getTagSuggestions);
router.get("/stats", getTagStats);
router.get("/:tagName", getTagDetails);

// Protected routes (admin only)
router.post("/", protect, adminOnly, createTag);
router.put("/:tagId", protect, adminOnly, updateTag);
router.delete("/:tagId", protect, adminOnly, deleteTag);
router.post("/merge", protect, adminOnly, mergeTags);

module.exports = router;
