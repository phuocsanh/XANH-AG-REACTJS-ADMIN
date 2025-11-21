import {
  useState,
  useEffect,
  useRef,
  createContext,
  Dispatch,
  SetStateAction,
} from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Header } from "./components/header"
import Sidebar from "./components/sidebar"
import Footer from "./components/footer"
import { Dashboard } from "./pages/dashboard"
import Products from "./pages/products"
import ProductsList from "./pages/products/products-list"
import Users from "./pages/users"
import ListCategory from "./pages/categories/list-category"
import ListSubCategory from "./pages/sub-categories/list-sub-category"
import { SignIn } from "./pages/sign-in"
import NotFound from "./pages/not-found"
import { ProtectedRoute } from "./components/protected-route"
import {
  InventoryReceiptsList,
  InventoryReceiptDetail,
  InventoryReceiptCreate,
} from "./pages/inventory"
import { useAppStore } from "./stores"
import { useAuthStatus } from "./queries/auth"
import { ForgotPassword } from "./pages/forgot-password"
import ListUnits from "./pages/units/list-units"
// Thêm import cho trang symbol
import ListSymbols from "./pages/symbols/list-symbols"
// Thêm import cho trang supplier
import Suppliers from "./pages/suppliers"
// Thêm import cho trang đăng ký
import { SignUp } from "./pages/sign-up"
// Thêm import cho trang pesticides
import PesticidesPage from "./pages/pesticides"

type TypeMyContext = {
  isHeaderFooterShow: boolean
  setIsHeaderFooterShow: Dispatch<SetStateAction<boolean>>
  isSidebarOpen: boolean
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>
}

export const MyContext = createContext<TypeMyContext>({
  isHeaderFooterShow: false,
  setIsHeaderFooterShow: () => {},
  isSidebarOpen: true,
  setIsSidebarOpen: () => {},
})

function App() {
  const [isHeaderFooterShow, setIsHeaderFooterShow] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true) // State để điều khiển sidebar
  const isLogin = useAppStore((state) => state.isLogin)
  const isHeaderFooterShowRef = useRef(isHeaderFooterShow)
  useAuthStatus() // Use the hook to initialize auth status

  // Kiểm tra trạng thái đăng nhập khi ứng dụng khởi động
  useEffect(() => {
    // The auth status is now handled by the useAuthStatus hook
    // We don't need to manually check it here
  }, [])

  // Cập nhật ref khi state thay đổi
  useEffect(() => {
    isHeaderFooterShowRef.current = isHeaderFooterShow
  }, [isHeaderFooterShow])

  // Lắng nghe sự kiện toggleMobileSidebar từ Header
  useEffect(() => {
    const handleToggleMobileSidebar = () => {
      setIsMobileSidebarOpen(true)
    }

    window.addEventListener("toggleMobileSidebar", handleToggleMobileSidebar)

    return () => {
      window.removeEventListener(
        "toggleMobileSidebar",
        handleToggleMobileSidebar
      )
    }
  }, [])

  const values = {
    isHeaderFooterShow,
    setIsHeaderFooterShow,
    isSidebarOpen,
    setIsSidebarOpen,
  }

  return (
    <>
      <BrowserRouter>
        <MyContext.Provider value={values}>
          <div className='flex flex-col min-h-screen overflow-x-hidden'>
            {/* Header - luôn hiển thị trên cùng và trải dài toàn bộ chiều rộng */}
            {isHeaderFooterShow === false && isLogin && (
              <div className='w-full'>
                <Header />
              </div>
            )}

            <div className='flex flex-1 overflow-x-hidden'>
              {/* Sidebar - hidden on mobile by default, shown as overlay */}
              {isHeaderFooterShow === false && isLogin && isSidebarOpen && (
                <div className='hidden md:block w-[17%]'>
                  <Sidebar />
                </div>
              )}

              {/* Main content area */}
              <div className='flex-1 overflow-x-hidden min-w-0'>
                {/* Space for header on all devices */}
                {isHeaderFooterShow === false && isLogin && (
                  <div className='h-[70px]'></div>
                )}

                <main
                  className={
                    isHeaderFooterShow === false && isLogin ? "p-2 md:p-6" : ""
                  }
                >
                  <Routes>
                    {/* Các trang yêu cầu đăng nhập */}
                    <Route
                      path='/'
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path='/products/list'
                      element={
                        <ProtectedRoute>
                          <ProductsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/product/:id?'
                      element={
                        <ProtectedRoute>
                          <Products />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/category/list'
                      element={
                        <ProtectedRoute>
                          <ListCategory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/sub-category/list'
                      element={
                        <ProtectedRoute>
                          <ListSubCategory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/users'
                      element={
                        <ProtectedRoute>
                          <Users />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/products/*'
                      element={
                        <ProtectedRoute>
                          <Products />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/units'
                      element={
                        <ProtectedRoute>
                          <ListUnits />
                        </ProtectedRoute>
                      }
                    />
                    {/* Thêm route cho trang symbol */}
                    <Route
                      path='/symbols'
                      element={
                        <ProtectedRoute>
                          <ListSymbols />
                        </ProtectedRoute>
                      }
                    />
                    {/* Thêm route cho trang supplier */}
                    <Route
                      path='/suppliers'
                      element={
                        <ProtectedRoute>
                          <Suppliers />
                        </ProtectedRoute>
                      }
                    />

                    {/* Trang pesticides - AI tư vấn phối trộn & sắp xếp thuốc */}
                    <Route
                      path='/pesticides'
                      element={
                        <ProtectedRoute>
                          <PesticidesPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Quản lý nhập hàng - Inventory Management */}
                    <Route
                      path='/inventory/receipts'
                      element={
                        <ProtectedRoute>
                          <InventoryReceiptsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/inventory/receipts/create'
                      element={
                        <ProtectedRoute>
                          <InventoryReceiptCreate />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/inventory/receipt/:id'
                      element={
                        <ProtectedRoute>
                          <InventoryReceiptDetail />
                        </ProtectedRoute>
                      }
                    />

                    {/* Trang đăng nhập - không yêu cầu xác thực */}
                    <Route path='/sign-in' element={<SignIn />} />
                    <Route path='/sign-up' element={<SignUp />} />
                    <Route
                      path='/forgot-password'
                      element={<ForgotPassword />}
                    />

                    {/* Trang 404 */}
                    <Route path='*' element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>

            {/* Footer */}
            {isHeaderFooterShow === false && isLogin && (
              <div className='w-full'>
                <Footer />
              </div>
            )}

            {/* Mobile sidebar overlay */}
            {isMobileSidebarOpen && (
              <div
                className='fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden'
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <div
                  className='absolute left-0 top-0 h-full w-64 bg-white'
                  onClick={(e) => e.stopPropagation()}
                >
                  <Sidebar />
                </div>
              </div>
            )}
          </div>
        </MyContext.Provider>
      </BrowserRouter>
    </>
  )
}

export default App
