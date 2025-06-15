import { useState } from "react";
import {
  LuChevronDown,
  LuDot,
  LuReply,
  LuTrash2,
  LuCheck,
  LuX,
  LuPencil,
} from "react-icons/lu";
import { PiHandsClapping } from "react-icons/pi";
import useUserStore from "../../../stores/userStore";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import toast from "react-hot-toast";
import CommentReplyInput from "../../../components/Inputs/CommentReplyInput";
import moment from "moment";

const CommentInfoCard = ({
  commentId,
  authorName,
  authorPhoto,
  authorId,
  content,
  updatedOn,
  post,
  replies,
  getAllComments,
  onDelete,
  isSubReply,
  likes = 0,
}) => {
  const user = useUserStore((state) => state.user);
  const setOpenAuthForm = useUserStore((state) => state.setOpenAuthForm);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(content);
  const [currentLikes, setCurrentLikes] = useState(likes);

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showSubReplies, setShowSubReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Check if current user can edit this comment
  const canEdit = user && (user._id === authorId || user.role === "Admin");

  const handleCancelReply = () => {
    setReplyText("");
    setShowReplyForm(false);
  };

  const handleAddReply = async () => {
    try {
      await axiosInstance.post(API_PATHS.COMMENTS.ADD(post._id), {
        content: replyText,
        parentComment: commentId,
      });

      toast.success("Reply added successfully");
      setReplyText("");
      setShowReplyForm(false);
      getAllComments();
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    }
  };

  const handleEditComment = async () => {
    if (!editText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setIsUpdating(true);
      await axiosInstance.put(API_PATHS.COMMENTS.UPDATE(commentId), {
        content: editText,
      });

      toast.success("Comment updated successfully");
      setIsEditing(false);
      getAllComments(); // Refresh comments to show updated content
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
      setEditText(content); // Reset to original content
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(content);
    setIsEditing(false);
  };

  const handleLikeComment = async () => {
    if (!user) {
      setOpenAuthForm(true);
      return;
    }

    try {
      setIsLiking(true);
      const response = await axiosInstance.post(
        API_PATHS.COMMENTS.LIKE(commentId)
      );

      // Optimistically update the like count
      setCurrentLikes(response.data.likes);
      toast.success("Comment liked!");
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error("Failed to like comment");
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="bg-white p-3 rounded-lg cursor-pointer group mb-5">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-8 order-2 md:order-1">
          <div className="flex items-start gap-3">
            <img
              src={authorPhoto}
              alt={authorName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <h3 className="text-[12px] text-gray-500 font-medium">
                  @{authorName}
                </h3>
                <LuDot className="text-gray-500" />
                <span className="text-[12px] text-gray-500 font-medium">
                  {updatedOn}
                </span>
              </div>

              {/* Comment Content - Edit Mode or Display Mode */}
              {isEditing ? (
                <div className="mt-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Edit your comment..."
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={handleEditComment}
                      disabled={isUpdating}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        <LuCheck className="w-3 h-3" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600"
                    >
                      <LuX className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-black font-medium">{content}</p>
              )}

              <div className="flex items-center gap-3 mt-1.5">
                {/* Like Button */}
                <button
                  onClick={handleLikeComment}
                  disabled={isLiking}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-purple-600 bg-purple-50 px-3 py-0.5 rounded-full hover:bg-purple-500 hover:text-white cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isLiking ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                  ) : (
                    <PiHandsClapping className="w-3 h-3" />
                  )}
                  {currentLikes}
                </button>

                {/* Edit Button (only for comment author or admin) */}
                {canEdit && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-green-600 bg-green-50 px-3 py-0.5 rounded-full hover:bg-green-500 hover:text-white cursor-pointer transition-colors"
                  >
                    <LuPencil className="w-3 h-3" />
                    Edit
                  </button>
                )}

                {!isSubReply && (
                  <>
                    <button
                      className="flex items-center gap-2 text-[13px] font-medium text-sky-600 bg-sky-50 px-4 py-0.5 rounded-full hover:bg-sky-500 hover:text-white cursor-pointer transition-colors"
                      onClick={() => {
                        if (!user) {
                          ("User:", user);
                          setOpenAuthForm(true);
                          return;
                        }
                        setShowReplyForm((prevState) => !prevState);
                      }}
                    >
                      <LuReply /> Reply
                    </button>
                    <button
                      className="flex items-center gap-1.5 text-[13px] font-medium text-sky-600 bg-sky-50 px-4 py-0.5 rounded-full hover:bg-sky-500 hover:text-white cursor-pointer transition-colors"
                      onClick={() =>
                        setShowSubReplies((prevState) => !prevState)
                      }
                    >
                      {replies?.length || 0}{" "}
                      {replies?.length == 1 ? "reply" : "replies"}{" "}
                      <LuChevronDown
                        className={`transition-transform ${
                          showSubReplies ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {!isSubReply && showReplyForm && (
        <CommentReplyInput
          user={user}
          authorName={authorName}
          content={content}
          replyText={replyText}
          setReplyText={setReplyText}
          handleAddReply={handleAddReply}
          handleCancelReply={handleCancelReply}
          disableAutoGen
        />
      )}

      {showSubReplies &&
        replies?.length > 0 &&
        replies.map((comment, index) => (
          <div key={comment._id} className={`ml-5 ${index == 0 ? "mt-5" : ""}`}>
            <CommentInfoCard
              commentId={comment._id}
              authorName={comment.author.name}
              authorPhoto={comment.author.profileImageUrl}
              authorId={comment.author._id}
              content={comment.content}
              post={comment.post}
              replies={comment.replies || []}
              likes={comment.likes || 0}
              isSubReply
              updatedOn={
                comment.updatedAt
                  ? moment(comment.updatedAt).format("Do MMM YYYY")
                  : "-"
              }
              onDelete={() => onDelete(comment._id)}
              getAllComments={getAllComments}
            />
          </div>
        ))}
    </div>
  );
};

export default CommentInfoCard;
