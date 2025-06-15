const BlogPost = require("../models/BlogPost");
const { validationResult } = require("express-validator");
const { asyncHandler } = require("../middlewares/errorMiddleware");

// Get all tags with usage statistics
const getAllTags = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = "", sortBy = "usage" } = req.query;

  // Aggregation pipeline to get tag statistics
  const tagStats = await BlogPost.aggregate([
    { $match: { isDraft: false, needsReview: { $ne: true } } },
    { $unwind: "$tags" },
    ...(search
      ? [{ $match: { tags: { $regex: search, $options: "i" } } }]
      : []),
    {
      $group: {
        _id: "$tags",
        count: { $sum: 1 },
        latestUsed: { $max: "$createdAt" },
        posts: {
          $push: { _id: "$_id", title: "$title", createdAt: "$createdAt" },
        },
      },
    },
    {
      $project: {
        tag: "$_id",
        _id: 0,
        count: 1,
        latestUsed: 1,
        recentPosts: { $slice: ["$posts", -3] }, // Last 3 posts
      },
    },
    {
      $sort: {
        ...(sortBy === "usage" && { count: -1 }),
        ...(sortBy === "recent" && { latestUsed: -1 }),
        ...(sortBy === "alphabetical" && { tag: 1 }),
      },
    },
    { $skip: (page - 1) * limit },
    { $limit: parseInt(limit) },
  ]);

  // Get total count for pagination
  const totalCountPipeline = await BlogPost.aggregate([
    { $match: { isDraft: false, needsReview: { $ne: true } } },
    { $unwind: "$tags" },
    ...(search
      ? [{ $match: { tags: { $regex: search, $options: "i" } } }]
      : []),
    { $group: { _id: "$tags" } },
    { $count: "total" },
  ]);

  const totalTags = totalCountPipeline[0]?.total || 0;
  const totalPages = Math.ceil(totalTags / limit);

  res.json({
    tags: tagStats,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalTags,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

// Get tag details with posts
const getTagDetails = asyncHandler(async (req, res) => {
  const { tag } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Get posts with this tag
  const posts = await BlogPost.find({
    tags: { $in: [tag] },
    isDraft: false,
    needsReview: { $ne: true },
  })
    .select("title slug coverImageUrl createdAt author views likes")
    .populate("author", "name profileImageUrl")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Get total posts count
  const totalPosts = await BlogPost.countDocuments({
    tags: { $in: [tag] },
    isDraft: false,
    needsReview: { $ne: true },
  });

  // Get tag statistics
  const tagStats = await BlogPost.aggregate([
    {
      $match: {
        tags: { $in: [tag] },
        isDraft: false,
        needsReview: { $ne: true },
      },
    },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: "$likes" },
        firstUsed: { $min: "$createdAt" },
        lastUsed: { $max: "$createdAt" },
        avgViews: { $avg: "$views" },
        avgLikes: { $avg: "$likes" },
      },
    },
  ]);

  const stats = tagStats[0] || {
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    firstUsed: null,
    lastUsed: null,
    avgViews: 0,
    avgLikes: 0,
  };

  // Get related tags (tags that often appear with this tag)
  const relatedTags = await BlogPost.aggregate([
    {
      $match: {
        tags: { $in: [tag] },
        isDraft: false,
        needsReview: { $ne: true },
      },
    },
    { $unwind: "$tags" },
    { $match: { tags: { $ne: tag } } },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { tag: "$_id", count: 1, _id: 0 } },
  ]);

  res.json({
    tag: {
      name: tag,
      ...stats,
      relatedTags,
    },
    posts,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
      hasNextPage: page < Math.ceil(totalPosts / limit),
      hasPrevPage: page > 1,
    },
  });
});

// Create or update tag (merge posts with this tag)
const mergeTag = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { oldTag, newTag } = req.body;

  // Find posts with old tag
  const postsToUpdate = await BlogPost.find({
    tags: { $in: [oldTag] },
  });

  if (postsToUpdate.length === 0) {
    return res
      .status(404)
      .json({ error: "No posts found with the specified tag" });
  }

  // Update posts to replace old tag with new tag
  const updatePromises = postsToUpdate.map((post) => {
    const updatedTags = post.tags.map((tag) => (tag === oldTag ? newTag : tag));
    // Remove duplicates if newTag already exists
    const uniqueTags = [...new Set(updatedTags)];

    return BlogPost.findByIdAndUpdate(
      post._id,
      { tags: uniqueTags },
      { new: true }
    );
  });

  await Promise.all(updatePromises);

  res.json({
    message: `Successfully merged tag "${oldTag}" into "${newTag}"`,
    updatedPosts: postsToUpdate.length,
  });
});

// Delete tag from all posts
const deleteTag = asyncHandler(async (req, res) => {
  const { tag } = req.params;

  // Find posts with this tag
  const postsWithTag = await BlogPost.find({
    tags: { $in: [tag] },
  });

  if (postsWithTag.length === 0) {
    return res.status(404).json({ error: "Tag not found in any posts" });
  }

  // Remove tag from all posts
  await BlogPost.updateMany({ tags: { $in: [tag] } }, { $pull: { tags: tag } });

  res.json({
    message: `Successfully deleted tag "${tag}" from ${postsWithTag.length} posts`,
    affectedPosts: postsWithTag.length,
  });
});

// Get tag analytics
const getTagAnalytics = asyncHandler(async (req, res) => {
  const { period = "30d" } = req.query;

  // Calculate date range
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case "7d":
      startDate.setDate(now.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(now.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(now.getDate() - 90);
      break;
    case "1y":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  // Get trending tags (most used in period)
  const trendingTags = await BlogPost.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        isDraft: false,
        needsReview: { $ne: true },
      },
    },
    { $unwind: "$tags" },
    {
      $group: {
        _id: "$tags",
        count: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: "$likes" },
        avgViews: { $avg: "$views" },
        avgLikes: { $avg: "$likes" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        tag: "$_id",
        _id: 0,
        count: 1,
        totalViews: 1,
        totalLikes: 1,
        avgViews: { $round: ["$avgViews", 2] },
        avgLikes: { $round: ["$avgLikes", 2] },
      },
    },
  ]);

  // Get tag usage over time
  const tagUsageOverTime = await BlogPost.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        isDraft: false,
        needsReview: { $ne: true },
      },
    },
    { $unwind: "$tags" },
    {
      $group: {
        _id: {
          tag: "$tags",
          date: {
            $dateToString: {
              format:
                period === "7d"
                  ? "%Y-%m-%d"
                  : period === "30d"
                  ? "%Y-%m-%d"
                  : "%Y-%m",
              date: "$createdAt",
            },
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.tag",
        usage: {
          $push: {
            date: "$_id.date",
            count: "$count",
          },
        },
        totalUsage: { $sum: "$count" },
      },
    },
    { $sort: { totalUsage: -1 } },
    { $limit: 5 },
    {
      $project: {
        tag: "$_id",
        _id: 0,
        usage: 1,
        totalUsage: 1,
      },
    },
  ]);

  // Get overall statistics
  const overallStats = await BlogPost.aggregate([
    {
      $match: {
        isDraft: false,
        needsReview: { $ne: true },
      },
    },
    { $unwind: "$tags" },
    {
      $group: {
        _id: null,
        totalUniqueTags: { $addToSet: "$tags" },
        totalTagUsages: { $sum: 1 },
      },
    },
    {
      $project: {
        totalUniqueTags: { $size: "$totalUniqueTags" },
        totalTagUsages: 1,
        avgTagsPerPost: {
          $divide: [
            "$totalTagUsages",
            {
              $literal: await BlogPost.countDocuments({
                isDraft: false,
                needsReview: { $ne: true },
              }),
            },
          ],
        },
      },
    },
  ]);

  const stats = overallStats[0] || {
    totalUniqueTags: 0,
    totalTagUsages: 0,
    avgTagsPerPost: 0,
  };

  res.json({
    period,
    dateRange: {
      start: startDate.toISOString(),
      end: now.toISOString(),
    },
    trendingTags,
    tagUsageOverTime,
    overallStats: {
      ...stats,
      avgTagsPerPost: Math.round(stats.avgTagsPerPost * 100) / 100,
    },
  });
});

// Search tags with suggestions
const searchTags = asyncHandler(async (req, res) => {
  const { q = "", limit = 10 } = req.query;

  if (!q.trim()) {
    return res.json({ suggestions: [] });
  }

  // Get tag suggestions
  const suggestions = await BlogPost.aggregate([
    { $match: { isDraft: false, needsReview: { $ne: true } } },
    { $unwind: "$tags" },
    { $match: { tags: { $regex: q, $options: "i" } } },
    {
      $group: {
        _id: "$tags",
        count: { $sum: 1 },
        latestUsed: { $max: "$createdAt" },
      },
    },
    { $sort: { count: -1, latestUsed: -1 } },
    { $limit: parseInt(limit) },
    {
      $project: {
        tag: "$_id",
        _id: 0,
        count: 1,
        latestUsed: 1,
      },
    },
  ]);

  res.json({ suggestions });
});

module.exports = {
  getAllTags,
  getTagDetails,
  mergeTag,
  deleteTag,
  getTagAnalytics,
  searchTags,
};
