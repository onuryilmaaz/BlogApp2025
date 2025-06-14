import { create } from "zustand";

const useUIStore = create((set, get) => ({
  // Search state
  openSearchBar: false,
  searchQuery: "",
  searchResults: [],
  searchLoading: false,

  // Navigation state
  sideMenuOpen: false,

  // Modal states
  modalStack: [], // For managing multiple modals

  // Notification state (if needed beyond react-hot-toast)
  notifications: [],

  // Theme state (for future dark mode)
  theme: "light",

  // Actions for search
  setOpenSearchBar: (open) => set({ openSearchBar: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSearchLoading: (loading) => set({ searchLoading: loading }),
  clearSearch: () =>
    set({
      searchQuery: "",
      searchResults: [],
      searchLoading: false,
    }),

  // Actions for navigation
  setSideMenuOpen: (open) => set({ sideMenuOpen: open }),
  toggleSideMenu: () => set((state) => ({ sideMenuOpen: !state.sideMenuOpen })),

  // Actions for modals
  openModal: (modalId, props = {}) =>
    set((state) => ({
      modalStack: [...state.modalStack, { id: modalId, props }],
    })),
  closeModal: (modalId) =>
    set((state) => ({
      modalStack: state.modalStack.filter((modal) => modal.id !== modalId),
    })),
  closeTopModal: () =>
    set((state) => ({
      modalStack: state.modalStack.slice(0, -1),
    })),
  closeAllModals: () => set({ modalStack: [] }),

  // Actions for notifications
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: Date.now(),
          timestamp: new Date(),
          ...notification,
        },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),

  // Actions for theme
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),

  // Selectors
  getTopModal: () => {
    const { modalStack } = get();
    return modalStack[modalStack.length - 1] || null;
  },

  isModalOpen: (modalId) => {
    const { modalStack } = get();
    return modalStack.some((modal) => modal.id === modalId);
  },

  getUnreadNotifications: () => {
    const { notifications } = get();
    return notifications.filter((n) => !n.read);
  },
}));

export default useUIStore;
