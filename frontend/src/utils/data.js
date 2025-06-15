import {
  LuLayoutDashboard,
  LuGalleryVerticalEnd,
  LuMessageSquareQuote,
  LuLayoutTemplate,
  LuTag,
  LuUsers,
} from "react-icons/lu";

export const SIDE_MENU_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/admin/dashboard",
  },
  {
    id: "02",
    label: "Blog Posts",
    icon: LuGalleryVerticalEnd,
    path: "/admin/posts",
  },
  {
    id: "03",
    label: "Comments",
    icon: LuMessageSquareQuote,
    path: "/admin/comments",
  },
  {
    id: "04",
    label: "User Management",
    icon: LuUsers,
    path: "/admin/users",
  },
];

export const BLOG_NAVBAR_DATA = [
  {
    id: "01",
    label: "Home",
    icon: LuLayoutTemplate,
    path: "/",
  },
  {
    id: "02",
    label: "React JS",
    icon: LuTag,
    path: "/tag/React",
  },
  {
    id: "03",
    label: "Next Js",
    icon: LuTag,
    path: "/tag/Next.js",
  },
];
