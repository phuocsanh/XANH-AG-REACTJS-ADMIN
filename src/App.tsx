import {
  useState,
  useEffect,
  useRef,
  createContext,
  Dispatch,
  SetStateAction,
} from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { Header } from "./components/header"
import Sidebar from "./components/sidebar"
import { App as AntApp } from "antd"
import { Dashboard } from "./pages/dashboard"
import Products from "./pages/products"
import ProductsList from "./pages/products/products-list"
import ProductSearch from "./pages/products/product-search"
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
import SupplierStatsPage from "./pages/suppliers/supplier-stats"

import DiseaseWarningPage from "./pages/disease-warning"
// Thêm import cho trang kiểm tra thuốc bị cấm
import BannedPesticidesPage from "./pages/banned-pesticides"
// Thêm import cho trang Quản Lý Canh Tác
import RiceCropsPage from "./pages/rice-crops"
// Thêm import cho trang Chi phí Dịch vụ
import FarmServiceCostsPage from "./pages/farm-service-costs"

// Thêm import cho trang so sánh sản phẩm AI
import ProductComparisonPage from "./pages/product-comparison"
// Thêm import cho trang test upload
import UploadTestPage from "./pages/upload-test"
// Thêm import cho trang AI Image Studio
import ImageStudioPage from "./pages/image-studio"
// Thêm import cho các module quản lý bán hàng
import Seasons from "./pages/seasons"
import Customers from "./pages/customers"
import SalesInvoicesList from "./pages/sales-invoices"
import CreateSalesInvoice from "./pages/sales-invoices/create"
import PaymentsList from "./pages/payments"
import DebtNotesList from "./pages/debt-notes"
import SalesReturnsList from "./pages/sales-returns"
import CustomerRewardsPage from "./pages/customer-rewards"
import PromotionCampaignsPage from "./pages/promotion-campaigns"
import PromotionCampaignRewardsPage from "./pages/promotion-campaign-rewards"
import CreateDeliveryLog from "./pages/delivery-logs/create"
import DeliveryLogsList from "./pages/delivery-logs"
import DeliveryLogDetail from "./pages/delivery-logs/detail"
import EditDeliveryLog from "./pages/delivery-logs/edit"
// Thêm import cho trang báo cáo lợi nhuận
import ProfitReportsPage from "./pages/profit-reports"
import RevenueReportPage from "./pages/reports/revenue-report"
import TaxRevenueReport2026Page from "./pages/reports/tax-revenue-report-2026"
// Thêm import cho trang quản lý diện tích mỗi công đất
import Areas from "./pages/area-of-each-plot-of-land"
import CreateSalesReturn from "./pages/sales-returns/create"
// Thêm import cho inventory returns và adjustments
import ReturnsPage from "./pages/inventory/returns"
import AdjustmentsPage from "./pages/inventory/adjustments"
import InventoryMixturesList from "./pages/inventory/mixtures"
import InventoryMixtureCreate from "./pages/inventory/mixtures/create"
import InventoryMixtureDetail from "./pages/inventory/mixtures/detail"
import OperatingCostCategoriesPage from './pages/operating-costs/categories'
import OperatingCostsPage from "./pages/operating-costs"
import GiftCostsPage from "./pages/operating-costs/gift-costs"
import CostItemCategoriesPage from './pages/cost-item-categories'
import DosageCalculator from "./pages/calculator/dosage-calculator"
// Thêm import cho trang dự báo thời tiết
import WeatherForecastPage from "./pages/weather-forecast"
// Thêm import cho trang Lịch Vạn Niên
import LunarCalendar from "./pages/lunar-calendar"
import NewsPage from "./pages/news"
import { fetchAndActivate, getValue } from "firebase/remote-config"
import { remoteConfig, getAllRemoteValues } from "./lib/firebase"
import { useConfigStore } from "./stores/config.store"
import { useFirebaseNotifications } from "./hooks/use-firebase-notifications"
import { usePullToRefresh } from "./hooks/use-pull-to-refresh"


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
      if (!remoteConfig) return;
      try {
        console.log('🚀 Initializing Remote Config...')
        const activated = await fetchAndActivate(remoteConfig!)
        console.log('✅ Remote Config fetched:', activated ? 'New config activated' : 'Using cached config')
        
        // Pre-fetch Tomorrow.io keys để cache
        await getAllRemoteValues('TOMORROW_API_KEY_');

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
          const value = getValue(remoteConfig!, name).asString()
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

  // Firebase Notification Setup - sử dụng hook
  useFirebaseNotifications(isLogin);

  // Pull to Refresh cho PWA
  usePullToRefresh();

  const values = {
    isHeaderFooterShow,
    setIsHeaderFooterShow,
    isSidebarOpen,
    setIsSidebarOpen,
  }

  return (
    <AntApp>
      <BrowserRouter>
        <AppContent 
          values={values}
          isHeaderFooterShow={isHeaderFooterShow}
          isSidebarOpen={isSidebarOpen}
          isLogin={isLogin}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />
      </BrowserRouter>
    </AntApp>
  )
}

// Component con để sử dụng useLocation
function AppContent({ 
  values,
  isHeaderFooterShow, 
  isSidebarOpen,
  isLogin,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen
}: {
  values: TypeMyContext
  isHeaderFooterShow: boolean
  isSidebarOpen: boolean
  isLogin: boolean | undefined
  isMobileSidebarOpen: boolean
  setIsMobileSidebarOpen: Dispatch<SetStateAction<boolean>>
}) {
  const location = useLocation()
  const isWeatherForecastPage = location.pathname === '/weather-forecast'
  const isLunarCalendarPage = location.pathname === '/lunar-calendar'
  
  // Hiển thị Header/Sidebar nếu: đã login HOẶC đang ở trang weather-forecast HOẶC lunar-calendar
  const shouldShowLayout = (isHeaderFooterShow === false && isLogin) || isWeatherForecastPage || isLunarCalendarPage
  
  // Ẩn sidebar cho weather-forecast và lunar-calendar (full-width layout như NextJS)
  const shouldShowSidebar = shouldShowLayout && !isWeatherForecastPage && !isLunarCalendarPage

  return (
    <MyContext.Provider value={values}>
      <div className='flex flex-col h-screen overflow-hidden'>
        {/* Header - luôn hiển thị trên cùng và trải dài toàn bộ chiều rộng */}
        {shouldShowLayout && (
          <div className='w-full flex-shrink-0 h-[70px] z-[100]'>
            <Header />
          </div>
        )}

        <div className='flex flex-1 overflow-hidden relative'>
          {/* Sidebar - hidden on mobile by default, shown as overlay */}
          {shouldShowSidebar && isSidebarOpen && (
                <div className='hidden md:block w-[17%] flex-shrink-0 overflow-y-auto z-10' style={{background: 'linear-gradient(180deg, #059669 0%, #047857 100%)'}}>
                  <Sidebar />
                </div>
              )}

              {/* Main content area */}
              <div className='flex-1 overflow-y-auto overflow-x-hidden min-w-0'>
                <main
                  className={
                    shouldShowLayout && !isWeatherForecastPage && !isLunarCalendarPage ? "p-2 md:p-6" : ""
                  }
                >
                  <Routes>
                    {/* Các trang yêu cầu đăng nhập */}
                    <Route
                      path='/'
                      element={<Navigate to="/products/search" replace />}
                    />
                    
                    <Route
                      path='/dosage-calculator'
                      element={
                        <ProtectedRoute>
                          <DosageCalculator />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path='/weather-forecast'
                      element={<WeatherForecastPage />}
                    />

                    <Route
                      path='/lunar-calendar'
                      element={<LunarCalendar />}
                    />

                    <Route
                      path='/products/search'
                      element={
                        <ProtectedRoute requiredPermission="product:read">
                          <ProductSearch />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/products/list'
                      element={
                        <ProtectedRoute requiredPermission="product:read">
                          <ProductsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/product/:id?'
                      element={
                        <ProtectedRoute requiredPermission="product:manage">
                          <Products />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/product-comparison'
                      element={
                        <ProtectedRoute requiredPermission="product:read">
                          <ProductComparisonPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/image-studio'
                      element={
                        <ProtectedRoute requiredPermission="product:read">
                          <ImageStudioPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/category/list'
                      element={
                        <ProtectedRoute requiredPermission="product:manage">
                          <ListCategory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/sub-category/list'
                      element={
                        <ProtectedRoute requiredPermission="product:manage">
                          <ListSubCategory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/users'
                      element={
                        <ProtectedRoute requiredPermission="user:read">
                          <Users />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/products/*'
                      element={
                        <ProtectedRoute requiredPermission="product:read">
                          <Products />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/units'
                      element={
                        <ProtectedRoute requiredPermission="product:manage">
                          <ListUnits />
                        </ProtectedRoute>
                      }
                    />
                    {/* Thêm route cho trang symbol */}
                    <Route
                      path='/symbols'
                      element={
                        <ProtectedRoute requiredPermission="product:manage">
                          <ListSymbols />
                        </ProtectedRoute>
                      }
                    />
                    {/* Thêm route cho trang supplier */}
                    <Route
                      path='/suppliers'
                      element={
                        <ProtectedRoute requiredPermission="inventory:manage">
                          <Suppliers />
                        </ProtectedRoute>
                      }
                    />
                    {/* Thêm route cho thống kê nhà cung cấp */}
                    <Route
                      path='/suppliers/stats/:id'
                      element={
                        <ProtectedRoute requiredPermission="inventory:manage">
                          <SupplierStatsPage />
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
                    {/* IMPORTANT: Specific routes must come BEFORE wildcard routes */}
                    <Route
                      path='/rice-crops/categories'
                      element={
                        <ProtectedRoute>
                          <CostItemCategoriesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/farm-service-costs'
                      element={
                        <ProtectedRoute requiredPermission="sales:manage">
                          <FarmServiceCostsPage />
                        </ProtectedRoute>
                      }
                    />
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
                        <ProtectedRoute requiredPermission="inventory:read">
                          <InventoryReceiptsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/inventory/receipts/create'
                      element={
                        <ProtectedRoute requiredPermission="inventory:manage">
                          <InventoryReceiptCreate />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/inventory/receipts/edit/:id'
                      element={
                        <ProtectedRoute requiredPermission="inventory:manage">
                          <InventoryReceiptCreate />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/inventory/receipts/:id'
                      element={
                        <ProtectedRoute requiredPermission="inventory:read">
                          <InventoryReceiptDetail />
                        </ProtectedRoute>
                      }
                    />

                    {/* Routes cho Phiếu Trả Hàng */}
                    <Route
                      path='/inventory/returns/*'
                      element={
                        <ProtectedRoute requiredPermission="inventory:read">
                          <ReturnsPage />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Routes cho Phiếu Điều Chỉnh */}
                    <Route
                      path='/inventory/adjustments/*'
                      element={
                        <ProtectedRoute requiredPermission="inventory:manage">
                          <AdjustmentsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Routes cho Phối trộn sản phẩm */}
                    <Route
                      path='/inventory/mixtures'
                      element={
                        <ProtectedRoute requiredPermission="inventory:read">
                          <InventoryMixturesList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/inventory/mixtures/create'
                      element={
                        <ProtectedRoute requiredPermission="inventory:manage">
                          <InventoryMixtureCreate />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/inventory/mixtures/:id'
                      element={
                        <ProtectedRoute requiredPermission="inventory:read">
                          <InventoryMixtureDetail />
                        </ProtectedRoute>
                      }
                    />

                    {/* Quản lý bán hàng - Sales Management */}
                    <Route
                      path='/seasons'
                      element={
                        <ProtectedRoute requiredPermission="sales:manage">
                          <Seasons />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/area-of-each-plot-of-land'
                      element={
                        <ProtectedRoute requiredPermission="sales:manage">
                          <Areas />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/customers'
                      element={
                        <ProtectedRoute requiredPermission="sales:read">
                          <Customers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/sales-invoices'
                      element={
                        <ProtectedRoute requiredPermission="sales:read">
                          <SalesInvoicesList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/sales-invoices/create'
                      element={
                        <ProtectedRoute requiredPermission="sales:create">
                          <CreateSalesInvoice />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/payments'
                      element={
                        <ProtectedRoute requiredPermission="sales:read">
                          <PaymentsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/debt-notes'
                      element={
                        <ProtectedRoute requiredPermission="sales:read">
                          <DebtNotesList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/customer-rewards'
                      element={
                        <ProtectedRoute requiredPermission="sales:read">
                          <CustomerRewardsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/promotion-campaigns'
                      element={
                        <ProtectedRoute requiredPermission="sales:read">
                          <PromotionCampaignsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/promotion-campaign-rewards'
                      element={
                        <ProtectedRoute requiredPermission="sales:read">
                          <PromotionCampaignRewardsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/sales-returns'
                      element={
                        <ProtectedRoute requiredPermission="sales:read">
                          <SalesReturnsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/sales-returns/create'
                      element={
                        <ProtectedRoute requiredPermission="sales:manage">
                          <CreateSalesReturn />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/delivery-logs'
                      element={
                        <ProtectedRoute requiredPermission="sales:read">
                          <DeliveryLogsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/delivery-logs/create'
                      element={
                        <ProtectedRoute requiredPermission="sales:create">
                          <CreateDeliveryLog />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/delivery-logs/:id'
                      element={
                        <ProtectedRoute requiredPermission="sales:read">
                          <DeliveryLogDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/delivery-logs/edit/:id'
                      element={
                        <ProtectedRoute requiredPermission="sales:manage">
                          <EditDeliveryLog />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/profit-reports'
                      element={
                        <ProtectedRoute requiredPermission="store-profit-report:read">
                          <ProfitReportsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/reports/revenue'
                      element={
                        <ProtectedRoute requiredPermission="store-profit-report:read">
                          <RevenueReportPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/reports/tax-revenue-2026'
                      element={
                        <ProtectedRoute requiredPermission="store-profit-report:read">
                          <TaxRevenueReport2026Page />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/operating-costs'
                      element={
                        <ProtectedRoute requiredPermission="sales:manage">
                          <OperatingCostsPage />
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


                    {/* Routes cho Chi phí Vận hành */}
                    <Route
                      path='/operating-costs'
                      element={
                        <ProtectedRoute requiredPermission="OPERATING_COST_VIEW">
                          <OperatingCostsPage />
                        </ProtectedRoute>
                      }
                    />
                     <Route
                      path='/operating-costs/gift-costs'
                      element={
                        <ProtectedRoute requiredPermission="OPERATING_COST_VIEW">
                          <GiftCostsPage />
                        </ProtectedRoute>
                      }
                    />
                     <Route
                      path='/operating-costs/categories'
                      element={
                        <ProtectedRoute requiredPermission="OPERATING_COST_VIEW">
                          <OperatingCostCategoriesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/cost-item-categories'
                      element={
                        <ProtectedRoute requiredPermission="COST_ITEM_MANAGE">
                          <CostItemCategoriesPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path='/news'
                      element={
                        <ProtectedRoute requiredPermission="news:manage">
                          <NewsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Trang 404 */}
                    <Route path='*' element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>


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
  )
}

export default App
