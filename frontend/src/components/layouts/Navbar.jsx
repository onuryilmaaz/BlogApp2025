import { useState } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import SideMenu from "./SideMenu";
import NotificationDropdown from "../Notifications/NotificationDropdown";

import LOGO from "../../assets/logo.png";

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  return (
    <div className="flex items-center justify-between bg-white border border-b border-gray-200/50 backdrop-blur-[2px] py-4 px-7 sticky top-0 z-30">
      <div className="flex items-center gap-5">
        <button
          className="block lg:hidden text-black -mt-1"
          onClick={() => {
            setOpenSideMenu(!openSideMenu);
          }}
        >
          {openSideMenu ? (
            <HiOutlineX className="text-2xl" />
          ) : (
            <HiOutlineMenu className="text-2xl" />
          )}
        </button>
        <a href="/">
          <img src={LOGO} alt="logo" className="h-[24px] md:h-[26px]" />
        </a>
      </div>

      {/* Notification Dropdown */}
      <div className="flex items-center">
        <NotificationDropdown />
      </div>

      {openSideMenu && (
        <div className="fixed top-[61px] -ml-4 bg-white">
          <SideMenu activeMenu={activeMenu} setOpenSideMenu={setOpenSideMenu} />
        </div>
      )}
    </div>
  );
};

export default Navbar;
