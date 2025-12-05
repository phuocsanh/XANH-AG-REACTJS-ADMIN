import Logo from "../assets/images/logo.png"
import { Link } from "react-router-dom"
import Button from "@mui/material/Button"
import { MdOutlineDashboard } from "react-icons/md"
import { FaAngleRight } from "react-icons/fa6"
import { MdNotificationsNone } from "react-icons/md"
import { IoSettingsOutline } from "react-icons/io5"
import { FiUser } from "react-icons/fi"
import { HiOutlineShoppingCart } from "react-icons/hi"
import { TbBrandProducthunt } from "react-icons/tb"
import { RiLockPasswordLine } from "react-icons/ri"
import { MdInventory } from "react-icons/md"
import { useAppStore } from "../stores"
import { BiCategory } from "react-icons/bi"
import { TbCategoryMinus } from "react-icons/tb"
import { FaUsers } from "react-icons/fa"
import { useState } from "react"
import PropTypes from "prop-types"

const MobileSidebar = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [isToggleSubmenu, setIsToggleSubmenu] = useState(false)
  const isLogin = useAppStore((state) => state.isLogin)

  const isOpenSubmenu = (index) => {
    setActiveTab(index)
    setIsToggleSubmenu(!isToggleSubmenu)
  }

  // Close sidebar when clicking on a link
  const handleLinkClick = () => {
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-[99] transition-opacity md:hidden'
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar cho mobile/tablet */}
      <div
        className={`sidebar fixed top-0 left-0 z-[100] w-full h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className='flex justify-between items-center p-4 border-b'>
          <Link to='/' onClick={handleLinkClick}>
            <div className='logoWrapper'>
              <img src={Logo} className='h-8' />
            </div>
          </Link>
          <button className='p-2 rounded-md' onClick={onClose}>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='sidebarTabs px-2 mt-4 overflow-y-auto h-[calc(100vh-80px)]'>
          <ul className='flex gap-3 flex-col'>
            <li>
              <Link to='/' onClick={handleLinkClick}>
                <Button
                  className={`w-full ${activeTab === 0 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(0)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <MdOutlineDashboard />
                  </span>
                  Dashboard
                </Button>
              </Link>
            </li>

            <li>
              <Button
                className={`w-full ${activeTab === 1 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(1)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
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
                <ul className='submenu pl-8'>
                  <li>
                    <Link to='/products' onClick={handleLinkClick}>
                      <Button className='w-full'>Danh sách sản phẩm</Button>
                    </Link>
                  </li>
                  <li>
                    <Link to='/products/new' onClick={handleLinkClick}>
                      <Button className='w-full'>Thêm sản phẩm</Button>
                    </Link>
                  </li>
                  <li>
                    <Link to='/product-comparison' onClick={handleLinkClick}>
                      <Button className='w-full'>So sánh AI</Button>
                    </Link>
                  </li>
                </ul>
              </div>
            </li>

            <li>
              <Button
                className={`w-full ${activeTab === 2 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(2)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <HiOutlineShoppingCart />
                </span>
                Đơn đặt hàng
              </Button>
            </li>
            <li>
              <Link to='/category/list' onClick={handleLinkClick}>
                <Button
                  className={`w-full ${activeTab === 3 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(3)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <BiCategory />
                  </span>
                  Loại sản phẩm
                </Button>
              </Link>
            </li>
            <li>
              <Link to='/sub-category/list' onClick={handleLinkClick}>
                <Button
                  className={`w-full ${activeTab === 4 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(4)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <TbCategoryMinus />
                  </span>
                  Loại phụ sản phẩm
                </Button>
              </Link>
            </li>

            <li>
              <Link to='/users' onClick={handleLinkClick}>
                <Button
                  className={`w-full ${activeTab === 10 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(10)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <FaUsers />
                  </span>
                  Quản lý người dùng
                </Button>
              </Link>
            </li>

            {/* Quản lý nhập hàng */}
            <li>
              <Button
                className={`w-full ${activeTab === 5 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(5)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <MdInventory />
                </span>
                Quản lý nhập hàng
                <span
                  className={`arrow ml-auto w-[25px] h-[25px] flex items-center justify-center ${
                    activeTab === 5 && isToggleSubmenu === true ? "rotate" : ""
                  }`}
                >
                  <FaAngleRight />
                </span>
              </Button>
              <div
                className={`submenuWrapper ${
                  activeTab === 5 && isToggleSubmenu === true
                    ? "colapse"
                    : "colapsed"
                }`}
              >
                <div className='submenu pl-8'>
                  <Link to='/inventory/receipts' onClick={handleLinkClick}>
                    <Button className='w-full'>Danh sách phiếu nhập</Button>
                  </Link>
                  <Link
                    to='/inventory/receipts/create'
                    onClick={handleLinkClick}
                  >
                    <Button className='w-full'>Tạo phiếu nhập</Button>
                  </Link>
                </div>
              </div>
            </li>
            <li>
              <Button
                className={`w-full ${activeTab === 6 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(6)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <MdNotificationsNone />
                </span>
                Thông báo
              </Button>
            </li>

            <li>
              <h6 className='text-green-100 capitalize px-3 mt-4'>
                Authentication
              </h6>
            </li>
            {!isLogin && (
              <>
                <li>
                  <Link to='/sign-in' onClick={handleLinkClick}>
                    <Button
                      className={`w-full ${activeTab === 7 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(7)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <FiUser />
                      </span>
                      Đăng nhập
                    </Button>
                  </Link>
                </li>
              </>
            )}

            <li>
              <Button
                className={`w-full ${activeTab === 8 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(8)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <RiLockPasswordLine />
                </span>
                Quên mật khẩu
              </Button>
            </li>

            <li>
              <Button
                className={`w-full ${activeTab === 9 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(9)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <IoSettingsOutline />
                </span>
                Cài đặt
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}

MobileSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default MobileSidebar
