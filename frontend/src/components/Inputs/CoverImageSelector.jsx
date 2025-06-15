import { useRef, useState } from "react";
import { LuTrash, LuFileImage, LuLoaderCircle } from "react-icons/lu";
import { uploadImage } from "../../utils/uploadUtils";

const CoverImageSelector = ({ image, setImage, preview, setPreview }) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Show preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      if (setPreview) {
        setPreview(localPreview);
      }

      // Upload to backend
      setUploading(true);
      setUploadError(null);

      try {
        const uploadResult = await uploadImage(file);

        // Set the backend URL as the image
        setImage(uploadResult.imageUrl);

        // Clean up local preview and use backend URL
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(null);
        if (setPreview) {
          setPreview(uploadResult.imageUrl);
        }

        ("Image uploaded successfully:", uploadResult);
      } catch (error) {
        console.error("Upload failed:", error);
        setUploadError(error.response?.data?.message || "Upload failed");

        // Keep local preview on error
        setImage(null);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreviewUrl(null);
    setUploadError(null);
    if (setPreview) {
      setPreview(null);
    }
  };

  const onChooseFile = () => {
    if (!uploading) {
      inputRef.current.click();
    }
  };

  const displayImage = image || preview || previewUrl;

  return (
    <div className="mb-6">
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
        disabled={uploading}
      />

      {uploadError && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {uploadError}
        </div>
      )}

      {!displayImage ? (
        <div
          className={`w-full h-56 flex flex-col items-center justify-center gap-2 bg-gray-50/50 rounded-md border border-dashed border-gray-300 cursor-pointer relative ${
            uploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={onChooseFile}
        >
          <div className="w-14 h-14 flex items-center justify-center bg-sky-50 rounded-full">
            {uploading ? (
              <LuLoaderCircle className="text-xl text-sky-600 animate-spin" />
            ) : (
              <LuFileImage className="text-xl text-sky-600" />
            )}
          </div>
          <p className="text-sm text-gray-700">
            {uploading ? "Uploading..." : "Click to upload a cover image"}
          </p>
        </div>
      ) : (
        <div className="relative w-full h-56">
          <img
            src={displayImage}
            alt="Cover"
            className={`w-full h-full object-cover rounded-md ${
              uploading ? "opacity-50" : ""
            }`}
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-md">
              <div className="bg-white rounded-full p-3">
                <LuLoaderCircle className="text-xl text-sky-600 animate-spin" />
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={uploading}
            className={`absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-md cursor-pointer ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <LuTrash />
          </button>
        </div>
      )}
    </div>
  );
};

export default CoverImageSelector;
