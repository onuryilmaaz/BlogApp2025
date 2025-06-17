import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuPlus,
  LuUsers,
  LuFileText,
  LuMessageSquare,
  LuChartLine,
  LuSettings,
  LuShield,
  LuGalleryVerticalEnd,
  LuBookOpen,
  LuTags,
  LuBell,
  LuSearch,
} from "react-icons/lu";
import useUserStore from "../stores/userStore";

export const useQuickActions = (dashboardData = null) => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  const quickActions = useMemo(() => {
    const baseActions = [
      {
        id: "new-post",
        title: "New Post",
        icon: <LuPlus className="w-4 h-4" />,
        path: "/admin/create",
        description: "Create a new blog post",
        color: "from-blue-500 to-blue-600",
        priority: 1,
        category: "content",
        roles: ["Admin"],
      },
      {
        id: "manage-posts",
        title: "All Posts",
        icon: <LuFileText className="w-4 h-4" />,
        path: "/admin/posts",
        description: "Manage blog posts",
        color: "from-purple-500 to-purple-600",
        priority: 2,
        category: "content",
        roles: ["Admin"],
      },
      {
        id: "manage-users",
        title: "Users",
        icon: <LuUsers className="w-4 h-4" />,
        path: "/admin/users",
        description: "View and manage users",
        color: "from-green-500 to-green-600",
        priority: 3,
        category: "management",
        roles: ["Admin"],
      },
      {
        id: "comments",
        title: "Comments",
        icon: <LuMessageSquare className="w-4 h-4" />,
        path: "/admin/comments",
        description: "Review and manage comments",
        color: "from-orange-500 to-orange-600",
        priority: 4,
        category: "moderation",
        roles: ["Admin"],
        badge: dashboardData?.stats?.pendingComments || 0,
        showBadgeWhen: (data) => data?.stats?.pendingComments > 0,
      },
      {
        id: "analytics",
        title: "Analytics",
        icon: <LuChartLine className="w-4 h-4" />,
        action: () => {
          const analyticsSection = document.querySelector("[data-analytics]");
          if (analyticsSection) {
            analyticsSection.scrollIntoView({ behavior: "smooth" });
          }
        },
        description: "View detailed analytics and insights",
        color: "from-cyan-500 to-cyan-600",
        priority: 5,
        category: "analytics",
        roles: ["Admin"],
      },
      {
        id: "tags",
        title: "Tags",
        icon: <LuTags className="w-4 h-4" />,
        path: "/admin/tags",
        description: "Manage tags and categories",
        color: "from-pink-500 to-pink-600",
        priority: 6,
        category: "management",
        roles: ["Admin"],
      },
      {
        id: "search",
        title: "Search",
        icon: <LuSearch className="w-4 h-4" />,
        action: () => {
          // Open search modal or navigate to search page
          const searchInput = document.querySelector('input[type="search"]');
          if (searchInput) {
            searchInput.focus();
          }
        },
        description: "Search posts and content",
        color: "from-indigo-500 to-indigo-600",
        priority: 7,
        category: "utility",
        roles: ["Admin", "Member"],
      },
      {
        id: "notifications",
        title: "Notifications",
        icon: <LuBell className="w-4 h-4" />,
        action: () => {
          // Open notifications dropdown or modal
          const notificationButton = document.querySelector(
            "[data-notifications]"
          );
          if (notificationButton) {
            notificationButton.click();
          }
        },
        description: "View notifications",
        color: "from-yellow-500 to-yellow-600",
        priority: 8,
        category: "utility",
        roles: ["Admin", "Member"],
        badge: dashboardData?.notifications?.unreadCount || 0,
        showBadgeWhen: (data) => data?.notifications?.unreadCount > 0,
      },
      {
        id: "settings",
        title: "Settings",
        icon: <LuSettings className="w-4 h-4" />,
        action: () => {
          console.log("Settings action - could open settings modal");
          // Future: Open settings modal or navigate to settings page
        },
        description: "System settings and preferences",
        color: "from-gray-500 to-gray-600",
        priority: 9,
        category: "system",
        roles: ["Admin"],
        enabled: false, // Disabled for now
      },
    ];

    // Filter actions based on user role and enabled status
    return baseActions
      .filter((action) => {
        const hasRole = action.roles.includes(user?.role);
        const isEnabled = action.enabled !== false;
        return hasRole && isEnabled;
      })
      .sort((a, b) => a.priority - b.priority);
  }, [user?.role, dashboardData]);

  const getActionsByCategory = (category) => {
    return quickActions.filter((action) => action.category === category);
  };

  const getTopActions = (limit = 6) => {
    return quickActions.slice(0, limit);
  };

  const executeAction = (action) => {
    if (action.path) {
      navigate(action.path);
    } else if (action.action) {
      action.action();
    }
  };

  return {
    quickActions,
    getActionsByCategory,
    getTopActions,
    executeAction,
  };
};

export default useQuickActions;
