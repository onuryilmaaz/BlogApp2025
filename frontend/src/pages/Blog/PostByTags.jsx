import React, { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BlogLayout from "../../components/layouts/BlogLayout/BlogLayout";
import { usePostsByTag } from "../../hooks/usePosts";
import BlogPostSummaryCard from "./components/BlogPostSummaryCard";
import moment from "moment";
import TrendingPostSection from "./components/TrendingPostSection";

const PostByTags = React.memo(() => {
  const { tagName } = useParams();
  const navigate = useNavigate();

  // React Query hook for fetching posts by tag
  const {
    data: blogPostList = [],
    isLoading,
    error,
    refetch,
  } = usePostsByTag(tagName);

  // Memoized handlers
  const handleClick = useCallback(
    (post) => {
      navigate(`/${post.slug}`);
    },
    [navigate]
  );

  const handleBrowseAllPosts = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Memoized post count
  const postCount = useMemo(() => blogPostList.length, [blogPostList.length]);

  // Error state
  if (error) {
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
            Something went wrong while fetching posts for this tag.
          </p>
          <button
            onClick={() => refetch()}
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
      <div>
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 md:col-span-9">
            {/* Header */}
            <div className="flex items-center justify-center bg-linear-to-r from-sky-500 via-teal-50 to-cyan-100 h-32 p-6 rounded-lg">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-sky-900">
                  # {tagName}
                </h3>
                <p className="text-sm font-medium text-gray-700 mt-1">
                  {isLoading
                    ? "Loading posts..."
                    : `Showing ${postCount} posts tagged with #${tagName}.`}
                </p>
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Posts grid */}
            {!isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {blogPostList.length > 0 ? (
                  blogPostList.map((item) => (
                    <BlogPostSummaryCard
                      key={item._id}
                      title={item.title}
                      coverImageUrl={item.coverImageUrl}
                      description={item.description}
                      tags={item.tags}
                      updatedOn={
                        item.updatedAt
                          ? moment(item.updatedAt).format("Do MMM YYYY")
                          : "-"
                      }
                      authorName={item.author.name}
                      authProfileImg={item.author.profileImageUrl}
                      onClick={() => handleClick(item)}
                    />
                  ))
                ) : (
                  <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-16 px-6">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No posts found for "#{tagName}"
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md">
                        We couldn't find any blog posts with this tag. Try
                        exploring other tags or check back later for new
                        content.
                      </p>
                      <button
                        onClick={handleBrowseAllPosts}
                        className="inline-flex items-center px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                          />
                        </svg>
                        Browse All Posts
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="col-span-12 md:col-span-3">
            <TrendingPostSection />
          </div>
        </div>
      </div>
    </BlogLayout>
  );
});

PostByTags.displayName = "PostByTags";

export default PostByTags;
