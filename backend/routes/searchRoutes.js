const express = require("express");
const router = express.Router();

const {
  advancedSearch,
  getSearchSuggestions,
  getPopularSearches,
  autoComplete,
  getSearchAnalytics,
  getFeaturedContent,
} = require("../controllers/searchController");

const { protect } = require("../middlewares/authMiddleware");

// Add request timing middleware
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Public search routes
router.get("/", advancedSearch);
router.get("/suggestions", getSearchSuggestions);
router.get("/popular", getPopularSearches);
router.get("/autocomplete", autoComplete);
router.get("/featured", getFeaturedContent);

// Analytics (admin only)
router.get("/analytics", protect, getSearchAnalytics);

module.exports = router;
