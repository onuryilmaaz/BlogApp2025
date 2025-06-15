import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import {
  LuUser,
  LuMail,
  LuFileText,
  LuImage,
  LuShield,
  LuSave,
  LuX,
  LuPencil,
  LuTrash2,
} from "react-icons/lu";

import Modal from "../../components/Modal";
import Input from "../../components/Inputs/Input";
import DeleteAlertContent from "../../components/DeleteAlertContent";

const UserManagement = () => {
  const queryClient = useQueryClient();

  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    bio: "",
    profileImageUrl: "",
    role: "Member",
  });
  const [errors, setErrors] = useState({});

  // Fetch all users
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL);
      return response.data;
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }) => {
      const response = await axiosInstance.put(
        API_PATHS.USERS.UPDATE(userId),
        userData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setEditingUser(null);
      toast.success("User updated successfully!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to update user";
      toast.error(message);
      setErrors({ general: message });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await axiosInstance.delete(
        API_PATHS.USERS.DELETE(userId)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setDeletingUser(null);
      toast.success("User deleted successfully!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to delete user";
      toast.error(message);
    },
  });

  // Handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      bio: user.bio || "",
      profileImageUrl: user.profileImageUrl || "",
      role: user.role,
    });
    setErrors({});
  };

  // Handle form change
  const handleFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle form submit
  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    const newErrors = {};
    if (!editForm.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!editForm.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateUserMutation.mutate({
      userId: editingUser._id,
      userData: editForm,
    });
  };

  // Handle delete user
  const handleDeleteUser = () => {
    if (deletingUser) {
      deleteUserMutation.mutate(deletingUser._id);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout activeMenu="User Management">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activeMenu="User Management">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-red-500">
            Error loading users: {error.message}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="User Management">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users in the system</p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={user.profileImageUrl || "/default-avatar.png"}
                          alt=""
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.bio
                              ? user.bio.substring(0, 50) +
                                (user.bio.length > 50 ? "..." : "")
                              : "No bio"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "Admin"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 mr-3"
                      >
                        <LuPencil className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingUser(user)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
                      >
                        <LuTrash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <Modal
            isOpen={true}
            onClose={() => setEditingUser(null)}
            title="User Edit"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-[70vw] md:w-[300vw] max-w-5xl  mx-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-sky-400 to-cyan-500 px-6 py-4 text-white relative">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={editingUser.profileImageUrl || "/default-avatar.png"}
                      alt={editingUser.name}
                      className="w-16 h-16 rounded-full object-cover border-3 border-white/30"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <LuPencil className="w-3 h-3 text-sky-500" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Edit User Profile</h2>
                    <p className="text-sky-100 text-sm">
                      Update user information and permissions
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className="px-2 py-1 bg-white/20 rounded text-xs">
                        {editingUser.name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          editingUser.role === "Admin"
                            ? "bg-red-400/30 text-red-100"
                            : "bg-green-400/30 text-green-100"
                        }`}
                      >
                        {editingUser.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleFormSubmit} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <LuUser className="inline w-4 h-4 mr-2 text-sky-500" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={({ target }) =>
                          handleFormChange("name", target.value)
                        }
                        placeholder="Enter full name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <LuMail className="inline w-4 h-4 mr-2 text-cyan-500" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={({ target }) =>
                          handleFormChange("email", target.value)
                        }
                        placeholder="Enter email address"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Role Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <LuShield className="inline w-4 h-4 mr-2 text-sky-500" />
                        User Role & Permissions
                      </label>
                      <select
                        value={editForm.role}
                        onChange={({ target }) =>
                          handleFormChange("role", target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-white appearance-none cursor-pointer"
                      >
                        <option value="Member">
                          👤 Member - Standard User
                        </option>
                        <option value="Admin">🛡️ Admin - Full Access</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Bio Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <LuFileText className="inline w-4 h-4 mr-2 text-cyan-500" />
                        Bio & Description
                      </label>
                      <textarea
                        value={editForm.bio}
                        onChange={({ target }) =>
                          handleFormChange("bio", target.value)
                        }
                        placeholder="Tell us about this user..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 bg-white resize-none"
                      />
                    </div>

                    {/* Profile Image URL Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <LuImage className="inline w-4 h-4 mr-2 text-sky-500" />
                        Profile Image URL
                      </label>
                      <input
                        type="url"
                        value={editForm.profileImageUrl}
                        onChange={({ target }) =>
                          handleFormChange("profileImageUrl", target.value)
                        }
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                      {editForm.profileImageUrl && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <img
                              src={editForm.profileImageUrl}
                              alt="Preview"
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Image Preview
                              </p>
                              <p className="text-xs text-gray-500">
                                This will be the user's profile picture
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {errors.general && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <LuX className="w-4 h-4 text-red-500" />
                      <p className="text-red-700 text-sm font-medium">
                        {errors.general}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Last updated:{" "}
                    {new Date(
                      editingUser.updatedAt || editingUser.createdAt
                    ).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateUserMutation.isPending}
                      className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center space-x-2"
                    >
                      {updateUserMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <LuSave className="w-4 h-4" />
                          <span>Update User</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* Delete User Modal */}
        {deletingUser && (
          <Modal
            isOpen={true}
            onClose={() => setDeletingUser(null)}
            title="Delete User"
          >
            <DeleteAlertContent
              title="Are you sure?"
              message={`This will permanently delete the user "${deletingUser.name}" and all associated data. This action cannot be undone.`}
              onConfirm={handleDeleteUser}
              onCancel={() => setDeletingUser(null)}
              isLoading={deleteUserMutation.isPending}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
