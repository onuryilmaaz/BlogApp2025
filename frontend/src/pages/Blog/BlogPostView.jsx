/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BlogLayout from "../../components/layouts/BlogLayout/BlogLayout";
import useUserStore from "../../stores/userStore";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuDot, LuSparkles, LuCircleAlert } from "react-icons/lu";
import moment from "moment";
import MarkDownContent from "./components/MarkDownContent";
import SharePost from "./components/SharePost";
import CommentInfoCard from "./components/CommentInfoCard";
import CommentReplyInput from "../../components/Inputs/CommentReplyInput";
import LikeCommentButton from "./components/LikeCommentButton";
import TrendingPostSection from "./components/TrendingPostSection";
import OptimizedImage from "../../components/ui/OptimizedImage";
import Drawer from "../../components/Drawer";
import SkeletonLoader from "../../components/Loader/SkeletonLoader";
import toast from "react-hot-toast";

const BlogPostView = React.memo(() => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Zustand stores
  const user = useUserStore((state) => state.user);
  const setOpenAuthForm = useUserStore((state) => state.setOpenAuthForm);

  // Local state
  const [blogPostData, setBlogPostData] = useState(null);
  const [postLoading, setPostLoading] = useState(true);
  const [postError, setPostError] = useState(null);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [openSummarizeDrawer, setOpenSummarizeDrawer] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch post by slug
  const fetchPost = async () => {
    try {
      setPostLoading(true);
      setPostError(null);

      const response = await axiosInstance.get(
        API_PATHS.POSTS.GET_BY_SLUG(slug)
      );
      console.log("📄 Post API Response:", response.data);

      setBlogPostData(response.data);
      setPostError(null);

      // Increment view count (silently fail if needed)
      if (response.data._id) {
        axiosInstance
          .post(API_PATHS.POSTS.INCREMENT_VIEW(response.data._id))
          .catch(() => {
            // Silent fail for view increment
          });
      }
    } catch (err) {
      console.error("❌ Post fetch error:", err);

      // Only set error for real 404s or critical errors
      if (err.response?.status === 404) {
        setPostError(err);
        setBlogPostData(null);
      } else {
        // For other errors, just log and don't show error boundary
        console.warn("🔄 Post fetch failed, retrying...", err.message);
        setPostError(null);
        setBlogPostData(null);
      }
    } finally {
      setPostLoading(false);
    }
  };

  // Fetch comments
  const fetchComments = async (postId) => {
    try {
      setCommentsLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.COMMENTS.GET_ALL_BY_POST(postId)
      );
      console.log("💬 Comments API Response:", response.data);

      // Handle different response structures
      const commentsData = response.data.comments || response.data;
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (err) {
      console.error("❌ Comments fetch error:", err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  useEffect(() => {
    if (blogPostData?._id) {
      fetchComments(blogPostData._id);
    }
  }, [blogPostData?._id]);

  // Memoized handlers
  const handleTagClick = useCallback(
    (e, tag) => {
      e.stopPropagation();
      navigate(`/tag/${tag}`);
    },
    [navigate]
  );

  const handleSummarizePost = useCallback(async () => {
    if (!blogPostData?.content) return;

    try {
      setSummaryLoading(true);
      setErrorMsg("");
      setSummaryContent(null);
      setOpenSummarizeDrawer(true);

      const response = await axiosInstance.post(
        API_PATHS.AI.GENERATE_POST_SUMMARY,
        {
          content: blogPostData.content,
        }
      );

      setSummaryContent(response.data);
    } catch (error) {
      setErrorMsg("Failed to generate summary. Try again later");
      console.error("Summary error:", error);
    } finally {
      setSummaryLoading(false);
    }
  }, [blogPostData?.content]);

  const handleAddCommentClick = useCallback(() => {
    if (!user) {
      setOpenAuthForm(true);
      return;
    }
    setShowReplyForm(true);
  }, [user, setOpenAuthForm]);

  const handleAddReply = useCallback(async () => {
    if (!replyText.trim() || !blogPostData?._id) return;

    try {
      await axiosInstance.post(API_PATHS.COMMENTS.ADD(blogPostData._id), {
        content: replyText,
      });

      setReplyText("");
      setShowReplyForm(false);
      toast.success("Comment added successfully!");

      // Refresh comments
      await fetchComments(blogPostData._id);
    } catch (error) {
      toast.error("Failed to add comment");
      console.error("Comment error:", error);
    }
  }, [replyText, blogPostData?._id]);

  const handleCancelReply = useCallback(() => {
    setReplyText("");
    setShowReplyForm(false);
  }, []);

  const sanitizeMarkdown = (content) => {
    return content || "";
  };

  const formattedDate = blogPostData?.updatedAt
    ? moment(blogPostData.updatedAt).format("Do MMM YYYY")
    : "-";

  // Loading state
  if (postLoading) {
    return (
      <BlogLayout>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-8">
            {/* Title skeleton */}
            <div className="shimmer h-8 rounded mb-4"></div>
            <div className="shimmer h-4 rounded mb-6 w-1/2"></div>

            {/* Tags skeleton */}
            <div className="flex gap-2 mb-6">
              <div className="shimmer h-6 w-16 rounded-full"></div>
              <div className="shimmer h-6 w-20 rounded-full"></div>
              <div className="shimmer h-6 w-12 rounded-full"></div>
            </div>

            {/* Image skeleton */}
            <div className="shimmer h-64 rounded-lg mb-8"></div>

            {/* Content skeleton */}
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`shimmer h-4 rounded ${
                    i % 3 === 2 ? "w-3/4" : ""
                  }`}
                ></div>
              ))}
            </div>

            {/* Action buttons skeleton */}
            <div className="flex gap-4 mt-8">
              <div className="shimmer h-10 w-32 rounded-lg"></div>
              <div className="shimmer h-10 w-24 rounded-lg"></div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            {/* Sidebar skeleton */}
            <div className="shimmer h-6 rounded mb-4 w-1/2"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="shimmer w-16 h-16 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="shimmer h-3 rounded"></div>
                    <div className="shimmer h-3 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </BlogLayout>
    );
  }

  // Error state
  if (postError) {
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
            Post not found
          </h3>
          <p className="text-gray-600 mb-4">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </BlogLayout>
    );
  }

  if (!blogPostData) return null;

  return (
    <BlogLayout>
      <title>{blogPostData.title}</title>
      <meta name="description" content={blogPostData.title} />
      <meta property="og:title" content={blogPostData.title} />
      <meta property="og:image" content={blogPostData.coverImageUrl} />
      <meta property="og:type" content="article" />

      <div className="grid grid-cols-12 gap-8 relative">
        <div className="col-span-12 md:col-span-8 relative">
          <h1 className="text-lg md:text-2xl font-bold mb-2 line-clamp-3">
            {blogPostData.title}
          </h1>
          <div className="flex items-center gap-1 flex-wrap mt-3 mb-5">
            <span className="text-[13px] text-gray-500 font-medium">
              {formattedDate}
            </span>
            <LuDot className="text-xl text-gray-400" />
            <div className="flex items-center flex-wrap gap-2">
              {blogPostData.tags?.slice(0, 3).map((tag, index) => (
                <button
                  key={`${tag}-${index}`}
                  className="bg-sky-200/50 text-sky-800/80 text-xs font-medium px-3 py-0.5 rounded-full text-nowrap cursor-pointer hover:bg-sky-300/50 transition-colors"
                  onClick={(e) => handleTagClick(e, tag)}
                >
                  # {tag}
                </button>
              ))}
            </div>
            <LuDot className="text-xl text-gray-400" />
            <button
              className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-400 text-xs text-white font-medium px-3 py-0.5 rounded-full text-nowrap cursor-pointer hover:scale-[1.02] transition-all my-1 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSummarizePost}
              disabled={summaryLoading}
            >
              <LuSparkles />
              {summaryLoading ? "Generating..." : "Summarize Post"}
            </button>
          </div>
          <OptimizedImage
            src={blogPostData.coverImageUrl || ""}
            alt={blogPostData.title}
            className="w-full h-96 object-cover mb-6 rounded-lg"
            loading="eager"
            fallbackSrc="/placeholder-image.jpg"
          />
          <div>
            <MarkDownContent
              content={sanitizeMarkdown(blogPostData?.content || "")}
            />
            <SharePost title={blogPostData.title} />
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Comments</h4>
                <button
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-sky-500 to-cyan-400 text-xs font-semibold text-white px-5 py-2 rounded-full hover:bg-black hover:text-white cursor-pointer transition-colors"
                  onClick={handleAddCommentClick}
                >
                  Add Comment
                </button>
              </div>
              {showReplyForm && (
                <div className="bg-white pt-1 pb-5 pr-8 rounded-lg mb-8">
                  <CommentReplyInput
                    user={user}
                    authorName={user?.name}
                    content={""}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    handleAddReply={handleAddReply}
                    handleCancelReply={handleCancelReply}
                    disableAutoGen
                    type="new"
                  />
                </div>
              )}

              {/* Comments loading state */}
              {commentsLoading && (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-white p-4 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comments list */}
              {!commentsLoading &&
                comments.length > 0 &&
                comments.map((comment) => (
                  <CommentInfoCard
                    key={comment._id}
                    commentId={comment._id || null}
                    authorName={comment.author?.name}
                    authorPhoto={comment.author?.profileImageUrl}
                    authorId={comment.author?._id}
                    content={comment.content}
                    likes={comment.likes || 0}
                    updatedOn={
                      comment.updatedAt
                        ? moment(comment.updatedAt).format("Do MMM YYYY")
                        : "-"
                    }
                    post={comment.post}
                    replies={comment.replies || []}
                    getAllComments={() => fetchComments(blogPostData._id)}
                  />
                ))}

              {/* No comments state */}
              {!commentsLoading && comments.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="w-12 h-12 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              )}
            </div>
          </div>
          <LikeCommentButton
            postId={blogPostData._id || ""}
            likes={blogPostData.likes || 0}
            comments={comments?.length || 0}
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <TrendingPostSection />
        </div>
      </div>

      <Drawer
        isOpen={openSummarizeDrawer}
        onClose={() => setOpenSummarizeDrawer(false)}
        title={!summaryLoading && summaryContent?.title}
      >
        {errorMsg && (
          <p className="flex gap-2 text-sm text-amber-600 font-medium">
            <LuCircleAlert className="mt-1" /> {errorMsg}
          </p>
        )}
        {summaryLoading && <SkeletonLoader />}
        {!summaryLoading && summaryContent && (
          <MarkDownContent content={summaryContent?.summary || " "} />
        )}
      </Drawer>
    </BlogLayout>
  );
});

BlogPostView.displayName = "BlogPostView";

export default BlogPostView;
