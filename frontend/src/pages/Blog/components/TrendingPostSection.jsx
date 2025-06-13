import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

const TrendingPostSection = () => {
  const navigate = useNavigate();
  const [postList, setPostList] = useState([]);

  const getTrendingPosts = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.POSTS.GET_TRENDING_POST
      );

      setPostList(response.data?.length > 0 ? response.data : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleClick = (post) => {
    navigate(`/${post.slug}`);
  };

  useEffect(() => {
    getTrendingPosts();
    return () => {};
  }, []);

  return (
    <div>
      <h4 className="text-base text-black font-medium mb-3">Recent Posts</h4>
      {postList.length > 0 &&
        postList.map((item) => (
          <PostCard
            key={item._id}
            title={item.title}
            coverImageUrl={item.coverImageUrl}
            tags={item.tags}
            onClick={() => handleClick(item)}
          />
        ))}
    </div>
  );
};

export default TrendingPostSection;

const PostCard = ({ title, coverImageUrl, tags, onClick }) => {
  return (
    <div className="cursor-pointer mb-3" onClick={onClick}>
      <h6 className="text-[10px] font-semibold text-sky-500">
        {tags[0]?.toUpperCase() || "BLOG"}
      </h6>
      <div className="flex items-start gap-4 mt-2">
        <img
          src={coverImageUrl}
          alt={title}
          className="w-14 h-14 object-cover rounded"
        />
        <h2 className="text-sm md:text-sm font-medium mb-2 line-clamp-3">
          {title}
        </h2>
      </div>
    </div>
  );
};
