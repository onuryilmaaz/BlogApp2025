import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { userResponseSchema } from "../lib/schemas";

const useUserStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      loading: false,
      openAuthForm: false,

      // Actions
      setUser: (userData) => {
        try {
          // Validate user data with Zod
          const validatedUser = userResponseSchema.parse(userData);
          set({ user: validatedUser, loading: false });

          // Store token in localStorage if provided
          if (validatedUser.token) {
            localStorage.setItem("token", validatedUser.token);
          }
        } catch (error) {
          console.error("Invalid user data:", error);
          set({ user: null, loading: false });
        }
      },

      updateUser: (userData) => {
        try {
          const validatedUser = userResponseSchema.parse(userData);
          set({ user: validatedUser, loading: false });

          if (validatedUser.token) {
            localStorage.setItem("token", validatedUser.token);
          }
        } catch (error) {
          console.error("Invalid user data:", error);
        }
      },

      clearUser: () => {
        set({ user: null, loading: false });
        localStorage.removeItem("token");
      },

      setLoading: (loading) => set({ loading }),

      setOpenAuthForm: (open) => set({ openAuthForm: open }),

      // Computed values (selectors)
      isLoggedIn: () => {
        const { user } = get();
        return !!user;
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === "Admin";
      },

      getUserId: () => {
        const { user } = get();
        return user?._id;
      },

      getUserName: () => {
        const { user } = get();
        return user?.name;
      },

      getUserEmail: () => {
        const { user } = get();
        return user?.email;
      },

      getProfileImage: () => {
        const { user } = get();
        return user?.profileImageUrl;
      },

      // Initialize user from token
      initializeUser: async () => {
        const token = localStorage.getItem("token");
        if (!token) {
          set({ loading: false });
          return;
        }

        set({ loading: true });

        try {
          // This will be handled by React Query in components
          // Just set loading to false here
          set({ loading: false });
        } catch (error) {
          console.error("Failed to initialize user:", error);
          set({ user: null, loading: false });
          localStorage.removeItem("token");
        }
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist user data, not loading states
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

export default useUserStore;
