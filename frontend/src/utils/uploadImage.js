import { API_PATHS } from "./apiPaths";
import axiosInstance from "./axiosInstance";

const uploadImage = async (imageFile) => {
  const formData = new FormData();

  formData.append("image", imageFile);

  try {
    const response = await axiosInstance.post(
      API_PATHS.IMAGE.UPLOAD_IMAGE,
      formData
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading the image:", error);
    throw error;
  }
};

// Export both named and default
export { uploadImage };
export default uploadImage;
