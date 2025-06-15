const BlogPost = require("../models/BlogPost");
const User = require("../models/User");
const Comment = require("../models/Comment");
const { asyncHandler } = require("../middlewares/errorMiddleware");

// Advanced search with multiple criteria
const advancedSearch = asyncHandler(async (req, res) => {
  const {
    q = "",
    tags = "",
    author = "",
    dateFrom = "",
    dateTo = "",
    sortBy = "relevance",
    page = 1,
    limit = 10,
    type = "posts", // posts, comments, users, all
  } = req.query;

  const results = {};

  // Build base query
  const baseQuery = {
    isDraft: false,
    needsReview: { $ne: true },
  };

  // Date range filter
  if (dateFrom || dateTo) {
    baseQuery.createdAt = {};
    if (dateFrom) baseQuery.createdAt.$gte = new Date(dateFrom);
    if (dateTo) baseQuery.createdAt.$lte = new Date(dateTo);
  }

  // Search posts
  if (type === "posts" || type === "all") {
    const postQuery = { ...baseQuery };

    // Text search using MongoDB full-text search
    if (q.trim()) {
      postQuery.$text = { $search: q };
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(",").map((tag) => tag.trim());
      postQuery.tags = { $in: tagArray };
    }

    // Author filter
    if (author) {
      const authorUser = await User.findOne({
        $or: [
          { name: { $regex: author, $options: "i" } },
          { email: { $regex: author, $options: "i" } },
        ],
      });
      if (authorUser) {
        postQuery.author = authorUser._id;
      }
    }

    // Sort options
    let sortOptions = {};
    switch (sortBy) {
      case "date":
        sortOptions = { createdAt: -1 };
        break;
      case "views":
        sortOptions = { views: -1 };
        break;
      case "likes":
        sortOptions = { likes: -1 };
        break;
      case "relevance":
      default:
        // If text search, sort by relevance (score), otherwise by date
        if (q.trim()) {
          sortOptions = { score: { $meta: "textScore" }, createdAt: -1 };
        } else {
          sortOptions = { createdAt: -1 };
        }
        break;
    }

    // Add text score projection if using text search
    const projection = q.trim()
      ? {
          title: 1,
          slug: 1,
          summary: 1,
          coverImageUrl: 1,
          tags: 1,
          createdAt: 1,
          author: 1,
          views: 1,
          likes: 1,
          score: { $meta: "textScore" },
        }
      : "title slug summary coverImageUrl tags createdAt author views likes";

    const posts = await BlogPost.find(postQuery, projection)
      .populate("author", "name profileImageUrl")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalPosts = await BlogPost.countDocuments(postQuery);

    results.posts = {
      data: posts,
      total: totalPosts,
      page: parseInt(page),
      totalPages: Math.ceil(totalPosts / limit),
    };
  }

  // Search comments
  if (type === "comments" || type === "all") {
    const commentQuery = {};

    if (q.trim()) {
      commentQuery.content = { $regex: q, $options: "i" };
    }

    if (dateFrom || dateTo) {
      commentQuery.createdAt = {};
      if (dateFrom) commentQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) commentQuery.createdAt.$lte = new Date(dateTo);
    }

    const comments = await Comment.find(commentQuery)
      .select("content createdAt author post")
      .populate("author", "name profileImageUrl")
      .populate("post", "title slug")
      .sort({ createdAt: -1 })
      .limit(type === "all" ? 5 : parseInt(limit));

    const totalComments = await Comment.countDocuments(commentQuery);

    results.comments = {
      data: comments,
      total: totalComments,
      ...(type !== "all" && {
        page: parseInt(page),
        totalPages: Math.ceil(totalComments / limit),
      }),
    };
  }

  // Search users (admin only)
  if ((type === "users" || type === "all") && req.user?.role === "Admin") {
    const userQuery = {};

    if (q.trim()) {
      userQuery.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(userQuery)
      .select("name email profileImageUrl bio role createdAt")
      .sort({ createdAt: -1 })
      .limit(type === "all" ? 5 : parseInt(limit));

    const totalUsers = await User.countDocuments(userQuery);

    results.users = {
      data: users,
      total: totalUsers,
      ...(type !== "all" && {
        page: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
      }),
    };
  }

  // Add search metadata
  results.metadata = {
    query: q,
    filters: {
      tags: tags || null,
      author: author || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      sortBy,
      type,
    },
    searchTime: Date.now() - req.startTime,
  };

  res.json(results);
});

// Get search suggestions
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q = "", limit = 5 } = req.query;

  if (!q.trim() || q.length < 2) {
    return res.json({ suggestions: [] });
  }

  const suggestions = await Promise.all([
    // Title suggestions
    BlogPost.find({
      title: { $regex: q, $options: "i" },
      isDraft: false,
      needsReview: { $ne: true },
    })
      .select("title")
      .limit(parseInt(limit))
      .lean(),

    // Tag suggestions
    BlogPost.aggregate([
      { $match: { isDraft: false, needsReview: { $ne: true } } },
      { $unwind: "$tags" },
      { $match: { tags: { $regex: q, $options: "i" } } },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      { $project: { tag: "$_id", _id: 0 } },
    ]),

    // Author suggestions
    User.find({
      name: { $regex: q, $options: "i" },
    })
      .select("name")
      .limit(parseInt(limit))
      .lean(),
  ]);

  const [titles, tags, authors] = suggestions;

  const formattedSuggestions = [
    ...titles.map((post) => ({ type: "title", value: post.title })),
    ...tags.map((tag) => ({ type: "tag", value: tag.tag })),
    ...authors.map((author) => ({ type: "author", value: author.name })),
  ];

  res.json({
    suggestions: formattedSuggestions.slice(0, parseInt(limit)),
  });
});

// Get popular searches
const getPopularSearches = asyncHandler(async (req, res) => {
  // This would typically come from a search analytics database
  // For now, return trending tags as popular searches
  const popularTags = await BlogPost.aggregate([
    { $match: { isDraft: false, needsReview: { $ne: true } } },
    { $unwind: "$tags" },
    {
      $group: {
        _id: "$tags",
        count: { $sum: 1 },
        latestUsed: { $max: "$createdAt" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        term: "$_id",
        frequency: "$count",
        lastUsed: "$latestUsed",
        _id: 0,
      },
    },
  ]);

  res.json({
    popularSearches: popularTags,
  });
});

// Auto-complete search
const autoComplete = asyncHandler(async (req, res) => {
  const { q = "", limit = 8 } = req.query;

  if (!q.trim() || q.length < 2) {
    return res.json({ completions: [] });
  }

  // Get completions from various sources
  const completions = await Promise.all([
    // Post titles
    BlogPost.find({
      title: { $regex: `^${q}`, $options: "i" },
      isDraft: false,
      needsReview: { $ne: true },
    })
      .select("title views")
      .sort({ views: -1 })
      .limit(3)
      .lean(),

    // Full-text matches using MongoDB text search
    BlogPost.find(
      {
        $text: { $search: q },
        isDraft: false,
        needsReview: { $ne: true },
      },
      {
        title: 1,
        score: { $meta: "textScore" },
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(3)
      .lean(),

    // Tag matches
    BlogPost.aggregate([
      { $match: { isDraft: false, needsReview: { $ne: true } } },
      { $unwind: "$tags" },
      { $match: { tags: { $regex: `^${q}`, $options: "i" } } },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]),
  ]);

  const [titleMatches, contentMatches, tagMatches] = completions;

  const formattedCompletions = [
    ...titleMatches.map((post) => ({
      text: post.title,
      type: "title",
      popularity: post.views || 0,
    })),
    ...contentMatches.map((post) => ({
      text: post.title,
      type: "content",
      popularity: 0,
    })),
    ...tagMatches.map((tag) => ({
      text: tag._id,
      type: "tag",
      popularity: tag.count,
    })),
  ];

  // Remove duplicates and sort by popularity
  const uniqueCompletions = formattedCompletions
    .filter(
      (completion, index, self) =>
        index === self.findIndex((c) => c.text === completion.text)
    )
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, parseInt(limit));

  res.json({
    query: q,
    completions: uniqueCompletions,
  });
});

// Search analytics
const getSearchAnalytics = asyncHandler(async (req, res) => {
  const { period = "7d" } = req.query;

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
    default:
      startDate.setDate(now.getDate() - 7);
  }

  // Get most searched tags (as proxy for search terms)
  const popularSearchTerms = await BlogPost.aggregate([
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
        searches: { $sum: 1 },
        avgViews: { $avg: "$views" },
      },
    },
    { $sort: { searches: -1 } },
    { $limit: 10 },
    {
      $project: {
        term: "$_id",
        searches: 1,
        avgViews: { $round: ["$avgViews", 2] },
        _id: 0,
      },
    },
  ]);

  // Get search performance metrics
  const searchMetrics = {
    totalUniqueTerms: popularSearchTerms.length,
    avgResultsPerSearch:
      (await BlogPost.countDocuments({
        isDraft: false,
        needsReview: { $ne: true },
      })) / Math.max(popularSearchTerms.length, 1),
    topPerformingTerms: popularSearchTerms.slice(0, 5),
  };

  res.json({
    period,
    dateRange: {
      start: startDate.toISOString(),
      end: now.toISOString(),
    },
    popularSearchTerms,
    metrics: searchMetrics,
  });
});

// Featured/recommended content
const getFeaturedContent = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const featured = await Promise.all([
    // Most viewed posts
    BlogPost.find({
      isDraft: false,
      needsReview: { $ne: true },
    })
      .select("title slug coverImageUrl views likes createdAt author")
      .populate("author", "name profileImageUrl")
      .sort({ views: -1 })
      .limit(parseInt(limit)),

    // Most liked posts
    BlogPost.find({
      isDraft: false,
      needsReview: { $ne: true },
    })
      .select("title slug coverImageUrl views likes createdAt author")
      .populate("author", "name profileImageUrl")
      .sort({ likes: -1 })
      .limit(parseInt(limit)),

    // Recent popular posts (last 7 days)
    BlogPost.find({
      isDraft: false,
      needsReview: { $ne: true },
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    })
      .select("title slug coverImageUrl views likes createdAt author")
      .populate("author", "name profileImageUrl")
      .sort({ views: -1, likes: -1 })
      .limit(parseInt(limit)),
  ]);

  const [mostViewed, mostLiked, recentPopular] = featured;

  res.json({
    featured: {
      mostViewed,
      mostLiked,
      recentPopular,
      trending: recentPopular, // Alias for trending
    },
  });
});

module.exports = {
  advancedSearch,
  getSearchSuggestions,
  getPopularSearches,
  autoComplete,
  getSearchAnalytics,
  getFeaturedContent,
};
