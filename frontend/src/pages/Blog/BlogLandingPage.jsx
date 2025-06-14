/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import BlogLayout from "../../components/layouts/BlogLayout/BlogLayout";
import { LuGalleryVerticalEnd } from "react-icons/lu";
import moment from "moment";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import FeaturedBlogPost from "./components/FeaturedBlogPost";
import BlogPostSummaryCard from "./components/BlogPostSummaryCard";
import TrendingPostSection from "./components/TrendingPostSection";

const BlogLandingPage = () => {
  const navigate = useNavigate();
  const [blogPostList, setBlogPostList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const fetchPosts = async (page = 1, append = false) => {
    try {
      if (!append) setIsLoading(true);
      else setLoadingMore(true);

      const response = await axiosInstance.get(
        `${API_PATHS.POSTS.GET_ALL}?page=${page}`
      );

      console.log("📡 API Response:", response.data);

      // Handle different response structures
      let posts = [];
      let pagination = {};

      if (response.data.posts) {
        // Paginated response
        posts = response.data.posts;
        pagination = {
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
          totalCount: response.data.totalCount || 0,
        };
      } else if (Array.isArray(response.data)) {
        // Direct array response
        posts = response.data;
        pagination = { page: 1, totalPages: 1, totalCount: posts.length };
      } else {
        console.warn("Unexpected response structure:", response.data);
        posts = [];
        pagination = { page: 1, totalPages: 1, totalCount: 0 };
      }

      console.log("📊 Processed posts:", posts);
      console.log("📄 Pagination:", pagination);

      if (append) {
        setBlogPostList((prev) => [...prev, ...posts]);
      } else {
        setBlogPostList(posts);
      }

      setCurrentPage(pagination.page);
      setTotalPages(pagination.totalPages);
      setError(null);
    } catch (err) {
      console.error("❌ Fetch error:", err);

      // If it's a 429 error and we have some posts, don't show error
      if (err.response?.status === 429 && blogPostList.length > 0) {
        console.warn("🔄 Rate limited but we have cached data, continuing...");
        setError(null);
      } else {
        setError(err);
        if (!append) setBlogPostList([]);
      }
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, false);
  }, []);

  const handleClick = (post) => {
    navigate(`/${post.slug}`);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchPosts(currentPage + 1, true);
    }
  };

  const featuredPost = blogPostList.length > 0 ? blogPostList[0] : null;
  const remainingPosts = blogPostList.length > 1 ? blogPostList.slice(1) : [];

  // Initial loading state with better UX
  if (initialLoad && isLoading) {
    return (
      <BlogLayout>
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 md:col-span-9">
            {/* Featured post skeleton */}
            <div className="mb-8">
              <div className="shimmer h-8 rounded mb-4"></div>
              <div className="shimmer h-4 rounded mb-6 w-1/2"></div>
              <div className="shimmer h-64 rounded-lg mb-8"></div>
            </div>

            {/* Grid posts skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="shimmer h-48 rounded-lg mb-4"></div>
                  <div className="shimmer h-4 rounded mb-2"></div>
                  <div className="shimmer h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-3">
            {/* Trending section skeleton */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="shimmer w-1 h-5 rounded-full"></div>
                <div className="shimmer h-6 rounded w-1/2"></div>
              </div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-transparent"
                  >
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
            </div>
          </div>
        </div>
      </BlogLayout>
    );
  }

  // Error state (only for critical errors)
  if (error && !isLoading && blogPostList.length === 0) {
    return (
      <BlogLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load posts
          </h3>
          <p className="text-gray-600 mb-4">
            Something went wrong while fetching the blog posts.
          </p>
          <button
            onClick={() => {
              setError(null);
              setInitialLoad(true);
              fetchPosts(1, false);
            }}
            className="bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 md:col-span-9">
          {/* Featured post */}
          {featuredPost && !isLoading && (
            <FeaturedBlogPost
              title={featuredPost.title}
              coverImageUrl={featuredPost.coverImageUrl}
              description={featuredPost.content}
              tags={featuredPost.tags}
              updatedOn={
                featuredPost.updatedAt
                  ? moment(featuredPost.updatedAt).format("Do MMM YYYY")
                  : "-"
              }
              authorName={featuredPost.author?.name}
              authProfileImg={featuredPost.author?.profileImageUrl}
              onClick={() => handleClick(featuredPost)}
            />
          )}

          {/* Remaining posts */}
          {remainingPosts.length > 0 && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {remainingPosts.map((item) => (
                <BlogPostSummaryCard
                  key={item._id}
                  title={item.title}
                  coverImageUrl={item.coverImageUrl}
                  description={item.content}
                  tags={item.tags}
                  updatedOn={
                    item.updatedAt
                      ? moment(item.updatedAt).format("Do MMM YYYY")
                      : "-"
                  }
                  authorName={item.author?.name}
                  authProfileImg={item.author?.profileImageUrl}
                  onClick={() => handleClick(item)}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {!isLoading && currentPage < totalPages && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <LuGalleryVerticalEnd className="w-4 h-4" />
                    Load More Posts
                  </>
                )}
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && blogPostList.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No posts available
              </h3>
              <p className="text-gray-600">Check back later for new content!</p>
            </div>
          )}
        </div>

        <div className="col-span-12 md:col-span-3">
          <TrendingPostSection />
        </div>
      </div>
    </BlogLayout>
  );
};

export default BlogLandingPage;
