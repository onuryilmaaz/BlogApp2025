//import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import moment from "moment";
import CommentInfoCard from "../../components/Cards/CommentInfoCard";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import Modal from "../../components/Modal";
import DeleteAlertContent from "../../components/DeleteAlertContent";
import { LuMessageCircle } from "react-icons/lu";

const Comments = () => {
  //const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({
    open: false,
    data: null,
  });

  // Loading shimmer component
  const LoadingShimmer = ({ className = "" }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  // Comment card skeleton
  const CommentCardSkeleton = () => (
    <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50 mb-4">
      <div className="flex items-start gap-4">
        <LoadingShimmer className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <LoadingShimmer className="h-4 w-24" />
            <LoadingShimmer className="h-4 w-20" />
          </div>
          <LoadingShimmer className="h-4 w-full mb-2" />
          <LoadingShimmer className="h-4 w-3/4 mb-4" />

          {/* Post info skeleton */}
          <div className="flex items-center gap-3 mb-3">
            <LoadingShimmer className="w-16 h-16 rounded-lg" />
            <div className="flex-1">
              <LoadingShimmer className="h-4 w-3/4 mb-1" />
              <LoadingShimmer className="h-3 w-1/2" />
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex gap-2">
            <LoadingShimmer className="h-8 w-16 rounded-full" />
            <LoadingShimmer className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );

  const getAllComments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching comments...");

      const response = await axiosInstance.get(API_PATHS.COMMENTS.GET_ALL);

      console.log("Comments API Response:", response.data);
      setComments(response.data?.length > 0 ? response.data : []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setError(error.message || "Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await axiosInstance.delete(API_PATHS.COMMENTS.DELETE(commentId));
      toast.success("Comment Deleted Successfully");
      setOpenDeleteAlert({
        open: false,
        data: null,
      });
      getAllComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  useEffect(() => {
    getAllComments();
    return () => {};
  }, []);

  if (loading) {
    return (
      <DashboardLayout activeMenu="Comments">
        <div className="w-auto sm:max-w-[900px] mx-auto">
          <LoadingShimmer className="h-8 w-32 mt-2 mb-5" />

          {/* Comments skeleton */}
          {[...Array(5)].map((_, i) => (
            <CommentCardSkeleton key={i} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activeMenu="Comments">
        <div className="w-auto sm:max-w-[900px] mx-auto">
          <h2 className="text-2xl font-semibold mt-2 mb-5">Comments</h2>
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-2">
              ⚠️ Error Loading Comments
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={getAllComments}
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
    <DashboardLayout activeMenu="Comments">
      <div className="w-auto sm:max-w-[900px] mx-auto">
        <h2 className="text-2xl font-semibold mt-2 mb-5">
          Comments{" "}
          {comments.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({comments.length} total)
            </span>
          )}
        </h2>

        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentInfoCard
              key={comment._id}
              commentId={comment._id || null}
              authorName={comment.author?.name || "Anonymous"}
              authorPhoto={comment.author?.profileImageUrl}
              authorId={comment.author?._id}
              content={comment.content || "No content"}
              likes={comment.likes || 0}
              updatedOn={
                comment.updatedAt
                  ? moment(comment.updatedAt).format("Do MMM YYYY")
                  : "-"
              }
              post={comment.post}
              replies={comment.replies || []}
              getAllComments={getAllComments}
              onDelete={(commentId) =>
                setOpenDeleteAlert({
                  open: true,
                  data: commentId || comment._id,
                })
              }
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <LuMessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No Comments Yet
            </h3>
            <p className="text-gray-500">
              Comments from your blog posts will appear here.
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={openDeleteAlert?.open}
        onClose={() =>
          setOpenDeleteAlert({
            open: false,
            data: null,
          })
        }
        title="Delete Alert"
      >
        <div className="w-[70vw] md:w-[30vw]">
          <DeleteAlertContent
            content="Are you sure you want to delete this comment?"
            onDelete={() => deleteComment(openDeleteAlert.data)}
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Comments;
