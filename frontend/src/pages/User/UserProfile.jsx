import React, { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import useUserStore from "../../stores/userStore";
import toast from "react-hot-toast";

import Input from "../../components/Inputs/Input";
import { uploadImage } from "../../utils/uploadImage";

const UserProfile = () => {
  const { user, setUser } = useUserStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    profileImageUrl: user?.profileImageUrl || "",
  });
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      const response = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        profileData
      );
      return response.data;
    },
    onSuccess: (data) => {
      setUser(data);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries(["user"]);
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Failed to update profile. Please try again.";
      toast.error(message);
      setErrors({ general: message });
    },
  });

  // Handle input changes
  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear field-specific error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  // Handle profile image upload
  const handleImageUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({ ...prev, profileImageUrl: imageUrl }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setImageUploading(false);
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Basic validation
      const newErrors = {};
      if (!formData.name.trim()) {
        newErrors.name = "Name is required";
      } else if (formData.name.length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      }

      if (formData.bio && formData.bio.length > 500) {
        newErrors.bio = "Bio cannot exceed 500 characters";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Clear errors and submit
      setErrors({});
      updateProfileMutation.mutate(formData);
    },
    [formData, updateProfileMutation]
  );

  // Cancel editing
  const handleCancel = useCallback(() => {
    setFormData({
      name: user?.name || "",
      bio: user?.bio || "",
      profileImageUrl: user?.profileImageUrl || "",
    });
    setErrors({});
    setIsEditing(false);
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={formData.profileImageUrl || "/default-avatar.png"}
                  alt="Profile"
                  className="w-20 h-20 rounded-full border-4 border-white object-cover"
                />
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 cursor-pointer shadow-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={imageUploading}
                    />
                    {imageUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    ) : (
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </label>
                )}
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">{user?.name}</h1>
                <p className="text-blue-100">{user?.email}</p>
                <p className="text-blue-100 text-sm">Role: {user?.role}</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="px-6 py-6">
            {!isEditing ? (
              // View Mode
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <p className="text-gray-900">{user?.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <p className="text-gray-900">
                    {user?.bio || "No bio provided"}
                  </p>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  value={formData.name}
                  onChange={({ target }) =>
                    handleInputChange("name", target.value)
                  }
                  label="Name"
                  placeholder="Enter your name"
                  error={errors.name}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={({ target }) =>
                      handleInputChange("bio", target.value)
                    }
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.bio && (
                    <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                {errors.general && (
                  <p className="text-red-500 text-sm">{errors.general}</p>
                )}

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending
                      ? "Updating..."
                      : "Update Profile"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
