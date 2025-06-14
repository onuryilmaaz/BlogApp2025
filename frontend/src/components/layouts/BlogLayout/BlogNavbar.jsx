import React, { useState, useCallback } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { Link, useLocation } from "react-router-dom";
import { LuSearch } from "react-icons/lu";
import { BLOG_NAVBAR_DATA } from "../../../utils/data";

import Logo from "../../../assets/logo.png";
import SideMenu from "../SideMenu";
import useUserStore from "../../../stores/userStore";
import useUIStore from "../../../stores/uiStore";
import ProfileInfoCard from "../../Cards/ProfileInfoCard";
import Login from "../../Auth/Login";
import SignUp from "../../Auth/SignUp";
import Modal from "../../Modal";
import SearchBarPopUp from "../../../pages/Blog/components/SearchBarPopUp";

const BlogNavbar = React.memo(({ activeMenu }) => {
  // Zustand stores
  const user = useUserStore((state) => state.user);
  const setOpenAuthForm = useUserStore((state) => state.setOpenAuthForm);
  const openSearchBar = useUIStore((state) => state.openSearchBar);
  const setOpenSearchBar = useUIStore((state) => state.setOpenSearchBar);
  const sideMenuOpen = useUIStore((state) => state.sideMenuOpen);
  const setSideMenuOpen = useUIStore((state) => state.setSideMenuOpen);

  const location = useLocation();

  // Memoized function to check if current path matches the nav item
  const isActiveRoute = useCallback(
    (path) => {
      if (path === "/blog" && location.pathname === "/blog") return true;
      if (path === "/blog" && location.pathname === "/") return true;
      if (path !== "/blog" && location.pathname.startsWith(path)) return true;
      return false;
    },
    [location.pathname]
  );

  // Memoized handlers
  const handleSideMenuToggle = useCallback(() => {
    setSideMenuOpen(!sideMenuOpen);
  }, [sideMenuOpen, setSideMenuOpen]);

  const handleSearchToggle = useCallback(() => {
    setOpenSearchBar(true);
  }, [setOpenSearchBar]);

  const handleAuthFormOpen = useCallback(() => {
    setOpenAuthForm(true);
  }, [setOpenAuthForm]);

  return (
    <>
      <div className="bg-white border border-b border-gray-200/50 backdrop-blur-[2px] py-4 px-7 sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between gap-5">
          <div className="flex gap-5">
            <button
              className="block lg:hidden text-black -mt-1"
              onClick={handleSideMenuToggle}
            >
              {sideMenuOpen ? (
                <HiOutlineX className="text-2xl" />
              ) : (
                <HiOutlineMenu className="text-2xl" />
              )}
            </button>
            <Link to="/">
              <img src={Logo} alt="logo" className="h-[24px] md:h-[26px]" />
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-10">
            {BLOG_NAVBAR_DATA.map((item) => {
              if (item?.onlySideMenu) return;
              return (
                <Link key={item.id} to={item.path}>
                  <li className="text-[15px] text-black font-medium list-none relative group cursor-pointer">
                    {item.label}
                    <span
                      className={`absolute inset-x-0 bottom-0 h-[2px] bg-sky-500 transition-all duration-300 origin-left ${
                        isActiveRoute(item.path) ? "scale-x-100" : "scale-x-0"
                      } group-hover:scale-x-100`}
                    ></span>
                  </li>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-6">
            <button
              className="hover:text-sky-500 cursor-pointer transition-colors"
              onClick={handleSearchToggle}
            >
              <LuSearch className="text-[22px]" />
            </button>
            {!user ? (
              <button
                className="flex items-center justify-center gap-3 bg-linear-to-r from-sky-500 to-cyan-400 text-xs md:text-sm font-semibold text-white px-5 md:px-7 py-2 rounded-full hover:bg-black hover:text-white transition-colors cursor-pointer hover:shadow-2xl hover:shadow-cyan-200"
                onClick={handleAuthFormOpen}
              >
                Login/SignUp
              </button>
            ) : (
              <div className="hidden md:block">
                <ProfileInfoCard />
              </div>
            )}
          </div>
          {sideMenuOpen && (
            <div className="fixed top-[61px] -ml-4 bg-white">
              <SideMenu
                activeMenu={activeMenu}
                isBlogMenu
                setOpenSideMenu={setSideMenuOpen}
              />
            </div>
          )}
        </div>
      </div>

      <AuthModel />
      <SearchBarPopUp isOpen={openSearchBar} setIsOpen={setOpenSearchBar} />
    </>
  );
});

BlogNavbar.displayName = "BlogNavbar";

export default BlogNavbar;

const AuthModel = React.memo(() => {
  const openAuthForm = useUserStore((state) => state.openAuthForm);
  const setOpenAuthForm = useUserStore((state) => state.setOpenAuthForm);
  const [currentPage, setCurrentPage] = useState("login");

  const handleClose = useCallback(() => {
    setOpenAuthForm(false);
    setCurrentPage("login");
  }, [setOpenAuthForm]);

  return (
    <>
      <Modal isOpen={openAuthForm} onClose={handleClose} hideHeader>
        <div className="">
          {currentPage === "login" && <Login setCurrentPage={setCurrentPage} />}
          {currentPage === "signup" && (
            <SignUp setCurrentPage={setCurrentPage} />
          )}
        </div>
      </Modal>
    </>
  );
});

AuthModel.displayName = "AuthModel";
