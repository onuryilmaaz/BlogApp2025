const Tag = require("../models/Tag");
const BlogPost = require("../models/BlogPost");
const { validationResult } = require("express-validator");
const { asyncHandler } = require("../middlewares/errorMiddleware");

// @desc    Get all tags with filtering and pagination
// @route   GET /api/tags?category=&search=&page=1&limit=20&sort=popular
// @access  Public
const getAllTags = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    page = 1,
    limit = 20,
    sort = "popular",
    active = "true",
  } = req.query;

  // Build query
  const query = {};

  if (active === "true") {
    query.isActive = true;
  }

  if (category && category !== "all") {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { displayName: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { aliases: { $in: [new RegExp(search, "i")] } },
    ];
  }

  // Sort options
  let sortOptions = {};
  switch (sort) {
    case "popular":
      sortOptions = { postCount: -1, followersCount: -1 };
      break;
    case "trending":
      sortOptions = { "metadata.trendingScore": -1 };
      break;
    case "alphabetical":
      sortOptions = { displayName: 1 };
      break;
    case "newest":
      sortOptions = { createdAt: -1 };
      break;
    case "recent":
      sortOptions = { lastUsed: -1 };
      break;
    default:
      sortOptions = { postCount: -1 };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const tags = await Tag.find(query)
    .populate("createdBy", "name profileImageUrl")
    .populate("relatedTags", "name displayName color")
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  const totalCount = await Tag.countDocuments(query);

  res.json({
    tags,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalTags: totalCount,
      hasNextPage: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
      hasPrevPage: parseInt(page) > 1,
    },
    filters: {
      category: category || "all",
      search: search || "",
      sort,
      active,
    },
  });
});

// @desc    Get tag statistics
// @route   GET /api/tags/stats
// @access  Public
const getTagStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    // Total tags
    Tag.countDocuments({ isActive: true }),

    // Tags by category
    Tag.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Most used tags
    Tag.find({ isActive: true })
      .sort({ postCount: -1 })
      .limit(10)
      .select("name displayName postCount color"),

    // Trending tags
    Tag.find({
      isActive: true,
      "metadata.trending": true,
    })
      .sort({ "metadata.trendingScore": -1 })
      .limit(5)
      .select("name displayName metadata.trendingScore color"),

    // Recent activity
    Tag.find({ isActive: true })
      .sort({ lastUsed: -1 })
      .limit(5)
      .select("name displayName lastUsed color"),
  ]);

  const [totalTags, categoryStats, mostUsed, trending, recentActivity] = stats;

  res.json({
    totalTags,
    categoryBreakdown: categoryStats,
    mostUsedTags: mostUsed,
    trendingTags: trending,
    recentActivity,
    generatedAt: new Date(),
  });
});

// @desc    Create new tag
// @route   POST /api/tags
// @access  Private/Admin
const createTag = asyncHandler(async (req, res) => {
  const {
    name,
    displayName,
    description,
    color,
    icon,
    category,
    aliases,
    relatedTags,
  } = req.body;

  // Check if tag already exists
  const existingTag = await Tag.findOne({
    $or: [
      { name: name.toLowerCase().replace(/\s+/g, "-") },
      { displayName: displayName },
    ],
  });

  if (existingTag) {
    return res.status(400).json({
      message: "Tag already exists with this name or display name",
    });
  }

  const tag = await Tag.create({
    name: name.toLowerCase().replace(/\s+/g, "-"),
    displayName,
    description,
    color: color || "#3B82F6",
    icon,
    category: category || "Other",
    aliases: aliases || [],
    relatedTags: relatedTags || [],
    createdBy: req.user._id,
    isOfficial: true, // Admin created tags are official
  });

  await tag.populate("createdBy", "name profileImageUrl");
  await tag.populate("relatedTags", "name displayName color");

  res.status(201).json({
    message: "Tag created successfully",
    tag,
  });
});

// @desc    Update tag
// @route   PUT /api/tags/:tagId
// @access  Private/Admin
const updateTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  const updateData = req.body;

  const tag = await Tag.findById(tagId);

  if (!tag) {
    return res.status(404).json({ message: "Tag not found" });
  }

  // If updating name, check for conflicts
  if (updateData.name && updateData.name !== tag.name) {
    const existingTag = await Tag.findOne({
      name: updateData.name.toLowerCase().replace(/\s+/g, "-"),
      _id: { $ne: tagId },
    });

    if (existingTag) {
      return res.status(400).json({
        message: "Another tag already exists with this name",
      });
    }
  }

  const updatedTag = await Tag.findByIdAndUpdate(
    tagId,
    { ...updateData, lastUsed: new Date() },
    { new: true, runValidators: true }
  )
    .populate("createdBy", "name profileImageUrl")
    .populate("relatedTags", "name displayName color");

  res.json({
    message: "Tag updated successfully",
    tag: updatedTag,
  });
});

// @desc    Delete tag
// @route   DELETE /api/tags/:tagId
// @access  Private/Admin
const deleteTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;

  const tag = await Tag.findById(tagId);

  if (!tag) {
    return res.status(404).json({ message: "Tag not found" });
  }

  // Check if tag is being used in posts
  const postsUsingTag = await BlogPost.countDocuments({ tags: tag.name });

  if (postsUsingTag > 0) {
    return res.status(400).json({
      message: `Cannot delete tag. It is currently used in ${postsUsingTag} posts. Consider deactivating instead.`,
      postsCount: postsUsingTag,
    });
  }

  await Tag.findByIdAndDelete(tagId);

  res.json({
    message: "Tag deleted successfully",
    deletedTag: {
      id: tag._id,
      name: tag.name,
      displayName: tag.displayName,
    },
  });
});

// @desc    Get popular tags
// @route   GET /api/tags/popular?limit=10
// @access  Public
const getPopularTags = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const popularTags = await Tag.getPopular(parseInt(limit));

  res.json({
    popularTags,
    count: popularTags.length,
  });
});

// @desc    Get tag suggestions for autocomplete
// @route   GET /api/tags/suggestions?q=react&limit=5
// @access  Public
const getTagSuggestions = asyncHandler(async (req, res) => {
  const { q = "", limit = 5 } = req.query;

  if (!q.trim() || q.length < 2) {
    return res.json({ suggestions: [] });
  }

  const suggestions = await Tag.find({
    $or: [
      { name: { $regex: `^${q}`, $options: "i" } },
      { displayName: { $regex: `^${q}`, $options: "i" } },
      { aliases: { $in: [new RegExp(`^${q}`, "i")] } },
    ],
    isActive: true,
  })
    .select("name displayName color postCount")
    .sort({ postCount: -1 })
    .limit(parseInt(limit));

  res.json({
    query: q,
    suggestions,
  });
});

// @desc    Merge tags
// @route   POST /api/tags/merge
// @access  Private/Admin
const mergeTags = asyncHandler(async (req, res) => {
  const { sourceTagIds, targetTagId } = req.body;

  if (!sourceTagIds || !Array.isArray(sourceTagIds) || !targetTagId) {
    return res.status(400).json({
      message: "Source tag IDs array and target tag ID are required",
    });
  }

  const targetTag = await Tag.findById(targetTagId);
  if (!targetTag) {
    return res.status(404).json({ message: "Target tag not found" });
  }

  const sourceTags = await Tag.find({ _id: { $in: sourceTagIds } });
  if (sourceTags.length !== sourceTagIds.length) {
    return res
      .status(404)
      .json({ message: "One or more source tags not found" });
  }

  // Update all posts using source tags to use target tag
  const sourceTagNames = sourceTags.map((tag) => tag.name);

  await BlogPost.updateMany(
    { tags: { $in: sourceTagNames } },
    {
      $pull: { tags: { $in: sourceTagNames } },
      $addToSet: { tags: targetTag.name },
    }
  );

  // Update target tag post count
  const newPostCount = await BlogPost.countDocuments({ tags: targetTag.name });
  targetTag.postCount = newPostCount;
  targetTag.lastUsed = new Date();
  await targetTag.save();

  // Delete source tags
  await Tag.deleteMany({ _id: { $in: sourceTagIds } });

  res.json({
    message: `Successfully merged ${sourceTags.length} tags into "${targetTag.displayName}"`,
    targetTag,
    mergedTags: sourceTags.map((tag) => ({
      id: tag._id,
      name: tag.name,
      displayName: tag.displayName,
    })),
    updatedPostCount: newPostCount,
  });
});

// @desc    Get tag details with posts
// @route   GET /api/tags/:tagName?page=1&limit=10
// @access  Public
const getTagDetails = asyncHandler(async (req, res) => {
  const { tagName } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const tag = await Tag.findOne({ name: tagName })
    .populate("createdBy", "name profileImageUrl")
    .populate("relatedTags", "name displayName color postCount");

  if (!tag) {
    return res.status(404).json({ message: "Tag not found" });
  }

  // Get posts using this tag
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const posts = await BlogPost.find({
    tags: tagName,
    isDraft: false,
    needsReview: false,
  })
    .populate("author", "name profileImageUrl")
    .select("title slug summary coverImageUrl createdAt views likes tags")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalPosts = await BlogPost.countDocuments({
    tags: tagName,
    isDraft: false,
    needsReview: false,
  });

  // Update last used timestamp
  tag.lastUsed = new Date();
  await tag.save();

  res.json({
    tag,
    posts,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPosts / parseInt(limit)),
      totalPosts,
      hasNextPage: parseInt(page) < Math.ceil(totalPosts / parseInt(limit)),
      hasPrevPage: parseInt(page) > 1,
    },
  });
});

module.exports = {
  getAllTags,
  getTagStats,
  createTag,
  updateTag,
  deleteTag,
  getPopularTags,
  getTagSuggestions,
  mergeTags,
  getTagDetails,
};
