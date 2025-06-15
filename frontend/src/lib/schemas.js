import { z } from "zod";

// User schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(
      /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/,
      "Name can only contain letters and spaces"
    ),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  profileImageUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  adminAccessToken: z.string().optional(),
});

// User profile update schema
export const userUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(
      /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/,
      "Name can only contain letters and spaces"
    ),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  profileImageUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

// Password reset schemas
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Comment update schema
export const commentUpdateSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be less than 1000 characters"),
});

// Blog post schemas
export const blogPostSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  content: z
    .string()
    .min(50, "Content must be at least 50 characters")
    .max(50000, "Content must be less than 50,000 characters"),
  summary: z
    .string()
    .max(500, "Summary must be less than 500 characters")
    .optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag cannot be empty")
        .max(30, "Tag must be less than 30 characters")
    )
    .max(10, "Maximum 10 tags allowed")
    .optional(),
  coverImageUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  isDraft: z.boolean().optional(),
});

// Comment schemas
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be less than 1000 characters"),
  parentComment: z.string().optional(),
});

// AI generation schemas
export const aiGenerationSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  tone: z
    .enum([
      "professional",
      "casual",
      "technical",
      "friendly",
      "formal",
      "teknik",
      "günlük",
      "başlangıç",
      "profesyonel",
      "eğlenceli",
    ])
    .optional(),
  topics: z
    .string()
    .min(3, "Topics must be at least 3 characters")
    .max(500, "Topics must be less than 500 characters")
    .optional(),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content must be less than 10,000 characters")
    .optional(),
  author: z
    .string()
    .min(1, "Author name is required")
    .max(100, "Author name must be less than 100 characters")
    .optional(),
});

// API Response schemas for validation
export const userResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().email(),
  profileImageUrl: z.string().optional(),
  bio: z.string().optional(),
  role: z.enum(["Admin", "Member"]),
  token: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const blogPostResponseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  coverImageUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.object({
    _id: z.string(),
    name: z.string(),
    profileImageUrl: z.string().optional(),
  }),
  isDraft: z.boolean().optional(),
  views: z.number().optional(),
  likes: z.number().optional(),
  generatedByAI: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const commentResponseSchema = z.object({
  _id: z.string(),
  content: z.string(),
  author: z.object({
    _id: z.string(),
    name: z.string(),
    profileImageUrl: z.string().optional(),
  }),
  post: z.object({
    _id: z.string(),
    title: z.string(),
    coverImageUrl: z.string().optional(),
  }),
  parentComment: z.string().optional(),
  replies: z.array(z.any()).optional(), // Recursive type, simplified
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Search and filter schemas
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, "Search query cannot be empty")
    .max(100, "Search query must be less than 100 characters"),
});

export const tagFilterSchema = z.object({
  tag: z
    .string()
    .min(1, "Tag cannot be empty")
    .max(30, "Tag must be less than 30 characters"),
});

// Form validation helpers
export const validateWithSchema = (schema, data) => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.reduce((acc, err) => {
        const path = err.path.join(".");
        acc[path] = err.message;
        return acc;
      }, {});
      return { success: false, data: null, errors: formattedErrors };
    }
    return {
      success: false,
      data: null,
      errors: { general: "Validation failed" },
    };
  }
};
