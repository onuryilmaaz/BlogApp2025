const mongoose = require("mongoose");
const slugify = require("slugify");

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
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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

// Pre-save middleware to handle slug generation and tag management
BlogPostSchema.pre("save", async function (next) {
  // Generate slug from title if title is modified or this is a new document
  if (this.isModified("title") || this.isNew) {
    let baseSlug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    // Ensure slug is unique
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingPost = await this.constructor.findOne({
        slug: slug,
        _id: { $ne: this._id }, // Exclude current document
      });

      if (!existingPost) {
        this.slug = slug;
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  if (this.isModified("tags")) {
    const Tag = require("./Tag");

    // Get previous tags if this is an update
    const previousTags = this.isNew
      ? []
      : (await this.constructor.findById(this._id))?.tags || [];
    const currentTags = this.tags || [];

    // Find tags to add and remove
    const tagsToAdd = currentTags.filter((tag) => !previousTags.includes(tag));
    const tagsToRemove = previousTags.filter(
      (tag) => !currentTags.includes(tag)
    );

    // Update or create tags for new tags
    for (const tagName of tagsToAdd) {
      try {
        let tag = await Tag.findOne({ name: tagName });
        if (!tag) {
          // Create new tag automatically
          tag = await Tag.create({
            name: tagName,
            displayName: tagName.charAt(0).toUpperCase() + tagName.slice(1),
            postCount: 1,
            lastUsed: new Date(),
          });
        } else {
          // Increment post count
          await tag.incrementPostCount();
        }
      } catch (error) {
        console.error(`Error managing tag ${tagName}:`, error);
      }
    }

    // Decrement count for removed tags
    for (const tagName of tagsToRemove) {
      try {
        const tag = await Tag.findOne({ name: tagName });
        if (tag) {
          await tag.decrementPostCount();
        }
      } catch (error) {
        console.error(`Error updating tag ${tagName}:`, error);
      }
    }
  }
  next();
});

// Post-remove middleware to handle tag cleanup
BlogPostSchema.post("findOneAndDelete", async function (doc) {
  if (doc && doc.tags && doc.tags.length > 0) {
    const Tag = require("./Tag");

    // Decrement post count for all tags
    for (const tagName of doc.tags) {
      try {
        const tag = await Tag.findOne({ name: tagName });
        if (tag) {
          await tag.decrementPostCount();
        }
      } catch (error) {
        console.error(
          `Error updating tag ${tagName} after post deletion:`,
          error
        );
      }
    }
  }
});

// Static method to generate unique slug
BlogPostSchema.statics.generateUniqueSlug = async function (
  title,
  excludeId = null
) {
  let baseSlug = slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug: slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingPost = await this.findOne(query);

    if (!existingPost) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// Static method to validate slug format
BlogPostSchema.statics.isValidSlug = function (slug) {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100;
};

// Instance method to regenerate slug
BlogPostSchema.methods.regenerateSlug = async function () {
  this.slug = await this.constructor.generateUniqueSlug(this.title, this._id);
  return this.save();
};

module.exports = mongoose.model("BlogPost", BlogPostSchema);
