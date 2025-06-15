const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 50,
      match: /^[a-zA-Z0-9\s-_]+$/,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    color: {
      type: String,
      default: "#3B82F6", // Default blue color
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    },
    icon: {
      type: String,
      maxlength: 50,
    },
    category: {
      type: String,
      enum: [
        "Technology",
        "Lifestyle",
        "Business",
        "Education",
        "Entertainment",
        "Health",
        "Travel",
        "Food",
        "Sports",
        "Other",
      ],
      default: "Other",
    },
    isOfficial: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    postCount: {
      type: Number,
      default: 0,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      trending: {
        type: Boolean,
        default: false,
      },
      trendingScore: {
        type: Number,
        default: 0,
      },
      weeklyGrowth: {
        type: Number,
        default: 0,
      },
      monthlyGrowth: {
        type: Number,
        default: 0,
      },
    },
    aliases: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    relatedTags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
tagSchema.index({ postCount: -1 });
tagSchema.index({ followersCount: -1 });
tagSchema.index({ "metadata.trending": -1, "metadata.trendingScore": -1 });
tagSchema.index({ category: 1, isActive: 1 });
tagSchema.index({ createdAt: -1 });
tagSchema.index({ lastUsed: -1 });

// Virtual for posts using this tag
tagSchema.virtual("posts", {
  ref: "BlogPost",
  localField: "name",
  foreignField: "tags",
  justOne: false,
});

// Pre-save middleware to generate slug from name
tagSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.name = this.name.toLowerCase().replace(/\s+/g, "-");
  }
  next();
});

// Static method to get popular tags
tagSchema.statics.getPopular = function (limit = 10) {
  return this.find({ isActive: true })
    .sort({ postCount: -1, followersCount: -1 })
    .limit(limit);
};

// Static method to get trending tags
tagSchema.statics.getTrending = function (limit = 10) {
  return this.find({
    isActive: true,
    "metadata.trending": true,
  })
    .sort({ "metadata.trendingScore": -1 })
    .limit(limit);
};

// Instance method to increment post count
tagSchema.methods.incrementPostCount = function () {
  this.postCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Instance method to decrement post count
tagSchema.methods.decrementPostCount = function () {
  this.postCount = Math.max(0, this.postCount - 1);
  return this.save();
};

// Instance method to calculate trending score
tagSchema.methods.calculateTrendingScore = function () {
  const now = new Date();
  const daysSinceCreated = (now - this.createdAt) / (1000 * 60 * 60 * 24);
  const daysSinceLastUsed = (now - this.lastUsed) / (1000 * 60 * 60 * 24);

  // Score based on post count, recency, and growth
  const baseScore = this.postCount * 10;
  const recencyBonus = Math.max(0, 30 - daysSinceLastUsed) * 2;
  const growthBonus = (this.metadata.weeklyGrowth || 0) * 5;

  this.metadata.trendingScore = baseScore + recencyBonus + growthBonus;
  this.metadata.trending = this.metadata.trendingScore > 50;

  return this.save();
};

module.exports = mongoose.model("Tag", tagSchema);
