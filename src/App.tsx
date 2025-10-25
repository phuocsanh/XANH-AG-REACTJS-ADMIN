import { BrowserRouter, Route, Routes } from "react-router-dom"
import Sidebar from "./components/sidebar"
import MobileSidebar from "./components/mobile-sidebar"
import { Header } from "./components/header"
import {
  createContext,
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
  useRef,
} from "react"
import { Dashboard } from "./pages/dashboard"
import ProductsList from "./pages/products/products-list"
import { SignIn } from "./pages/sign-in"

import { OtpPage } from "./pages/otp"
import ListCategory from "./pages/categories/list-category"
import ListSubCategory from "./pages/sub-categories/list-sub-category"
import Users from "./pages/users"
import Products from "./pages/products"
import ProtectedRoute from "./components/protected-route"
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

type TypeMyContext = {
  isHeaderFooterShow: boolean
  setIsHeaderFooterShow: Dispatch<SetStateAction<boolean>>
  isSidebarOpen: boolean
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>
}

const MyContext = createContext<TypeMyContext>({
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
          <div className='flex flex-col min-h-screen'>
            {/* Header - luôn hiển thị trên cùng và trải dài toàn bộ chiều rộng */}
            {isHeaderFooterShow === false && isLogin && (
              <div className='w-full'>
                <Header />
              </div>
            )}

            <div className='flex flex-1'>
              {/* Sidebar - hidden on mobile by default, shown as overlay */}
              {isHeaderFooterShow === false && isLogin && isSidebarOpen && (
                <div className='hidden md:block w-[17%]'>
                  <Sidebar />
                </div>
              )}

              {/* Main content area */}
              <div className='flex-1'>
                {/* Space for header on all devices */}
                {isHeaderFooterShow === false && isLogin && (
                  <div className='h-[70px]'></div>
                )}

                <main
                  className={
                    isHeaderFooterShow === false && isLogin ? "p-4 md:p-6" : ""
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
                      path='/inventory/receipts/:id'
                      element={
                        <ProtectedRoute>
                          <InventoryReceiptDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/inventory/receipts/edit/:id'
                      element={
                        <ProtectedRoute>
                          <InventoryReceiptCreate />
                        </ProtectedRoute>
                      }
                    />

                    {/* Các trang công khai */}
                    <Route path='/sign-in' element={<SignIn />} />
                    <Route
                      path='/forgot-password'
                      element={<ForgotPassword />}
                    />
                    <Route path='/otp' element={<OtpPage />} />
                  </Routes>
                </main>
              </div>
            </div>

            {/* Mobile sidebar overlay */}
            {isHeaderFooterShow === false && isLogin && (
              <MobileSidebar
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
              />
            )}
          </div>
        </MyContext.Provider>
      </BrowserRouter>
    </>
  )
}

export default App
export { MyContext }
