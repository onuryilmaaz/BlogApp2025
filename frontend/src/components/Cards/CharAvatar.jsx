import { getInitials } from "../../utils/helper";

const CharAvatar = ({ fullName, widht, height, style }) => {
  return (
    <div
      className={`${widht || "w-12"} ${height || "h-12"} ${
        style || ""
      } flex items-center justify-center  rounded-full text-gray-900 font-medium bg-gray-100`}
    >
      {getInitials(fullName || "")}
    </div>
  );
};

export default CharAvatar;
