const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getDashboardSummary } = require("../controllers/dashboardContoller");

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role == "Admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access only" });
  }
};

router.get("/", protect, adminOnly, getDashboardSummary);

module.exports = router;
