import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

const TrendingPostSection = React.memo(() => {
  const navigate = useNavigate();
  const [postList, setPostList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrendingPosts = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.POSTS.GET_TRENDING_POST
      );


      // Handle different response structures
      let posts = [];
      if (response.data.posts) {
        posts = response.data.posts;
      } else if (Array.isArray(response.data)) {
        posts = response.data;
      } else {
        console.warn("Unexpected trending response structure:", response.data);
        posts = [];
      }

      // Filter out draft posts and posts that need review for public view
      posts = posts.filter((post) => !post.isDraft && !post.needsReview);

      setPostList(posts);
      setError(null);
    } catch (err) {
      console.error("❌ Trending fetch error:", err);
      setError(err);
      setPostList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingPosts();
  }, []);

  const handleClick = useCallback(
    (post) => {
      navigate(`/${post.slug}`);
    },
    [navigate]
  );

  // Only show error if no posts loaded and not loading
  if (error && !isLoading && postList.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-400 rounded-full"></div>
          <h4 className="text-base text-gray-900 font-semibold">
            Recent Posts
          </h4>
        </div>
        <div className="text-center py-6">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-8 h-8 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Failed to load recent posts
          </p>
          <button
            onClick={() => {
              setError(null);
              fetchTrendingPosts();
            }}
            className="text-xs text-sky-500 hover:text-sky-600 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-400 rounded-full"></div>
        <h4 className="text-base text-gray-900 font-semibold">Recent Posts</h4>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg border border-transparent">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="shimmer w-16 h-16 rounded-lg"></div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="shimmer h-4 w-12 rounded-full"></div>
                  <div className="shimmer h-3 rounded w-full"></div>
                  <div className="shimmer h-3 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading &&
        postList.length > 0 &&
        postList.map((item) => (
          <PostCard
            key={item._id}
            title={item.title}
            coverImageUrl={item.coverImageUrl}
            tags={item.tags}
            onClick={() => handleClick(item)}
          />
        ))}

      {!isLoading && postList.length === 0 && (
        <div className="text-center py-6">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-8 h-8 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No recent posts available</p>
        </div>
      )}
    </div>
  );
});

TrendingPostSection.displayName = "TrendingPostSection";

const PostCard = React.memo(({ title, coverImageUrl, tags, onClick }) => {
  return (
    <div
      className="cursor-pointer mb-4 hover:bg-gray-50 p-3 rounded-lg transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-100"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <img
            src={coverImageUrl}
            alt={title}
            className="w-16 h-16 object-cover rounded-lg shadow-sm"
            loading="lazy"
            onError={(e) => {
              e.target.src = "/placeholder-image.jpg";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="inline-block px-2 py-1 text-[10px] font-semibold text-sky-600 bg-sky-50 rounded-full mb-2">
            {tags?.[0]?.toUpperCase() || "BLOG"}
          </span>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight hover:text-sky-600 transition-colors">
            {title}
          </h3>
        </div>
      </div>
    </div>
  );
});

PostCard.displayName = "PostCard";

export default TrendingPostSection;
