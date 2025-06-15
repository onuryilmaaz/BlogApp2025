const express = require("express");
const router = express.Router();
const {
  addComment,
  getCommentsByPost,
  deleteComment,
  getAllComments,
  updateComment,
  likeComment,
} = require("../controllers/commentController");
const { protect } = require("../middlewares/authMiddleware");
const { commentLimiter } = require("../middlewares/rateLimiter");
const {
  validateComment,
  validateMongoId,
  validateCommentUpdate,
} = require("../middlewares/validation");

router.post("/:postId", commentLimiter, protect, validateComment, addComment);
router.get("/:postId", validateMongoId("postId"), getCommentsByPost);
router.get("/", getAllComments);
router.put(
  "/:commentId",
  protect,
  validateMongoId("commentId"),
  validateCommentUpdate,
  updateComment
);
router.post(
  "/:commentId/like",
  protect,
  validateMongoId("commentId"),
  likeComment
);
router.delete(
  "/:commentId",
  protect,
  validateMongoId("commentId"),
  deleteComment
);

module.exports = router;
