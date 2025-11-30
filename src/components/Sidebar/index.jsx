import Logo from "../../assets/images/logo.png"
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
import { useState } from "react"
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

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [isToggleSubmenu, setIsToggleSubmenu] = useState(false)
  const isLogin = useAppStore((state) => state.isLogin)
  const userInfo = useAppStore((state) => state.userInfo)
  const location = useLocation()

  // Debug: Log user info
  console.log('=== SIDEBAR DEBUG ===');
  console.log('User Info:', userInfo);
  console.log('User Role:', userInfo?.role);
  console.log('Role Code:', userInfo?.role?.code);
  console.log('Is SUPER_ADMIN?', userInfo?.role?.code === 'SUPER_ADMIN');
  console.log('Permissions:', userInfo?.role?.permissions);
  console.log('====================');

  const isOpenSubmenu = (index) => {
    setActiveTab(index)
    setIsToggleSubmenu(!isToggleSubmenu)
  }

  return (
    <div className='sidebar h-full bg-white shadow-lg overflow-y-auto'>
      <Link to='/'>
        <div className='logoWrapper py-3 px-4'>
          <img src={Logo} className='w-full max-w-[150px]' />
        </div>
      </Link>

      <div className='sidebarTabs px-2 mt-4 pb-6'>
        <ul className='flex gap-3 flex-col'>
          {/* Dashboard - Always visible */}
          <li>
            <Link to='/'>
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

          {hasPermission(userInfo, 'PRODUCT_VIEW') && (
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
                    <Link to='/products'>
                      <Button
                        className={`w-full ${
                          location.pathname === "/products" ? "active" : ""
                        }`}
                      >
                        Danh sách sản phẩm
                      </Button>
                    </Link>
                  </li>
                  {hasPermission(userInfo, 'PRODUCT_MANAGE') && (
                    <li>
                      <Link to='/products/new'>
                        <Button
                          className={`w-full ${
                            location.pathname === "/products/new" ? "active" : ""
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

          {hasPermission(userInfo, 'SALES_VIEW') && (
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
          )}

          {hasPermission(userInfo, 'PRODUCT_MANAGE') && (
            <>
              <li>
                <Link to='/category/list'>
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
                <Link to='/sub-category/list'>
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
                <Link to='/units'>
                  <Button
                    className={`w-full ${activeTab === 5 ? "active" : ""}`}
                    onClick={() => isOpenSubmenu(5)}
                  >
                    <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                      <RiFileListLine />
                    </span>
                    Đơn vị tính
                  </Button>
                </Link>
              </li>

              {/* Thêm menu cho symbol */}
              <li>
                <Link to='/symbols'>
                  <Button
                    className={`w-full ${activeTab === 6 ? "active" : ""}`}
                    onClick={() => isOpenSubmenu(6)}
                  >
                    <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                      <FaRegCircle />
                    </span>
                    Ký hiệu
                  </Button>
                </Link>
              </li>
            </>
          )}

          {/* Thêm menu cho supplier */}
          {hasPermission(userInfo, 'INVENTORY_MANAGE') && (
            <li>
              <Link to='/suppliers'>
                <Button
                  className={`w-full ${activeTab === 7 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(7)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <MdLocalShipping />
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
                className={`w-full ${activeTab === 8 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(8)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <GiPoisonBottle />
                </span>
                Thuốc BVTV
              </Button>
            </Link>
          </li>

          {/* Thêm menu cho rice market */}
          <li>
            <Link to='/rice-market'>
              <Button
                className={`w-full ${activeTab === 15 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(15)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <GiGrain />
                </span>
                Thị trường Lúa Gạo
              </Button>
            </Link>
          </li>

          {/* Thêm menu cho weather forecast */}
          <li>
            <Link to='/weather-forecast'>
              <Button
                className={`w-full ${activeTab === 16 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(16)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <MdCloudQueue />
                </span>
                Dự báo Thời tiết
              </Button>
            </Link>
          </li>

          {/* Thêm menu cho disease warning */}
          {hasPermission(userInfo, 'RICE_BLAST_VIEW') && (
            <li>
              <Link to='/disease-warning'>
                <Button
                  className={`w-full ${activeTab === 23 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(23)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <MdWarning />
                  </span>
                  Cảnh báo Bệnh/Sâu hại
                </Button>
              </Link>
            </li>
          )}

          {isAdmin(userInfo) && (
            <li>
              <Link to='/users'>
                <Button
                  className={`w-full ${activeTab === 9 ? "active" : ""}`}
                  onClick={() => isOpenSubmenu(9)}
                >
                  <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                    <FaUsers />
                  </span>
                  Quản lý người dùng
                </Button>
              </Link>
            </li>
          )}

          {/* Quản lý nhập hàng */}
          {hasPermission(userInfo, 'INVENTORY_VIEW') && (
            <li>
              <Button
                className={`w-full ${activeTab === 10 ? "active" : ""}`}
                onClick={() => isOpenSubmenu(10)}
              >
                <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                  <MdInventory />
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
                <div className='submenu pl-8'>
                  <Link to='/inventory/receipts'>
                    <Button
                      className={`w-full ${
                        location.pathname === "/inventory/receipts"
                          ? "active"
                          : ""
                      }`}
                    >
                      Danh sách phiếu nhập
                    </Button>
                  </Link>
                  {hasPermission(userInfo, 'INVENTORY_MANAGE') && (
                    <Link to='/inventory/receipts/create'>
                      <Button
                        className={`w-full ${
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
          {(hasPermission(userInfo, 'SALES_VIEW') || hasPermission(userInfo, 'SALES_MANAGE')) && (
            <>
              <li>
                <h6 className='text-black/70 capitalize px-3 mt-4'>
                  Quản lý bán hàng
                </h6>
              </li>

              {/* Mùa vụ */}
              {hasPermission(userInfo, 'SALES_MANAGE') && (
                <li>
                  <Link to='/seasons'>
                    <Button
                      className={`w-full ${activeTab === 17 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(17)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <GiGrain />
                      </span>
                      Mùa vụ
                    </Button>
                  </Link>
                </li>
              )}

              {/* Khách hàng */}
              {hasPermission(userInfo, 'SALES_VIEW') && (
                <li>
                  <Link to='/customers'>
                    <Button
                      className={`w-full ${activeTab === 18 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(18)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <FaUsers />
                      </span>
                      Khách hàng
                    </Button>
                  </Link>
                </li>
              )}

              {/* Hóa đơn bán hàng */}
              {hasPermission(userInfo, 'SALES_VIEW') && (
                <li>
                  <Link to='/sales-invoices'>
                    <Button
                      className={`w-full ${activeTab === 19 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(19)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <HiOutlineShoppingCart />
                      </span>
                      Hóa đơn bán hàng
                    </Button>
                  </Link>
                </li>
              )}

              {/* Thanh toán */}
              {hasPermission(userInfo, 'SALES_VIEW') && (
                <li>
                  <Link to='/payments'>
                    <Button
                      className={`w-full ${activeTab === 20 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(20)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <MdOutlineDashboard />
                      </span>
                      Thanh toán
                    </Button>
                  </Link>
                </li>
              )}

              {/* Công nợ */}
              {hasPermission(userInfo, 'SALES_VIEW') && (
                <li>
                  <Link to='/debt-notes'>
                    <Button
                      className={`w-full ${activeTab === 21 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(21)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <RiFileListLine />
                      </span>
                      Công nợ
                    </Button>
                  </Link>
                </li>
              )}

              {/* Trả hàng */}
              {hasPermission(userInfo, 'SALES_VIEW') && (
                <li>
                  <Link to='/sales-returns'>
                    <Button
                      className={`w-full ${activeTab === 22 ? "active" : ""}`}
                      onClick={() => isOpenSubmenu(22)}
                    >
                      <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                        <MdAssignmentReturn />
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
              className={`w-full ${activeTab === 11 ? "active" : ""}`}
              onClick={() => isOpenSubmenu(11)}
            >
              <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                <MdNotificationsNone />
              </span>
              Thông báo
            </Button>
          </li>

          <li>
            <h6 className='text-black/70 capitalize px-3 mt-4'>
              Authentication
            </h6>
          </li>
          {!isLogin && (
            <>
              <li>
                <Link to='/sign-in'>
                  <Button
                    className={`w-full ${activeTab === 12 ? "active" : ""}`}
                    onClick={() => isOpenSubmenu(12)}
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
              className={`w-full ${activeTab === 13 ? "active" : ""}`}
              onClick={() => isOpenSubmenu(13)}
            >
              <span className='icon w-[30px] h-[30px] flex items-center justify-center rounded-md'>
                <RiLockPasswordLine />
              </span>
              Quên mật khẩu
            </Button>
          </li>

          <li>
            <Button
              className={`w-full ${activeTab === 14 ? "active" : ""}`}
              onClick={() => isOpenSubmenu(14)}
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
  )
}

export default Sidebar
