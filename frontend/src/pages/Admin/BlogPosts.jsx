/* eslint-disable react-hooks/exhaustive-deps */
import DashboardLayout from "../../components/layouts/DashboardLayout";
import {
  LuGalleryVerticalEnd,
  LuLoaderCircle,
  LuPlus,
  LuBot,
  LuCheck,
  LuX,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import moment from "moment";
import Modal from "../../components/Modal";
import { useEffect, useState } from "react";
import Tabs from "../../components/Tabs";
import BlogPostSummaryCard from "../../components/Cards/BlogPostSummaryCard";
import DeleteAlertContent from "../../components/DeleteAlertContent";

const BlogPosts = () => {
  const navigate = useNavigate();

  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [blogPostList, setBlogPostList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({
    open: false,
    data: null,
  });
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingPost, setReviewingPost] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Loading shimmer component
  const LoadingShimmer = ({ className = "" }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  // Post card skeleton
  const PostCardSkeleton = () => (
    <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50 mb-4">
      <div className="flex items-start gap-4">
        <LoadingShimmer className="w-20 h-20 rounded-lg" />
        <div className="flex-1">
          <LoadingShimmer className="h-5 w-3/4 mb-2" />
          <LoadingShimmer className="h-4 w-1/2 mb-3" />
          <div className="flex gap-2 mb-3">
            <LoadingShimmer className="h-6 w-16 rounded-full" />
            <LoadingShimmer className="h-6 w-20 rounded-full" />
            <LoadingShimmer className="h-6 w-14 rounded-full" />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <LoadingShimmer className="h-4 w-16" />
              <LoadingShimmer className="h-4 w-16" />
            </div>
            <LoadingShimmer className="h-8 w-20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  const getAllPosts = async (pageNumber = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axiosInstance.get(API_PATHS.POSTS.GET_ALL, {
        params: {
          status:
            filterStatus === "Pending Review"
              ? "pendingReview"
              : filterStatus.toLocaleLowerCase(),
          page: pageNumber,
        },
      });

      const { posts, totalPages, counts } = response.data;

      setBlogPostList((prevPosts) =>
        pageNumber === 1 ? posts : [...prevPosts, ...posts]
      );
      setTotalPages(totalPages);
      setPage(pageNumber);

      const statusSummary = counts || {};

      const statusArray = [
        { label: "All", count: statusSummary.all || 0 },
        { label: "Published", count: statusSummary.published || 0 },
        { label: "Draft", count: statusSummary.draft || 0 },
        { label: "Pending Review", count: statusSummary.pendingReview || 0 },
      ];

      setTabs(statusArray);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to fetch blog posts");
    } finally {
      setIsLoading(false);
      setInitialLoading(false);
    }
  };

  const deletePost = async (postId) => {
    try {
      await axiosInstance.delete(API_PATHS.POSTS.DELETE(postId));

      toast.success("Blog Post Deleted Successfully");
      setOpenDeleteAlert({
        open: false,
        data: null,
      });
      getAllPosts();
    } catch (error) {
      console.error("Error deleting blog post:", error);
      toast.error("Failed to delete blog post");
    }
  };

  const handleReviewPost = (post) => {
    setReviewingPost(post);
    setReviewModalOpen(true);
  };

  const approvePost = async () => {
    try {
      setReviewLoading(true);
      await axiosInstance.put(
        `${API_PATHS.POSTS.UPDATE(reviewingPost._id)}/review`,
        {
          approve: true,
        }
      );

      toast.success("Post approved successfully!");
      setReviewModalOpen(false);
      setReviewingPost(null);
      getAllPosts(); // Refresh the list
    } catch (error) {
      console.error("Error approving post:", error);
      toast.error("Failed to approve post");
    } finally {
      setReviewLoading(false);
    }
  };

  const rejectPost = async () => {
    try {
      setReviewLoading(true);
      await axiosInstance.put(
        `${API_PATHS.POSTS.UPDATE(reviewingPost._id)}/review`,
        {
          approve: false,
        }
      );

      toast.success("Post rejected and deleted");
      setReviewModalOpen(false);
      setReviewingPost(null);
      getAllPosts(); // Refresh the list
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast.error("Failed to reject post");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      getAllPosts(page + 1);
    }
  };

  useEffect(() => {
    setInitialLoading(true);
    getAllPosts(1);
    return () => {};
  }, [filterStatus]);

  if (initialLoading) {
    return (
      <DashboardLayout activeMenu="Blog Posts">
        <div className="w-auto sm:max-w-[900px] mx-auto">
          <div className="flex items-center justify-between">
            <LoadingShimmer className="h-8 w-32 mt-5 mb-5" />
            <LoadingShimmer className="h-10 w-32 rounded-lg" />
          </div>

          {/* Tabs skeleton */}
          <div className="flex gap-2 mb-5">
            {[...Array(4)].map((_, i) => (
              <LoadingShimmer key={i} className="h-10 w-24 rounded-lg" />
            ))}
          </div>

          {/* Posts skeleton */}
          <div className="mt-5">
            {[...Array(5)].map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activeMenu="Blog Posts">
        <div className="w-auto sm:max-w-[900px] mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-2">
              ⚠️ Error Loading Posts
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => getAllPosts(1)}
              className="bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Blog Posts">
      <div className="w-auto sm:max-w-[900px] mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold mt-5 mb-5">Blog Posts</h2>
          <button
            className="btn-small"
            onClick={() => navigate("/admin/create")}
          >
            <LuPlus className="text-[18px]" /> Create Post
          </button>
        </div>

        <Tabs
          tabs={tabs}
          activeTab={filterStatus}
          setActiveTab={setFilterStatus}
        />

        <div className="mt-5">
          {blogPostList.length > 0 ? (
            <>
              {blogPostList.map((post) => (
                <div key={post._id} className="relative">
                  <BlogPostSummaryCard
                    title={post.title}
                    imgUrl={post.coverImageUrl}
                    updatedOn={
                      post.updatedAt
                        ? moment(post.updatedAt).format("Do MMM YYYY")
                        : "-"
                    }
                    tags={post.tags}
                    likes={post.likes}
                    views={post.views}
                    onClick={() => navigate(`/admin/edit/${post.slug}`)}
                    onDelete={() =>
                      setOpenDeleteAlert({ open: true, data: post._id })
                    }
                  />

                  {/* AI Review Badge and Review Button */}
                  {post.needsReview && (
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                        <LuBot className="w-3 h-3" />
                        AI Generated
                      </span>
                      <button
                        onClick={() => handleReviewPost(post)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {page < totalPages && (
                <div className="flex items-center justify-center mb-8">
                  <button
                    className="flex items-center gap-3 text-sm text-white font-medium bg-black px-7 py-2.5 rounded-full text-nowrap hover:scale-105 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    onClick={handleLoadMore}
                  >
                    {isLoading ? (
                      <LuLoaderCircle className="animate-spin text-[15px] " />
                    ) : (
                      <LuGalleryVerticalEnd className="text-lg" />
                    )}{" "}
                    {isLoading ? "Loading.." : "Load More"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <LuGalleryVerticalEnd className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No Posts Found
              </h3>
              <p className="text-gray-500 mb-6">
                {filterStatus === "All"
                  ? "You haven't created any blog posts yet."
                  : filterStatus === "Pending Review"
                  ? "No posts pending review."
                  : `No ${filterStatus.toLowerCase()} posts found.`}
              </p>
              {filterStatus !== "Pending Review" && (
                <button
                  className="btn-small"
                  onClick={() => navigate("/admin/create")}
                >
                  <LuPlus className="text-[18px]" /> Create Your First Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Post Modal */}
      <Modal
        isOpen={openDeleteAlert?.open}
        onClose={() => {
          setOpenDeleteAlert({ open: false, data: null });
        }}
        title="Delete Alert"
      >
        <div className="w-[70vw] md:w-[30vw]">
          <DeleteAlertContent
            content="Are you sure you want to delete this blog post?"
            onDelete={() => deletePost(openDeleteAlert.data)}
          />
        </div>
      </Modal>

      {/* AI Content Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setReviewingPost(null);
        }}
        title="AI Generated Content Review"
      >
        {reviewingPost && (
          <div className="w-[80vw] max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Post Info */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <LuBot className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">
                    AI Generated Content
                  </span>
                </div>
                <p className="text-sm text-orange-700">
                  This content was generated by AI and requires human review
                  before publication.
                </p>
              </div>

              {/* Post Preview */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Title
                  </h3>
                  <p className="text-gray-700 font-medium">
                    {reviewingPost.title}
                  </p>
                </div>

                {reviewingPost.coverImageUrl && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Cover Image
                    </h3>
                    <img
                      src={reviewingPost.coverImageUrl}
                      alt={reviewingPost.title}
                      className="w-full max-w-md h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {reviewingPost.tags?.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Content Preview
                  </h3>
                  <div className="bg-gray-50 border rounded-lg p-4 max-h-60 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {reviewingPost.content?.substring(0, 1000)}
                      {reviewingPost.content?.length > 1000 && "..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Review Actions */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t">
                <button
                  onClick={() => {
                    setReviewModalOpen(false);
                    setReviewingPost(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={rejectPost}
                  disabled={reviewLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {reviewLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <LuX className="w-4 h-4" />
                  )}
                  Reject & Delete
                </button>
                <button
                  onClick={approvePost}
                  disabled={reviewLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {reviewLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <LuCheck className="w-4 h-4" />
                  )}
                  Approve & Publish
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default BlogPosts;
