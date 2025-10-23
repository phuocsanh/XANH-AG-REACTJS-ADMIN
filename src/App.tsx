import { BrowserRouter, Route, Routes } from "react-router-dom"
import Sidebar from "./components/sidebar"
import { Header } from "./components/header"
import {
  createContext,
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
} from "react"
import { Dashboard } from "./pages/dashboard"
import ProductsList from "./pages/products/products-list"
import { SignIn } from "./pages/sign-in"
import { ForgotPassword } from "./pages/forgot-password"
import { OtpPage } from "./pages/otp"
import { ProductCreate } from "./pages/products/product-create"
import { ProductEdit } from "./pages/products/product-edit"
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
import authService from "./services/auth.service"

type TypeMyContext = {
  isHeaderFooterShow: boolean
  setIsHeaderFooterShow: Dispatch<SetStateAction<boolean>>
}

const MyContext = createContext<TypeMyContext>({
  isHeaderFooterShow: false,
  setIsHeaderFooterShow: () => {},
})

function App() {
  const [isHeaderFooterShow, setIsHeaderFooterShow] = useState(false)
  const isLogin = useAppStore((state) => state.isLogin)

  // Kiểm tra trạng thái đăng nhập khi ứng dụng khởi động
  useEffect(() => {
    authService.checkAuthStatus()
  }, [])

  const values = {
    isHeaderFooterShow,
    setIsHeaderFooterShow,
  }

  return (
    <>
      <BrowserRouter>
        <MyContext.Provider value={values}>
          <section className='main flex'>
            {isHeaderFooterShow === false && isLogin && (
              <div className='sidebarWrapper w-[17%]'>
                <Sidebar />
              </div>
            )}

            <div
              className={`content_Right w-[${
                isHeaderFooterShow === false && isLogin ? "83%" : "100%"
              }] ${isHeaderFooterShow === true ? "padding" : ""}`}
            >
              {isHeaderFooterShow === false && isLogin && (
                <>
                  <Header />
                  <div className='space'></div>
                </>
              )}

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
                  path='/products/new'
                  element={
                    <ProtectedRoute>
                      <ProductCreate />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path='/products/edit/:id'
                  element={
                    <ProtectedRoute>
                      <ProductEdit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path='/product/:id?'
                  element={
                    <ProtectedRoute>
                      <ProductCreate />
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
                <Route path='/forgot-password' element={<ForgotPassword />} />
                <Route path='/otp' element={<OtpPage />} />
              </Routes>
            </div>
          </section>
        </MyContext.Provider>
      </BrowserRouter>
    </>
  )
}

export default App
export { MyContext }
