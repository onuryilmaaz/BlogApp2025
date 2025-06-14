import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import useUserStore from "../../stores/userStore";
import { signUpSchema, validateWithSchema } from "../../lib/schemas";
import toast from "react-hot-toast";

import AUTH_IMG from "../../assets/auth-img.jpg";
import Input from "../Inputs/Input";
import ProfilePhotoSelector from "../Inputs/ProfilePhotoSelector";
import uploadImage from "../../utils/uploadImage";

const SignUp = React.memo(({ setCurrentPage }) => {
  const [profilePic, setProfilePic] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    profileImageUrl: "",
    adminAccessToken: "",
  });
  const [errors, setErrors] = useState({});

  // Zustand stores
  const setUser = useUserStore((state) => state.setUser);
  const setOpenAuthForm = useUserStore((state) => state.setOpenAuthForm);
  const navigate = useNavigate();

  // SignUp mutation
  const signUpMutation = useMutation({
    mutationFn: async (signUpData) => {
      let profileImageUrl = "";

      // Upload profile image if provided
      if (profilePic) {
        try {
          const imgUploadRes = await uploadImage(profilePic);
          profileImageUrl = imgUploadRes.imageUrl || "";
        } catch (uploadError) {
          throw new Error("Failed to upload profile image");
        }
      }

      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        ...signUpData,
        profileImageUrl,
      });
      return response.data;
    },
    onSuccess: (data) => {
      const { token, role } = data;
      if (token) {
        setUser(data);
        setOpenAuthForm(false);

        if (role === "Admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }

        toast.success("Account created successfully!");
      }
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again.";
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
  const handleSignUp = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate with Zod
      const validation = validateWithSchema(signUpSchema, formData);

      if (!validation.success) {
        setErrors(validation.errors);
        return;
      }

      // Clear errors and submit
      setErrors({});
      signUpMutation.mutate(validation.data);
    },
    [formData, signUpMutation]
  );

  return (
    <div className="flex items-center h-auto md:h-[520px]">
      <div className="w-[90vw] md:w-[43vw] p-7 flex flex-col justify-center">
        <h3 className="text-lg font-semibold text-black">Create an Account</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Join us today by entering your details below.
        </p>
        <form onSubmit={handleSignUp}>
          <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              value={formData.name}
              onChange={({ target }) => handleInputChange("name", target.value)}
              label="Full Name"
              placeholder="John Doe"
              type="text"
              error={errors.name}
            />
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
            <Input
              value={formData.password}
              onChange={({ target }) =>
                handleInputChange("password", target.value)
              }
              label="Password"
              placeholder="Min 6 Characters"
              type="password"
              error={errors.password}
            />
            <Input
              value={formData.adminAccessToken}
              onChange={({ target }) =>
                handleInputChange("adminAccessToken", target.value)
              }
              label="Admin Invite Token (Optional)"
              placeholder="6 Digit Code"
              type="text"
              error={errors.adminAccessToken}
            />
          </div>

          {/* Bio field */}
          <div className="mt-4">
            <Input
              value={formData.bio}
              onChange={({ target }) => handleInputChange("bio", target.value)}
              label="Bio (Optional)"
              placeholder="Tell us about yourself..."
              type="text"
              error={errors.bio}
            />
          </div>

          {errors.general && (
            <p className="text-red-500 text-xs pb-2.5">{errors.general}</p>
          )}

          <button
            type="submit"
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={signUpMutation.isPending}
          >
            {signUpMutation.isPending ? "CREATING ACCOUNT..." : "SIGN UP"}
          </button>

          <p className="text-[13px] text-slate-800 mt-3">
            Already have an account?{" "}
            <button
              type="button"
              className="font-medium text-primary underline cursor-pointer"
              onClick={() => setCurrentPage("login")}
            >
              Login
            </button>
          </p>
        </form>
      </div>
      <div className="hidden md:block ">
        <img src={AUTH_IMG} alt="Login" className="h-[520px] w-[33vw]" />
      </div>
    </div>
  );
});

SignUp.displayName = "SignUp";

export default SignUp;
