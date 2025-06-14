/* eslint-disable react-hooks/exhaustive-deps */
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { LuGalleryVerticalEnd, LuLoaderCircle, LuPlus } from "react-icons/lu";
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
          status: filterStatus.toLocaleLowerCase(),
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
            {[...Array(3)].map((_, i) => (
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
                <BlogPostSummaryCard
                  key={post._id}
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
                  : `No ${filterStatus.toLowerCase()} posts found.`}
              </p>
              <button
                className="btn-small"
                onClick={() => navigate("/admin/create")}
              >
                <LuPlus className="text-[18px]" /> Create Your First Post
              </button>
            </div>
          )}
        </div>
      </div>

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
    </DashboardLayout>
  );
};

export default BlogPosts;
