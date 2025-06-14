import moment from "moment";
import { LuDot, LuUser } from "react-icons/lu";

const RecentCommentsList = ({ comments }) => {
  return (
    <div className="mt-4">
      <ul className="space-y-4">
        {comments?.slice(0, 10)?.map((comment) => (
          <li
            key={comment._id}
            className="flex gap-4 border-b border-gray-100 pb-4 last:border-none"
          >
            {/* Author Profile Image with Fallback */}
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden">
              {comment.author?.profileImageUrl ? (
                <img
                  src={comment.author.profileImageUrl}
                  alt={comment.author?.name || "User"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <LuUser
                className="text-sky-500 text-lg"
                style={{
                  display: comment.author?.profileImageUrl ? "none" : "flex",
                }}
              />
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-[13px] text-gray-500">
                      @{comment.author?.name || "Anonymous"}
                    </p>
                    <LuDot className="text-gray-500" />
                    <span className="text-[12px] text-gray-500 font-medium">
                      {moment(comment.updatedAt || comment.createdAt).format(
                        "Do MMM YYYY"
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-black mt-0.5 line-clamp-2">
                    {comment.content || "No content"}
                  </p>
                </div>
              </div>

              {/* Post Information */}
              {comment.post && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                    {comment.post.coverImageUrl ? (
                      <img
                        src={comment.post.coverImageUrl}
                        alt={comment.post?.title || "Post"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs"
                      style={{
                        display: comment.post.coverImageUrl ? "none" : "flex",
                      }}
                    >
                      📄
                    </div>
                  </div>
                  <p className="text-[13px] text-gray-700 line-clamp-2 flex-1">
                    {comment.post?.title || "Untitled Post"}
                  </p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentCommentsList;
