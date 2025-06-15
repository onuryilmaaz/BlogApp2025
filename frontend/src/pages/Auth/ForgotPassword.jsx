import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

import AUTH_IMG from "../../assets/auth-img.jpg";
import Input from "../../components/Inputs/Input";

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (emailData) => {
      const response = await axiosInstance.post(
        API_PATHS.AUTH.FORGOT_PASSWORD,
        emailData
      );
      return response.data;
    },
    onSuccess: (data) => {
      setIsSuccess(true);
      toast.success("Password reset link sent to your email!");

      // For development, show the reset URL
      if (data.resetUrl) {
        toast.success("Check console for reset link (Development mode)", {
          duration: 8000,
        });
      }
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Failed to send reset email. Please try again.";
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

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) {
        setErrors({ email: "Email is required" });
        return;
      }
      if (!emailRegex.test(formData.email)) {
        setErrors({ email: "Please provide a valid email address" });
        return;
      }

      // Clear errors and submit
      setErrors({});
      forgotPasswordMutation.mutate(formData);
    },
    [formData, forgotPasswordMutation]
  );

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to your email address. Please
              check your inbox and follow the instructions to reset your
              password.
            </p>
            <button
              onClick={() => navigate("/admin-login")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex">
          <div className="w-full md:w-1/2 p-8">
            <div className="mb-6">
              <button
                onClick={() => navigate("/admin-login")}
                className="text-gray-600 hover:text-gray-800 mb-4"
              >
                ← Back to Login
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                Forgot Password
              </h2>
              <p className="text-gray-600 mt-2">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <Input
                value={formData.email}
                onChange={({ target }) =>
                  handleInputChange("email", target.value)
                }
                label="Email Address"
                placeholder="john@example.com"
                type="email"
                error={errors.email}
              />

              {errors.general && (
                <p className="text-red-500 text-sm mb-4">{errors.general}</p>
              )}

              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending
                  ? "SENDING..."
                  : "Send Reset Link"}
              </button>
            </form>
          </div>

          <div className="hidden md:block md:w-1/2">
            <img
              src={AUTH_IMG}
              alt="Forgot Password"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
