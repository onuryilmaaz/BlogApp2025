import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import OptimizedImage from "../../../components/ui/OptimizedImage";

const BlogPostSummaryCard = React.memo(
  ({
    title,
    coverImageUrl,
    description,
    tags = [],
    updatedOn,
    authorName,
    authProfileImg,
    onClick,
  }) => {
    const navigate = useNavigate();

    const handleTagClick = useCallback(
      (e, tag) => {
        e.stopPropagation();
        navigate(`/tag/${tag}`);
      },
      [navigate]
    );

    return (
      <div
        className="bg-white shadow-lg shadow-gray-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
        onClick={onClick}
      >
        <OptimizedImage
          src={coverImageUrl}
          alt={title}
          className="w-full h-64 object-cover"
          loading="lazy"
          fallbackSrc="/placeholder-image.jpg"
        />
        <div className="p-4 md:p-6">
          <h2 className="text-base md:text-lg font-bold mb-2 line-clamp-3">
            {title}
          </h2>
          <p className="text-gray-700 text-xs mb-4 line-clamp-3">
            {description}
          </p>
          <div className="flex items-center flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <button
                key={`${tag}-${index}`}
                className="bg-sky-200/50 text-sky-800/80 text-xs font-medium px-3 py-0.5 rounded-full text-nowrap cursor-pointer hover:bg-sky-300/50 transition-colors"
                onClick={(e) => handleTagClick(e, tag)}
              >
                # {tag}
              </button>
            ))}
          </div>
          <div className="flex items-center">
            <OptimizedImage
              src={authProfileImg}
              alt={authorName}
              className="w-8 h-8 rounded-full mr-2"
              loading="lazy"
              fallbackSrc="/default-avatar.png"
            />
            <div>
              <p className="text-gray-600 text-sm">{authorName}</p>
              <p className="text-gray-500 text-xs">{updatedOn}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BlogPostSummaryCard.displayName = "BlogPostSummaryCard";

export default BlogPostSummaryCard;
