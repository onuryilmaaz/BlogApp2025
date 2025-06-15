import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import useUserStore from "../../stores/userStore";
import { loginSchema, validateWithSchema } from "../../lib/schemas";
import toast from "react-hot-toast";

import AUTH_IMG from "../../assets/auth-img.jpg";
import Input from "../Inputs/Input";

const Login = React.memo(({ setCurrentPage }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  // Zustand stores
  const setUser = useUserStore((state) => state.setUser);
  const setOpenAuthForm = useUserStore((state) => state.setOpenAuthForm);
  const navigate = useNavigate();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (loginData) => {
      const response = await axiosInstance.post(
        API_PATHS.AUTH.LOGIN,
        loginData
      );
      return response.data;
    },
    onSuccess: (data) => {
      const { token, role } = data;
      if (token) {
        setUser(data);
        setOpenAuthForm(false);

        if (role === "Admin") {
          navigate("/admin/dashboard");
        }

        toast.success("Login successful!");
      }
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
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
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate with Zod
      const validation = validateWithSchema(loginSchema, formData);

      if (!validation.success) {
        setErrors(validation.errors);
        return;
      }

      // Clear errors and submit
      setErrors({});
      loginMutation.mutate(validation.data);
    },
    [formData, loginMutation]
  );
  return (
    <div className="flex items-center">
      <div className="w-[90vw] md:w-[33vw] p-7 flex flex-col justify-center">
        <h3 className="text-lg font-semibold text-black">Welcome Back</h3>
        <p className="text-xs text-slate-700 mt-[2px] mb-6">
          Please enter your details to log in
        </p>

        <form onSubmit={handleLogin}>
          <Input
            value={formData.email}
            onChange={({ target }) => handleInputChange("email", target.value)}
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

          <div className="flex justify-end mb-4">
            <button
              type="button"
              className="text-xs text-primary hover:underline cursor-pointer"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </button>
          </div>

          {errors.general && (
            <p className="text-red-500 text-xs pb-2.5">{errors.general}</p>
          )}

          <button
            type="submit"
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "LOGGING IN..." : "LOGIN"}
          </button>

          <p className="text-[13px] text-slate-800 mt-3">
            Don't have an account?{" "}
            <button
              type="button"
              className="font-medium text-primary underline cursor-pointer"
              onClick={() => setCurrentPage("signup")}
            >
              SignUp
            </button>
          </p>
        </form>
      </div>
      <div className="hidden md:block">
        <img src={AUTH_IMG} alt="Login" className="h-[400px]" />
      </div>
    </div>
  );
});

Login.displayName = "Login";

export default Login;
