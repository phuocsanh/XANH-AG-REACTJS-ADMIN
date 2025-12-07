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
import ProtectedRoute from "./components/ProtectedRoute"
import {
  InventoryReceiptsList,
  InventoryReceiptDetail,
  InventoryReceiptCreate,
} from "./pages/inventory"
import { useAppStore } from "./stores"
import { useAuthStatus } from "./queries/auth"
import { ForgotPassword } from "./pages/forgot-password"
// Thêm import cho trang đổi mật khẩu
import { ChangePassword } from "./pages/change-password"
import ListUnits from "./pages/units/list-units"
// Thêm import cho trang symbol
import ListSymbols from "./pages/symbols/list-symbols"
// Thêm import cho trang supplier
import Suppliers from "./pages/suppliers"
// Thêm import cho trang đăng ký
import { SignUp } from "./pages/sign-up"
// Thêm import cho trang pesticides
import PesticidesPage from "./pages/pesticides"
import RiceMarketPage from "./pages/rice-market"

import DiseaseWarningPage from "./pages/disease-warning"
// Thêm import cho trang kiểm tra thuốc bị cấm
import BannedPesticidesPage from "./pages/banned-pesticides"
// Thêm import cho trang Quản Lý Canh Tác
import RiceCropsPage from "./pages/rice-crops"
// Thêm import cho trang so sánh sản phẩm AI
import ProductComparisonPage from "./pages/product-comparison"
// Thêm import cho trang test upload
import UploadTestPage from "./pages/upload-test"
// Thêm import cho các module quản lý bán hàng
import Seasons from "./pages/seasons"
import Customers from "./pages/customers"
import SalesInvoicesList from "./pages/sales-invoices"
import CreateSalesInvoice from "./pages/sales-invoices/create"
import PaymentsList from "./pages/payments"
import DebtNotesList from "./pages/debt-notes"
import SalesReturnsList from "./pages/sales-returns"
import CreateSalesReturn from "./pages/sales-returns/create"
// Thêm import cho inventory returns và adjustments
import ReturnsPage from "./pages/inventory/returns"
import AdjustmentsPage from "./pages/inventory/adjustments"
import { requestForToken, onMessageListener } from "./lib/firebase"
import { fetchAndActivate, getValue } from "firebase/remote-config"
import { remoteConfig } from "./lib/firebase"
import { toast } from "react-toastify"
import { useConfigStore } from "./stores/config.store"

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

export const ThemeContext = createContext<{
  isDarkMode: boolean
  setIsDarkMode: Dispatch<SetStateAction<boolean>>
}>({
  isDarkMode: false,
  setIsDarkMode: () => {},
})

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true) // State để điều khiển sidebar
  const [isHeaderFooterShow, setIsHeaderFooterShow] = useState(false) // State local
  const isLogin = useAppStore((state) => state.isLogin)
  const isHeaderFooterShowRef = useRef(isHeaderFooterShow)
  useAuthStatus() // Use the hook to initialize auth status

  // Fetch Remote Config và lưu vào store khi app khởi động
  useEffect(() => {
    const initRemoteConfig = async () => {
      try {
        console.log('🚀 Initializing Remote Config...')
        const activated = await fetchAndActivate(remoteConfig)
        console.log('✅ Remote Config fetched:', activated ? 'New config activated' : 'Using cached config')
        
        // Lấy 7 API keys và lưu vào store
        const keys = [
          { name: 'GEMINI_API_KEY_1', setter: 'setGeminiApiKey1' },
          { name: 'GEMINI_API_KEY_2', setter: 'setGeminiApiKey2' },
          { name: 'GEMINI_API_KEY_3', setter: 'setGeminiApiKey3' },
          { name: 'GEMINI_API_KEY_4', setter: 'setGeminiApiKey4' },
          { name: 'GEMINI_API_KEY_5', setter: 'setGeminiApiKey5' },
          { name: 'GEMINI_API_KEY_6', setter: 'setGeminiApiKey6' },
          { name: 'GEMINI_API_KEY_7', setter: 'setGeminiApiKey7' },
        ]
        
        const storeState = useConfigStore.getState()
        
        keys.forEach(({ name, setter }) => {
          const value = getValue(remoteConfig, name).asString()
          if (value && value.trim()) {
            (storeState as any)[setter](value)
            console.log(`✅ ${name} loaded`)
          } else {
            console.warn(`⚠️ ${name} not found in Remote Config`)
          }
        })
      } catch (error) {
        console.error('❌ Failed to initialize Remote Config:', error)
      }
    }
    
    initRemoteConfig()
  }, [])

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

  // Firebase Notification Setup
  useEffect(() => {
    requestForToken();

    onMessageListener()
      .then((payload: any) => {
        toast.info(
          <div>
            <h4 className="font-bold">{payload.notification.title}</h4>
            <p className="text-sm">{payload.notification.body}</p>
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        console.log('Received foreground message: ', payload);
      })
      .catch((err: any) => console.log('failed: ', err));
  }, []);

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
                <div className='hidden md:block md:fixed md:left-0 md:top-0 md:bottom-0 md:w-[17%] md:z-10 md:pt-[70px]' style={{background: 'linear-gradient(180deg, #059669 0%, #047857 100%)'}}>
                  <Sidebar />
                </div>
              )}

              {/* Main content area */}
              <div className={`flex-1 overflow-x-hidden min-w-0 ${isHeaderFooterShow === false && isLogin && isSidebarOpen ? 'md:ml-[17%]' : ''}`}>
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
                        <ProtectedRoute requiredPermission="PRODUCT_VIEW">
                          <ProductsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/product/:id?'
                      element={
                        <ProtectedRoute requiredPermission="PRODUCT_MANAGE">
                          <Products />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/product-comparison'
                      element={
                        <ProtectedRoute requiredPermission="PRODUCT_VIEW">
                          <ProductComparisonPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/category/list'
                      element={
                        <ProtectedRoute requiredPermission="PRODUCT_MANAGE">
                          <ListCategory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/sub-category/list'
                      element={
                        <ProtectedRoute requiredPermission="PRODUCT_MANAGE">
                          <ListSubCategory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/users'
                      element={
                        <ProtectedRoute requiredPermission="USER_VIEW">
                          <Users />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/products/*'
                      element={
                        <ProtectedRoute requiredPermission="PRODUCT_VIEW">
                          <Products />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/units'
                      element={
                        <ProtectedRoute requiredPermission="PRODUCT_MANAGE">
                          <ListUnits />
                        </ProtectedRoute>
                      }
                    />
                    {/* Thêm route cho trang symbol */}
                    <Route
                      path='/symbols'
                      element={
                        <ProtectedRoute requiredPermission="PRODUCT_MANAGE">
                          <ListSymbols />
                        </ProtectedRoute>
                      }
                    />
                    {/* Thêm route cho trang supplier */}
                    <Route
                      path='/suppliers'
                      element={
                        <ProtectedRoute requiredPermission="INVENTORY_MANAGE">
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

                    {/* Trang thị trường lúa gạo */}
                    <Route
                      path='/rice-market'
                      element={
                        <ProtectedRoute>
                          <RiceMarketPage />
                        </ProtectedRoute>
                      }
                    />



                    {/* Trang cảnh báo bệnh/sâu hại lúa */}
                    <Route
                      path='/disease-warning'
                      element={
                        <ProtectedRoute requiredPermission="RICE_BLAST_VIEW">
                          <DiseaseWarningPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Trang kiểm tra thuốc bị cấm */}
                    <Route
                      path='/banned-pesticides'
                      element={
                        <ProtectedRoute>
                          <BannedPesticidesPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Trang test upload ảnh */}
                    <Route
                      path='/upload-test'
                      element={
                        <ProtectedRoute>
                          <UploadTestPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Trang Quản Lý Canh Tác */}
                    <Route
                      path='/rice-crops/*'
                      element={
                        <ProtectedRoute>
                          <RiceCropsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Quản lý nhập hàng - Inventory Management */}
                    <Route
                      path='/inventory/receipts'
                      element={
                        <ProtectedRoute requiredPermission="INVENTORY_VIEW">
                          <InventoryReceiptsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/inventory/receipts/create'
                      element={
                        <ProtectedRoute requiredPermission="INVENTORY_MANAGE">
                          <InventoryReceiptCreate />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/inventory/receipt/:id'
                      element={
                        <ProtectedRoute requiredPermission="INVENTORY_VIEW">
                          <InventoryReceiptDetail />
                        </ProtectedRoute>
                      }
                    />

                    {/* Routes cho Phiếu Trả Hàng */}
                    <Route
                      path='/inventory/returns/*'
                      element={
                        <ProtectedRoute requiredPermission="INVENTORY_VIEW">
                          <ReturnsPage />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Routes cho Phiếu Điều Chỉnh */}
                    <Route
                      path='/inventory/adjustments/*'
                      element={
                        <ProtectedRoute requiredPermission="INVENTORY_MANAGE">
                          <AdjustmentsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Quản lý bán hàng - Sales Management */}
                    <Route
                      path='/seasons'
                      element={
                        <ProtectedRoute requiredPermission="SALES_MANAGE">
                          <Seasons />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/customers'
                      element={
                        <ProtectedRoute requiredPermission="SALES_VIEW">
                          <Customers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/sales-invoices'
                      element={
                        <ProtectedRoute requiredPermission="SALES_VIEW">
                          <SalesInvoicesList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/sales-invoices/create'
                      element={
                        <ProtectedRoute requiredPermission="SALES_CREATE">
                          <CreateSalesInvoice />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/payments'
                      element={
                        <ProtectedRoute requiredPermission="SALES_VIEW">
                          <PaymentsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/debt-notes'
                      element={
                        <ProtectedRoute requiredPermission="SALES_VIEW">
                          <DebtNotesList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/sales-returns'
                      element={
                        <ProtectedRoute requiredPermission="SALES_VIEW">
                          <SalesReturnsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/sales-returns/create'
                      element={
                        <ProtectedRoute requiredPermission="SALES_MANAGE">
                          <CreateSalesReturn />
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
                    <Route
                      path='/change-password'
                      element={
                        <ProtectedRoute>
                          <ChangePassword />
                        </ProtectedRoute>
                      }
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
