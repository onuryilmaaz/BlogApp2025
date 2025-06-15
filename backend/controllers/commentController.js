const Comment = require("../models/Comment");
const BlogPost = require("../models/BlogPost");
const NotificationService = require("../services/notificationService");

// @desc   Add comment to a blog post
// @route  POST /api/comments/:postId
// @access Private
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentComment } = req.body;

    // Ensure blog post exists
    const post = await BlogPost.findById(postId).populate("author", "name _id");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content,
      parentComment: parentComment || null,
    });

    await comment.populate("author", "name profileImageUrl");

    // Send notification to post author (if not commenting on own post)
    if (post.author._id.toString() !== req.user._id.toString()) {
      try {
        await NotificationService.notifyNewComment({
          postAuthorId: post.author._id,
          commenterName: req.user.name,
          commenterId: req.user._id,
          postTitle: post.title,
          postId: post._id,
          commentId: comment._id,
          postSlug: post.slug,
        });
      } catch (notificationError) {
        console.error(
          "Failed to send comment notification:",
          notificationError
        );
        // Don't fail the comment creation if notification fails
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add comment", error: error.message });
  }
};

// @desc   Get all comments
// @route  GET /api/comments
// @access Public
const getAllComments = async (req, res) => {
  try {
    // Fetch all comments with author populated
    const comments = await Comment.find()
      .populate("author", "name profileImageUrl")
      .populate("post", "title coverImageUrl")
      .sort({ createdAt: 1 });

    const commentMap = {};
    comments.forEach((comment) => {
      comment = comment.toObject();
      comment.replies = [];
      commentMap[comment._id] = comment;
    });

    const nestedComments = [];
    comments.forEach((comment) => {
      if (comment.parentComment) {
        const parent = commentMap[comment.parentComment];
        if (parent) {
          parent.replies.push(commentMap[comment._id]);
        }
      } else {
        nestedComments.push(commentMap[comment._id]);
      }
    });
    res.json(nestedComments);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch all comment", error: error.message });
  }
};

// @desc   Get all comments for a blog post
// @route  GET /api/comments/:postId
// @access Public
const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .populate("author", "name profileImageUrl")
      .populate("post", "title coverImageUrl")
      .sort({ createdAt: 1 });

    const commentMap = {};
    comments.forEach((comment) => {
      comment = comment.toObject();
      comment.replies = [];
      commentMap[comment._id] = comment;
    });

    const nestedComments = [];
    comments.forEach((comment) => {
      if (comment.parentComment) {
        const parent = commentMap[comment.parentComment];
        if (parent) {
          parent.replies.push(commentMap[comment._id]);
        }
      } else {
        nestedComments.push(commentMap[comment._id]);
      }
    });

    res.json(nestedComments);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch comment", error: error.message });
  }
};

// @desc   Update a comment (author or admin only)
// @route  PUT /api/comments/:commentId
// @access Private
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const comment = await Comment.findById(commentId).populate("author", "_id");
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user is the author of the comment or an admin
    const isAuthor = comment.author._id.toString() === userId.toString();
    const isAdmin = userRole === "Admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        message:
          "Access denied. You can only edit your own comments or you must be an admin.",
      });
    }

    // Update the comment
    comment.content = content;
    const updatedComment = await comment.save();
    await updatedComment.populate("author", "name profileImageUrl");

    res.json(updatedComment);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update comment", error: error.message });
  }
};

// @desc   Like a comment
// @route  POST /api/comments/:commentId/like
// @access Private
const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Increment the likes count
    comment.likes += 1;
    await comment.save();

    res.json({
      message: "Comment liked successfully",
      likes: comment.likes,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to like comment", error: error.message });
  }
};

// @desc   Delete a comment and its replies (author or admin only)
// @route  DELETE /api/comments/:commentId
// @access Private
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const comment = await Comment.findById(commentId).populate("author", "_id");
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user is the author of the comment or an admin
    const isAuthor = comment.author._id.toString() === userId.toString();
    const isAdmin = userRole === "Admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        message:
          "Access denied. You can only delete your own comments or you must be an admin.",
      });
    }

    // Delete the comment and its replies
    await Comment.deleteOne({ _id: commentId });
    await Comment.deleteMany({ parentComment: commentId });

    res.json({ message: "Comment and any replies deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete comment", error: error.message });
  }
};

module.exports = {
  addComment,
  getAllComments,
  getCommentsByPost,
  updateComment,
  likeComment,
  deleteComment,
};
