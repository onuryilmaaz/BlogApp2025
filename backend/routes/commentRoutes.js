const express = require("express");
const router = express.Router();
const {
  addComment,
  getCommentsByPost,
  deleteComment,
  getAllComments,
} = require("../controllers/commentController");
const { protect } = require("../middlewares/authMiddleware");
const { commentLimiter } = require("../middlewares/rateLimiter");
const {
  validateComment,
  validateMongoId,
} = require("../middlewares/validation");

router.post("/:postId", commentLimiter, protect, validateComment, addComment);
router.get("/:postId", validateMongoId("postId"), getCommentsByPost);
router.get("/", getAllComments);
router.delete(
  "/:commentId",
  protect,
  validateMongoId("commentId"),
  deleteComment
);

module.exports = router;
