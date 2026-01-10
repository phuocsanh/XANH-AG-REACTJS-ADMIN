import React, { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
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
import { useAppStore } from "../../stores"
import { BiCategory } from "react-icons/bi"
import { TbCategoryMinus } from "react-icons/tb"
import { FaUsers } from "react-icons/fa"
import { RiFileListLine } from "react-icons/ri"
// Thêm icon cho symbol
import { FaRegCircle } from "react-icons/fa"
// Thêm icon cho supplier
import { MdLocalShipping } from "react-icons/md"
// Thêm icon cho pesticides
import { GiPoisonBottle, GiGrain } from "react-icons/gi"
import { MdAssignmentReturn, MdWarning, MdCalculate, MdAttachMoney, MdSearch } from "react-icons/md"
import { TiWeatherPartlySunny } from "react-icons/ti"
// Import permission helpers
import { hasPermission, isAdmin } from "../../utils/permission"

const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0)
  const [isToggleSubmenu, setIsToggleSubmenu] = useState<boolean>(false)
  const isLogin = useAppStore((state) => state.isLogin)
  const userInfo = useAppStore((state) => state.userInfo)
  const location = useLocation()

  // Debug: Log user info
  console.log("=== SIDEBAR DEBUG ===")
  console.log("User Info:", userInfo)
  console.log("User Role:", userInfo?.role)

  // Check nếu user là CUSTOMER
  const isCustomer = userInfo?.role?.code === 'CUSTOMER'

  // Tự động set activeTab và mở submenu dựa trên URL hiện tại
  useEffect(() => {
    const path = location.pathname
    
    // Dashboard
    if (path === '/' || path === '/products/search') {
      setActiveTab(0)
      setIsToggleSubmenu(false)
    }
    // Tính liều lượng
    else if (path.startsWith('/dosage-calculator')) {
      setActiveTab(29)
      setIsToggleSubmenu(false)
    }
    // Dự báo thời tiết
    else if (path.startsWith('/weather-forecast')) {
      setActiveTab(31)
      setIsToggleSubmenu(false)
    }
    // Lịch Vạn Niên
    else if (path.startsWith('/lunar-calendar')) {
      setActiveTab(33)
      setIsToggleSubmenu(false)
    }
    // Sản phẩm - tab 1
    else if (path.startsWith('/products') || path.startsWith('/product-comparison')) {
      setActiveTab(1)
      setIsToggleSubmenu(true)
    }
    // Loại sản phẩm
    else if (path.startsWith('/category')) {
      setActiveTab(3)
      setIsToggleSubmenu(false)
    }
    // Loại phụ sản phẩm
    else if (path.startsWith('/sub-category')) {
      setActiveTab(4)
      setIsToggleSubmenu(false)
    }
    // Đơn vị tính
    else if (path.startsWith('/units')) {
      setActiveTab(5)
      setIsToggleSubmenu(false)
    }
    // Ký hiệu
    else if (path.startsWith('/symbols')) {
      setActiveTab(6)
      setIsToggleSubmenu(false)
    }
    // Nhà cung cấp
    else if (path.startsWith('/suppliers')) {
      setActiveTab(7)
      setIsToggleSubmenu(false)
    }
    // Thuốc BVTV
    else if (path.startsWith('/pesticides')) {
      setActiveTab(8)
      setIsToggleSubmenu(false)
    }
    // Quản lý người dùng
    else if (path.startsWith('/users')) {
      setActiveTab(9)
      setIsToggleSubmenu(false)
    }
    // Quản lý nhập hàng - tab 10
    else if (path.startsWith('/inventory')) {
      setActiveTab(10)
      setIsToggleSubmenu(true)
    }
    // Thị trường Lúa Gạo
    else if (path.startsWith('/rice-market')) {
      setActiveTab(15)
      setIsToggleSubmenu(false)
    }
    // Mùa vụ
    else if (path.startsWith('/seasons')) {
      setActiveTab(17)
      setIsToggleSubmenu(false)
    }
    // Diện tích mỗi công đất
    else if (path.startsWith('/area-of-each-plot-of-land')) {
      setActiveTab(27)
      setIsToggleSubmenu(false)
    }
    // Khách hàng
    else if (path.startsWith('/customers')) {
      setActiveTab(18)
      setIsToggleSubmenu(false)
    }
    // Hóa đơn bán hàng
    else if (path.startsWith('/sales-invoices')) {
      setActiveTab(19)
      setIsToggleSubmenu(false)
    }
    // Thanh toán
    else if (path.startsWith('/payments')) {
      setActiveTab(20)
      setIsToggleSubmenu(false)
    }
    // Công nợ
    else if (path.startsWith('/debt-notes')) {
      setActiveTab(21)
      setIsToggleSubmenu(false)
    }
    // Trả hàng
    else if (path.startsWith('/sales-returns')) {
      setActiveTab(22)
      setIsToggleSubmenu(false)
    }
    // Giao hàng
    else if (path.startsWith('/delivery-logs')) {
      setActiveTab(32)
      setIsToggleSubmenu(false)
    }
    // Báo cáo Lợi nhuận
    else if (path.startsWith('/profit-reports')) {
      setActiveTab(28)
      setIsToggleSubmenu(false)
    }
    // Cảnh báo Bệnh/Sâu hại
    else if (path.startsWith('/disease-warning')) {
      setActiveTab(23)
      setIsToggleSubmenu(false)
    }
    // Kiểm tra thuốc bị cấm
    else if (path.startsWith('/banned-pesticides')) {
      setActiveTab(24)
      setIsToggleSubmenu(false)
    }
    // Quản Lý Canh Tác
    else if (path.startsWith('/rice-crops')) {
      setActiveTab(25)
      setIsToggleSubmenu(false)
    }
    // Đổi mật khẩu
    else if (path.startsWith('/change-password')) {
      setActiveTab(26)
      setIsToggleSubmenu(false)
    }
    // Chi phí vận hành
    else if (path.startsWith('/operating-costs')) {
      setActiveTab(30)
      setIsToggleSubmenu(true)
    }
    // Chi phí dịch vụ
    else if (path.startsWith('/farm-service-costs')) {
      setActiveTab(25)
      setIsToggleSubmenu(true)
    }
  }, [location.pathname])

  const isOpenSubmenu = (index: number): void => {
    setActiveTab(index)
    setIsToggleSubmenu(!isToggleSubmenu)
  }

  // Nếu chưa đăng nhập, chỉ hiển thị Weather Forecast
  if (!isLogin) {
    return (
      <div className='sidebar h-full'>
        <div className='sidebarTabs px-2 overflow-y-auto h-[calc(100vh-80px)]'>
          <ul className='flex gap-3 flex-col m'>
            <li>
              <Link to='/weather-forecast'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 31 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(31)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <TiWeatherPartlySunny className='text-blue-300' />
                  </span>
                  Dự báo Thời tiết
                </Button>
              </Link>
            </li>
            
            <li>
              <Link to='/lunar-calendar'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 33 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(33)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    📅
                  </span>
                  Lịch Vạn Niên
                </Button>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  // Nếu là CUSTOMER - chỉ hiển thị rice-crops
  if (isCustomer) {
    return (
      <div className='sidebar h-full'>
        <div className='sidebarTabs px-2 overflow-y-auto h-[calc(100vh-80px)]'>
          <ul className='flex gap-3 flex-col m'>
            <li>
              <Link to='/'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 0 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(0)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <MdOutlineDashboard className='text-blue-200' />
                  </span>
                  Dashboard
                </Button>
              </Link>
            </li>

            <li>
              <Link to='/weather-forecast'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 31 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(31)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <TiWeatherPartlySunny className='text-blue-300' />
                  </span>
                  Dự báo Thời tiết
                </Button>
              </Link>
            </li>

            <li>
              <Link to='/lunar-calendar'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 33 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(33)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    📅
                  </span>
                  Lịch Vạn Niên
                </Button>
              </Link>
            </li>



            {/* Quản Lý Canh Tác */}
            <li>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 25 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(25)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <GiGrain className='text-green-200' />
                </span>
                Ruộng Lúa Của Tôi
                <span
                  className={`arrow ml-auto w-[25px] h-[25px] flex items-center justify-center ${
                    activeTab === 25 && isToggleSubmenu === true ? "rotate" : ""
                  }`}
                >
                  <FaAngleRight />
                </span>
              </Button>
              <div
                className={`submenuWrapper ${
                  activeTab === 25 && isToggleSubmenu === true
                    ? "colapse"
                    : "colapsed"
                }`}
              >
                <div className='submenu pl-2'>
                  <Link to='/rice-crops'>
                    <Button
                      className={`w-full !justify-start !text-left mb-2 ${
                        location.pathname === "/rice-crops"
                          ? "active"
                          : ""
                      }`}
                    >
                      Danh sách ruộng lúa
                    </Button>
                  </Link>
                </div>
              </div>
            </li>


            <li>
              <h6 className='text-green-100 capitalize px-3 mt-4'>
                Authentication
              </h6>
            </li>
            
            <li>
              <Link to='/change-password'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 26 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(26)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <RiLockPasswordLine className='text-green-200' />
                  </span>
                  Đổi mật khẩu
                </Button>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  // Đã đăng nhập - hiển thị đầy đủ menu (ADMIN/STAFF)
  return (
    <div className='sidebar h-full'>
      <div className='sidebarTabs px-2 overflow-y-auto h-[calc(100vh-80px)]'>
        <ul className='flex gap-3 flex-col m'>
          <li>
            <Link to='/products/search'>
              <Button
                className={`w-full !justify-start !text-left ${activeTab ===  0 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(0)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <MdSearch className='text-emerald-300' />
                </span>
                Tìm sản phẩm
              </Button>
            </Link>
          </li>

          <li>
            <Link to='/'>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 40 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(40)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <MdOutlineDashboard className='text-blue-200' />
                </span>
                Dashboard
              </Button>
            </Link>
          </li>
          
          <li>
            <Link to='/dosage-calculator'>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 29 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(29)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <MdCalculate className='text-cyan-400' />
                </span>
                Tính Liều Lượng
              </Button>
            </Link>
          </li>

          <li>
            <Link to='/weather-forecast'>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 31 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(31)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <TiWeatherPartlySunny className='text-blue-300' />
                </span>
                Dự báo Thời tiết
              </Button>
            </Link>
          </li>

          <li>
            <Link to='/lunar-calendar'>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 33 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(33)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  📅
                </span>
                Lịch Vạn Niên
              </Button>
            </Link>
          </li>

          {/* {hasPermission(userInfo, "sales:read") && (
            <li>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 2 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(2)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <HiOutlineShoppingCart className='text-orange-200' />
                </span>
                Đơn đặt hàng
              </Button>
            </li>
          )} */}
          {/* Quản lý bán hàng */}
          {(hasPermission(userInfo, "sales:read") ||
            hasPermission(userInfo, "sales:manage")) && (
            <>
              <li>
                <h6 className='text-green-100 capitalize px-3 mt-4'>
                  Quản lý bán hàng
                </h6>
              </li>


              {/* Hóa đơn bán hàng */}
              {hasPermission(userInfo, "sales:read") && (
                <li>
                  <Link to='/sales-invoices'>
                    <Button
                      className={`w-full !justify-start !text-left ${activeTab === 19 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(19)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <HiOutlineShoppingCart className='text-green-200' />
                      </span>
                      Hóa đơn bán hàng
                    </Button>
                  </Link>
                </li>
              )}

              {/* Thanh toán */}
              {hasPermission(userInfo, "sales:read") && (
                <li>
                  <Link to='/payments'>
                    <Button
                      className={`w-full !justify-start !text-left ${activeTab === 20 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(20)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <MdOutlineDashboard className='text-green-200' />
                      </span>
                      Thanh toán
                    </Button>
                  </Link>
                </li>
              )}

              {/* Công nợ */}
              {hasPermission(userInfo, "sales:read") && (
                <li>
                  <Link to='/debt-notes'>
                    <Button
                      className={`w-full !justify-start !text-left ${activeTab === 21 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(21)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <RiFileListLine className='text-red-200' />
                      </span>
                      Công nợ
                    </Button>
                  </Link>
                </li>
              )}

              {/* Trả hàng */}
              {hasPermission(userInfo, "sales:read") && (
                <li>
                  <Link to='/sales-returns'>
                    <Button
                      className={`w-full !justify-start !text-left ${activeTab === 22 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(22)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <MdAssignmentReturn className='text-orange-200' />
                      </span>
                      Khách trả hàng
                    </Button>
                  </Link>
                </li>
              )}

              {/* Giao hàng */}
              {hasPermission(userInfo, "sales:read") && (
                <li>
                  <Link to='/delivery-logs'>
                    <Button
                      className={`w-full !justify-start !text-left ${activeTab === 32 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(32)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <MdLocalShipping className='text-purple-200' />
                      </span>
                      Phiếu Giao Hàng
                    </Button>
                  </Link>
                </li>
              )}

              {/* Báo cáo Lợi nhuận */}
              {hasPermission(userInfo, "sales:read") && (
                <li>
                  <Link to='/profit-reports'>
                    <Button
                      className={`w-full !justify-start !text-left ${activeTab === 28 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(28)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <RiFileListLine className='text-green-200' />
                      </span>
                      Báo cáo PF
                    </Button>
                  </Link>
                </li>
              )}
            </>
          )}

          {/* Thêm menu cho supplier */}
          {hasPermission(userInfo, "inventory:manage") && (
            <li>
              <Link to='/suppliers'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 7 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(7)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <MdLocalShipping className='text-blue-200' />
                  </span>
                  Nhà cung cấp
                </Button>
              </Link>
            </li>
          )}
          {/* Quản lý nhập hàng */}
          {hasPermission(userInfo, "inventory:read") && (
            <li>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 10 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(10)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <MdInventory className='text-emerald-200' />
                </span>
                Quản lý nhập hàng
                <span
                  className={`arrow ml-auto w-[25px] h-[25px] flex items-center justify-center ${
                    activeTab === 10 && isToggleSubmenu === true ? "rotate" : ""
                  }`}
                >
                  <FaAngleRight />
                </span>
              </Button>
              <div
                className={`submenuWrapper ${
                  activeTab === 10 && isToggleSubmenu === true
                    ? "colapse"
                    : "colapsed"
                }`}
              >
                <div className='submenu pl-2'>
                  <Link to='/inventory/receipts'>
                    <Button
                      className={`w-full !justify-start !text-left mb-2 ${
                        location.pathname === "/inventory/receipts"
                          ? "active"
                          : ""
                      }`}
                    >
                      Danh sách phiếu nhập
                    </Button>
                  </Link>

                  <Link to='/inventory/returns'>
                    <Button
                      className={`w-full !justify-start !text-left mb-2 ${
                        location.pathname.includes("/inventory/returns")
                          ? "active"
                          : ""
                      }`}
                    >
                      Phiếu trả hàng
                    </Button>
                  </Link>

                  <Link to='/inventory/adjustments'>
                    <Button
                      className={`w-full !justify-start !text-left mb-2 ${
                        location.pathname.includes("/inventory/adjustments")
                          ? "active"
                          : ""
                      }`}
                    >
                      Phiếu điều chỉnh
                    </Button>
                  </Link>

                  {hasPermission(userInfo, "inventory:manage") && (
                    <Link to='/inventory/receipts/create'>
                      <Button
                        className={`w-full !justify-start !text-left ${
                          location.pathname === "/inventory/receipts/create"
                            ? "active"
                            : ""
                        }`}
                      >
                        Tạo phiếu nhập
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </li>
          )}

          {hasPermission(userInfo, "product:read") && (
            <li>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 1 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(1)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <TbBrandProducthunt className='text-purple-200' />
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
                <ul className='submenu pl-2'>
                  <li className="mb-2">
                    <Link to='/products'>
                      <Button
                        className={`w-full !justify-start !text-left ${
                          location.pathname === "/products" ? "active" : ""
                        }`}
                      >
                        Danh sách sản phẩm
                      </Button>
                    </Link>
                  </li>
                  {hasPermission(userInfo, "product:manage") && (
                    <li >
                      <Link to='/products/new'>
                        <Button
                          className={`w-full !justify-start !text-left ${
                            location.pathname === "/products/new"
                              ? "active"
                              : ""
                          }`}
                        >
                          Thêm sản phẩm
                        </Button>
                      </Link>
                    </li>
                  )}
                  <li className="-mb-8 mt-2">
                    <Link to='/product-comparison'>
                      <Button
                        className={`w-full !justify-start !text-left ${
                          location.pathname === "/product-comparison"
                            ? "active"
                            : ""
                        }`}
                      >
                        So sánh AI
                      </Button>
                    </Link>
                  </li>
                </ul>
              </div>
            </li>
          )}
          {hasPermission(userInfo, "product:manage") && (
            <>
              <li>
                <Link to='/category/list'>
                  <Button
                    className={`w-full !justify-start !text-left ${activeTab === 3 ? "active" : ""}`}
                    onClick={() => isOpenSubmenu(3)}
                  >
                    <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                      <BiCategory className='text-indigo-200' />
                    </span>
                    Loại sản phẩm
                  </Button>
                </Link>
              </li>
              <li>
                <Link to='/sub-category/list'>
                  <Button
                    className={`w-full !justify-start !text-left ${activeTab === 4 ? "active" : ""}`}
                    onClick={() => isOpenSubmenu(4)}
                  >
                    <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                      <TbCategoryMinus className='text-pink-200' />
                    </span>
                    Loại phụ sản phẩm
                  </Button>
                </Link>
              </li>

              <li>
                <Link to='/units'>
                  <Button
                    className={`w-full !justify-start !text-left ${activeTab === 5 ? "active" : ""}`}
                    onClick={() => isOpenSubmenu(5)}
                  >
                    <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                      <RiFileListLine className='text-teal-200' />
                    </span>
                    Đơn vị tính
                  </Button>
                </Link>
              </li>

              {/* Thêm menu cho symbol */}
              <li>
                <Link to='/symbols'>
                  <Button
                    className={`w-full !justify-start !text-left ${activeTab === 6 ? "active" : ""}`}
                    onClick={() => isOpenSubmenu(6)}
                  >
                    <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                      <FaRegCircle className='text-cyan-200' />
                    </span>
                    Ký hiệu
                  </Button>
                </Link>
              </li>
            </>
          )}

          {/* Thêm menu cho pesticides */}
          <li>
            <Link to='/pesticides'>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 8 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(8)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <GiPoisonBottle className='text-red-200' />
                </span>
                Thuốc BVTV
              </Button>
            </Link>
          </li>

          {/* Thêm menu cho rice market */}
          <li>
            <Link to='/rice-market'>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 15 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(15)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <GiGrain className='text-amber-200' />
                </span>
                Thị trường Lúa Gạo
              </Button>
            </Link>
          </li>



          {/* Thêm menu cho disease warning */}
          {hasPermission(userInfo, "ai:rice_blast:read") && (
            <li>
              <Link to='/disease-warning'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 23 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(23)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <MdWarning className='text-yellow-200' />
                  </span>
                  Cảnh báo Bệnh/Sâu hại
                </Button>
              </Link>
            </li>
          )}

          {/* Thêm menu cho kiểm tra thuốc bị cấm */}
          <li>
            <Link to='/banned-pesticides'>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 24 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(24)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <MdWarning className='text-red-200' />
                </span>
                Kiểm tra thuốc bị cấm
              </Button>
            </Link>
          </li>

          {/* Thêm menu cho Quản Lý Canh Tác */}
          {/* Thêm menu cho Quản Lý Canh Tác */}
          <li>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 25 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(25)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <GiGrain className='text-green-200' />
                </span>
                Quản Lý Canh Tác
                <span
                  className={`arrow ml-auto w-[25px] h-[25px] flex items-center justify-center ${
                    activeTab === 25 && isToggleSubmenu === true ? "rotate" : ""
                  }`}
                >
                  <FaAngleRight />
                </span>
              </Button>
              <div
                className={`submenuWrapper ${
                  activeTab === 25 && isToggleSubmenu === true
                    ? "colapse"
                    : "colapsed"
                }`}
              >
                <div className='submenu pl-2'>
                  <Link to='/rice-crops'>
                    <Button
                      className={`w-full !justify-start !text-left mb-2 ${
                        location.pathname === "/rice-crops"
                          ? "active"
                          : ""
                      }`}
                    >
                      Danh sách ruộng lúa
                    </Button>
                  </Link>

                  {hasPermission(userInfo, "sales:manage") && (
                    <Link to='/farm-service-costs'>
                      <Button
                        className={`w-full !justify-start !text-left mb-2 ${
                          location.pathname === "/farm-service-costs"
                            ? "active"
                            : ""
                        }`}
                      >
                        Chi phí Dịch vụ
                      </Button>
                    </Link>
                  )}

                  <Link to='/rice-crops/categories'>
                    <Button
                      className={`w-full !justify-start !text-left mb-2 ${
                        location.pathname === "/rice-crops/categories"
                          ? "active"
                          : ""
                      }`}
                    >
                      Loại chi phí canh tác
                    </Button>
                  </Link>
                </div>
              </div>
          </li>

          {hasPermission(userInfo, "sales:manage") && (
            <li>
              <Link to='/seasons'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 17 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(17)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <GiGrain className='text-green-200' />
                  </span>
                  Mùa vụ
                </Button>
              </Link>
            </li>
          )}

          {/* Chi phí vận hành */}
          {hasPermission(userInfo, "sales:manage") && (
            <li>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 30 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(30)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <MdAttachMoney className='text-red-300' />
                </span>
                Chi phí Vận hành
                <span
                  className={`arrow ml-auto w-[25px] h-[25px] flex items-center justify-center ${
                    activeTab === 30 && isToggleSubmenu === true ? "rotate" : ""
                  }`}
                >
                  <FaAngleRight />
                </span>
              </Button>
              <div
                className={`submenuWrapper ${
                  activeTab === 30 && isToggleSubmenu === true
                    ? "colapse"
                    : "colapsed"
                }`}
              >
                <div className='submenu pl-2'>
                  <Link to='/operating-costs'>
                    <Button
                      className={`w-full !justify-start !text-left mb-2 ${
                        location.pathname === "/operating-costs"
                          ? "active"
                          : ""
                      }`}
                    >
                      Danh sách chi phí
                    </Button>
                  </Link>

                  <Link to='/operating-costs/categories'>
                    <Button
                      className={`w-full !justify-start !text-left mb-2 ${
                        location.pathname === "/operating-costs/categories"
                          ? "active"
                          : ""
                      }`}
                    >
                      Loại chi phí
                    </Button>
                  </Link>
                </div>
              </div>
            </li>
          )}

          {/* Diện tích mỗi công đất */}
          {hasPermission(userInfo, "sales:manage") && (
            <li>
              <Link to='/area-of-each-plot-of-land'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 27 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(27)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <BiCategory className='text-lime-200' />
                  </span>
                  Diện tích mỗi công đất
                </Button>
              </Link>
            </li>
          )}

          {/* Khách hàng */}
          {hasPermission(userInfo, "sales:read") && (
            <li>
              <Link to='/customers'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 18 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(18)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <FaUsers className='text-blue-200' />
                  </span>
                  Khách hàng
                </Button>
              </Link>
            </li>
          )}

          {isAdmin(userInfo) && (
            <li>
              <Link to='/users'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 9 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(9)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <FaUsers className='text-violet-200' />
                  </span>
                  Quản lý người dùng
                </Button>
              </Link>
            </li>
          )}

          <li>
            <Button
              className={`w-full !justify-start !text-left ${activeTab === 11 ? "active" : ""}`}
              onClick={() => isOpenSubmenu(11)}
            >
              <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                <MdNotificationsNone className='text-purple-200' />
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
                <Link to='/sign-in'>
                  <Button
                    className={`w-full !justify-start !text-left ${activeTab === 12 ? "active" : ""}`}
                    onClick={() => isOpenSubmenu(12)}
                  >
                    <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                      <FiUser className='text-blue-200' />
                    </span>
                    Đăng nhập
                  </Button>
                </Link>
              </li>
            </>
          )}

          {/* Đổi mật khẩu - chỉ hiển thị khi đã đăng nhập */}
          {isLogin && (
            <li>
              <Link to='/change-password'>
                <Button
                  className={`w-full !justify-start !text-left ${activeTab === 26 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(26)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <RiLockPasswordLine className='text-green-200' />
                  </span>
                  Đổi mật khẩu
                </Button>
              </Link>
            </li>
          )}

          <li>
            <Button
              className={`w-full !justify-start !text-left ${activeTab === 13 ? "active" : ""}`}
              onClick={() => isOpenSubmenu(13)}
            >
              <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                <RiLockPasswordLine className='text-amber-200' />
              </span>
              Quên mật khẩu
            </Button>
          </li>

          <li>
            <Button
              className={`w-full !justify-start !text-left ${activeTab === 14 ? "active" : ""}`}
              onClick={() => isOpenSubmenu(14)}
            >
              <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                <IoSettingsOutline className='text-gray-300' />
              </span>
              Cài đặt
            </Button>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar
