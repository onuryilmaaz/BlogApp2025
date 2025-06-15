import { LuMessageCircleDashed } from "react-icons/lu";
import { PiHandsClapping } from "react-icons/pi";
import clsx from "clsx";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import useUserStore from "../../../stores/userStore";

const LikeCommentButton = ({
  postId,
  likes,
  comments,
  isLikedByUser = false,
}) => {
  const [postLikes, setPostLikes] = useState(likes || 0);
  const [isLiked, setIsLiked] = useState(isLikedByUser);
  const [isLoading, setIsLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    setIsLiked(isLikedByUser);
  }, [isLikedByUser]);

  const handleLikeClick = async () => {
    if (!postId) return;

    if (!user) {
      toast.error("Beğenmek için giriş yapmanız gerekiyor!", {
        duration: 3000,
        style: {
          background: "#f59e0b",
          color: "#fff",
        },
      });
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      setAnimating(true);

      const response = await axiosInstance.put(API_PATHS.POSTS.LIKE(postId));

      if (response.data) {
        setPostLikes(response.data.likes);
        setIsLiked(response.data.isLiked);

        toast.success(
          response.data.isLiked ? "Post beğenildi! 👏" : "Beğeni kaldırıldı",
          {
            duration: 2000,
            style: {
              background: response.data.isLiked ? "#10b981" : "#6b7280",
              color: "#fff",
            },
          }
        );
      }

      setTimeout(() => {
        setAnimating(false);
      }, 500);
    } catch (error) {
      console.error("Like error:", error);
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.", {
        duration: 3000,
        style: {
          background: "#ef4444",
          color: "#fff",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="fixed bottom-8 right-8 px-6 py-3 bg-black text-white rounded-full shadow-lg flex items-center justify-center">
        <button
          className={`flex items-end gap-2 cursor-pointer transition-opacity ${
            isLoading ? "opacity-50" : ""
          }`}
          onClick={handleLikeClick}
          disabled={isLoading}
        >
          <PiHandsClapping
            className={clsx(
              "text-[22px] transition-all duration-300",
              (animating || isLiked) && "scale-125 text-cyan-500",
              isLiked && "text-cyan-400"
            )}
          />
          <span className="text-base font-medium leading-4">{postLikes}</span>
        </button>
        <div className="h-6 w-px bg-gray-500 mx-5"></div>
        <button className="flex items-end gap-2">
          <LuMessageCircleDashed className="text-[22px]" />
          <span className="text-base font-medium leading-4">{comments}</span>
        </button>
      </div>
    </div>
  );
};

export default LikeCommentButton;
