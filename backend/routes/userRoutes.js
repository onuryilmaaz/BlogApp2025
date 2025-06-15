const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// @desc   Get all users
// @route  GET /api/users
// @access Private/Admin
router.get("/", protect, adminOnly, getAllUsers);

// @desc   Get user by ID
// @route  GET /api/users/:id
// @access Private/Admin
router.get("/:id", protect, adminOnly, getUserById);

// @desc   Update user
// @route  PUT /api/users/:id
// @access Private/Admin
router.put("/:id", protect, adminOnly, updateUser);

// @desc   Delete user
// @route  DELETE /api/users/:id
// @access Private/Admin
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;
