import React, { useState } from "react"
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
import { MdCloudQueue, MdAssignmentReturn, MdWarning } from "react-icons/md"
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

  const isOpenSubmenu = (index: number): void => {
    setActiveTab(index)
    setIsToggleSubmenu(!isToggleSubmenu)
  }

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

          {hasPermission(userInfo, "PRODUCT_VIEW") && (
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
                  {hasPermission(userInfo, "PRODUCT_MANAGE") && (
                    <li className="-mb-12">
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
                </ul>
              </div>
            </li>
          )}

          {hasPermission(userInfo, "SALES_VIEW") && (
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
          )}

          {hasPermission(userInfo, "PRODUCT_MANAGE") && (
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

          {/* Thêm menu cho supplier */}
          {hasPermission(userInfo, "INVENTORY_MANAGE") && (
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
          {hasPermission(userInfo, "RICE_BLAST_VIEW") && (
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

          {/* Thêm menu cho quản lý vụ lúa */}
          <li>
            <Link to='/rice-crops'>
              <Button
                className={`w-full !justify-start !text-left ${activeTab === 25 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(25)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <GiGrain className='text-green-200' />
                </span>
                Quản lý vụ lúa
              </Button>
            </Link>
          </li>

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

          {/* Quản lý nhập hàng */}
          {hasPermission(userInfo, "INVENTORY_VIEW") && (
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

                  {hasPermission(userInfo, "INVENTORY_MANAGE") && (
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

          {/* Quản lý bán hàng */}
          {(hasPermission(userInfo, "SALES_VIEW") ||
            hasPermission(userInfo, "SALES_MANAGE")) && (
            <>
              <li>
                <h6 className='text-green-100 capitalize px-3 mt-4'>
                  Quản lý bán hàng
                </h6>
              </li>
              {hasPermission(userInfo, "SALES_MANAGE") && (
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

              {/* Khách hàng */}
              {hasPermission(userInfo, "SALES_VIEW") && (
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

              {/* Hóa đơn bán hàng */}
              {hasPermission(userInfo, "SALES_VIEW") && (
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
              {hasPermission(userInfo, "SALES_VIEW") && (
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
              {hasPermission(userInfo, "SALES_VIEW") && (
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
              {hasPermission(userInfo, "SALES_VIEW") && (
                <li>
                  <Link to='/sales-returns'>
                    <Button
                      className={`w-full !justify-start !text-left ${activeTab === 22 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(22)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <MdAssignmentReturn className='text-orange-200' />
                      </span>
                      Trả hàng
                    </Button>
                  </Link>
                </li>
              )}
            </>
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
