const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  getAllTags,
  getTagDetails,
  mergeTag,
  deleteTag,
  getTagAnalytics,
  searchTags,
} = require("../controllers/tagController");

const { protect, adminOnly } = require("../middlewares/authMiddleware");

// Public routes
router.get("/", getAllTags);
router.get("/search", searchTags);
router.get("/analytics", getTagAnalytics);
router.get("/:tag", getTagDetails);

// Admin routes
router.put(
  "/merge",
  protect,
  adminOnly,
  [
    body("oldTag").notEmpty().withMessage("Old tag is required"),
    body("newTag").notEmpty().withMessage("New tag is required"),
  ],
  mergeTag
);

router.delete("/:tag", protect, adminOnly, deleteTag);

module.exports = router;
