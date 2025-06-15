const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogPost",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likes: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
CommentSchema.index({ post: 1, createdAt: 1 }); // For post comments
CommentSchema.index({ author: 1, createdAt: -1 }); // For user's comments
CommentSchema.index({ parentComment: 1 }); // For nested comments
CommentSchema.index({ post: 1, parentComment: 1 }); // For post's top-level comments

module.exports = mongoose.model("Comment", CommentSchema);
