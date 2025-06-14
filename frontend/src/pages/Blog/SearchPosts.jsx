import React, { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BlogLayout from "../../components/layouts/BlogLayout/BlogLayout";
import { useSearchPosts } from "../../hooks/usePosts";
import useUIStore from "../../stores/uiStore";
import BlogPostSummaryCard from "./components/BlogPostSummaryCard";
import moment from "moment";

const SearchPosts = React.memo(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");

  // React Query hook for search
  const {
    data: searchResults = [],
    isLoading,
    error,
    refetch,
  } = useSearchPosts(query);

  // Zustand store for UI state
  const setSearchQuery = useUIStore((state) => state.setSearchQuery);
  const setSearchResults = useUIStore((state) => state.setSearchResults);

  // Update UI store when search results change
  React.useEffect(() => {
    if (query) {
      setSearchQuery(query);
    }
    if (searchResults) {
      setSearchResults(searchResults);
    }
  }, [query, searchResults, setSearchQuery, setSearchResults]);

  // Memoized handlers
  const handleClick = useCallback(
    (post) => {
      navigate(`/${post.slug}`);
    },
    [navigate]
  );

  const handleBackToHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Memoized search stats
  const searchStats = useMemo(() => {
    return {
      query: query || "",
      count: searchResults.length,
      hasResults: searchResults.length > 0,
    };
  }, [query, searchResults.length]);

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
            Search failed
          </h3>
          <p className="text-gray-600 mb-4">
            Something went wrong while searching for posts.
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
        {/* Search header */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-2">
            {isLoading ? (
              "Searching..."
            ) : (
              <>
                Showing search results matching "
                <span className="font-semibold text-sky-600">
                  {searchStats.query}
                </span>
                "
              </>
            )}
          </h3>
          {!isLoading && (
            <p className="text-sm text-gray-600">
              Found {searchStats.count}{" "}
              {searchStats.count === 1 ? "result" : "results"}
            </p>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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

        {/* Search results */}
        {!isLoading && searchStats.hasResults && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {searchResults.map((item) => (
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
            ))}
          </div>
        )}

        {/* No results state */}
        {!isLoading && !searchStats.hasResults && searchStats.query && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No results found for "{searchStats.query}"
              </h3>
              <p className="text-gray-600 mb-6 max-w-md">
                We couldn't find any blog posts matching your search. Try using
                different keywords or browse all posts.
              </p>
              <button
                onClick={handleBackToHome}
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
    </BlogLayout>
  );
});

SearchPosts.displayName = "SearchPosts";

export default SearchPosts;
