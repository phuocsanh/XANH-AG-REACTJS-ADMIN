import React, { useState } from "react";
import Logo from "../../assets/images/logo.png";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import { MdOutlineDashboard } from "react-icons/md";
import { FaProductHunt } from "react-icons/fa";
import { FaAngleRight } from "react-icons/fa6";
import { MdNotificationsNone } from "react-icons/md";
import { FaCartArrowDown } from "react-icons/fa6";
import { IoSettingsOutline } from "react-icons/io5";
import { FiUser } from "react-icons/fi";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { TbBrandProducthunt } from "react-icons/tb";
import { RiLockPasswordLine } from "react-icons/ri";
import { AiTwotoneMessage } from "react-icons/ai";
import { useAppStore } from "@/stores";
import { BiCategory } from "react-icons/bi";
import { TbCategoryMinus } from "react-icons/tb";
const Sidebar = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isToggleSubmenu, setIsToggleSubmenu] = useState(false);
  const isLogin = useAppStore((state) => state.isLogin);
  const isOpenSubmenu = (index) => {
    setActiveTab(index);
    setIsToggleSubmenu(!isToggleSubmenu);
  };

  return (
    <>
      <div className="sidebar fixed top-0 left-0 z-[100] w-[17%]">
        <Link to="/">
          <div className="logoWrapper py-3 px-4">
            <img src={Logo} className="w-100" />
          </div>
        </Link>

        <div className="sidebarTabs px-2 mt-4">
          <ul className="flex gap-3 flex-col">
            <li>
              <Link to="/">
                <Button
                  className={`w-100 ${activeTab === 0 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(0)}
                >
                  <span className="icon w-[30px] h-[30px] flex items-center justify-center rounded-md">
                    <MdOutlineDashboard />
                  </span>
                  Dashboard
                </Button>
              </Link>
            </li>

            <li>
              <Button
                className={`w-100 ${activeTab === 1 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(1)}
              >
                <span className="icon w-[30px] h-[30px] flex items-center justify-center rounded-md">
                  <TbBrandProducthunt />
                </span>
                Sản phẩm
                <span
                  className={`arrow ml-auto w-[25px] h-[25px] flex items-center justify-center ${
                    activeTab === 1 && isToggleSubmenu === true ? "rotate" : ""
                  }`}
                >
                  <FaAngleRight />
                </span>
              </Button>
              <div
                className={`submenuWrapper ${
                  activeTab === 1 && isToggleSubmenu === true
                    ? "colapse"
                    : "colapsed"
                }`}
              >
                <div className="submenu">
                  <Link to="/products/list">
                    <Button className="w-100">Danh sách sản phẩm</Button>
                  </Link>
                  {/* <Link to="/">
                    <Button className="w-100">Products Details</Button>
                  </Link> */}
                  <Link to="/product">
                    <Button className="w-100">Thêm sản phẩm</Button>
                  </Link>
                </div>
              </div>
            </li>

            <li>
              <Button
                className={`w-100 ${activeTab === 2 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(2)}
              >
                <span className="icon w-[30px] h-[30px] flex items-center justify-center rounded-md">
                  <HiOutlineShoppingCart />
                </span>
                Đơn đặt hàng
              </Button>
            </li>
            <li>
              <Link to="/category/list">
                <Button
                  className={`w-100 ${activeTab === 3 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(3)}
                >
                  <span className="icon w-[30px] h-[30px] flex items-center justify-center rounded-md">
                    <BiCategory />
                  </span>
                  Loại sản phẩm
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/sub-category/list">
                <Button
                  className={`w-100 ${activeTab === 4 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(4)}
                >
                  <span className="icon w-[30px] h-[30px] flex items-center justify-center rounded-md">
                    <TbCategoryMinus />
                  </span>
                  Loại phụ sản phẩm
                </Button>
              </Link>
            </li>
            <li>
              <Button
                className={`w-100 ${activeTab === 5 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(5)}
              >
                <span className="icon w-[30px] h-[30px] flex items-center justify-center rounded-md">
                  <MdNotificationsNone />
                </span>
                Thông báo
              </Button>
            </li>

            <li>
              <h6 className="text-black/70 capitalize px-3 mt-4">
                Authentication
              </h6>
            </li>
            {!isLogin && (
              <>
                <li>
                  <Link to="/signIn">
                    <Button
                      className={`w-100 ${activeTab === 6 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(6)}
                    >
                      <span className="icon w-[30px] h-[30px] flex items-center justify-center rounded-md">
                        <FiUser />
                      </span>
                      Đăng nhập
                    </Button>
                  </Link>
                </li>

                {/* <li>
                  <Link to="/signUp">
                    <Button
                      className={`w-100 ${activeTab === 6 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(6)}
                    >
                      <span className="icon w-[30px] h-[30px] flex items-center justify-center rounded-md">
                        <FiUser />
                      </span>
                      Sign Up
                    </Button>
                  </Link>
                </li> */}
              </>
            )}

            <li>
              <Button
                className={`w-100 ${activeTab === 7 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(7)}
              >
                <span className="icon w-[30px] h-[30px] flex items-center justify-center rounded-md">
                  <RiLockPasswordLine />
                </span>
                Quên mật khẩu
              </Button>
            </li>

            {/* <li>
              <Link to="/otp">
                <Button
                  className={`w-100 ${activeTab === 8 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(8)}
                >
                  <span className="icon w-[30px] h-[30px] flex items-center justify-center rounded-md">
                    <AiTwotoneMessage />
                  </span>
                  OTP Page
                </Button>
              </Link>
            </li> */}

            <li>
              <Button
                className={`w-100 ${activeTab === 8 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(8)}
              >
                <span className="icon w-[30px] h-[30px] flex items-center justify-center rounded-md">
                  <IoSettingsOutline />
                </span>
                Cài đặt
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
