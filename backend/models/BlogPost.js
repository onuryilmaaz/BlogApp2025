const mongoose = require("mongoose");

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    coverImageUrl: { type: String, default: null },
    tags: [{ type: String }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDraft: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    generatedByAI: { type: Boolean, default: false },
    needsReview: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
// Note: slug already has unique index from schema definition
BlogPostSchema.index({ tags: 1 }); // For tag-based queries
BlogPostSchema.index({ createdAt: -1 }); // For sorting by date
BlogPostSchema.index({ views: -1 }); // For trending posts
BlogPostSchema.index({ likes: -1 }); // For popular posts
BlogPostSchema.index({ author: 1, createdAt: -1 }); // For author's posts
BlogPostSchema.index({ isDraft: 1, createdAt: -1 }); // For published posts
BlogPostSchema.index({ needsReview: 1, createdAt: -1 }); // For posts pending review
BlogPostSchema.index({ title: "text", content: "text" }); // For text search

module.exports = mongoose.model("BlogPost", BlogPostSchema);
