import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { createContext, Dispatch, SetStateAction, useState, useEffect } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Header } from "./components/Header";
import ProductsList from "./pages/Products/productsList";
import { SignIn } from "./pages/signIn";
import { ForgotPassword } from "./pages/forgotPassword";
import { OtpPage } from "./pages/otp";
import { ProductCreate } from "./pages/Products/productCreate";
import { ProductEdit } from "./pages/Products/productEdit";
import ListCategory from "./pages/Categories/ListCategory";
import ListSubCategory from "./pages/SubCategories/ListSubCategory";
import ProtectedRoute from "./components/ProtectedRoute";
import {
  InventoryReceiptsList,
  InventoryReceiptDetail,
  InventoryReceiptCreate
} from "./pages/Inventory";
import { useAppStore } from "./stores";
import authService from "./services/auth.service";

type TypeMyContext = {
  isHeaderFooterShow: boolean;
  setIsHeaderFooterShow: Dispatch<SetStateAction<boolean>>;
};

const MyContext = createContext<TypeMyContext>({
  isHeaderFooterShow: false,
  setIsHeaderFooterShow: () => {},
});

function App() {
  const [isHeaderFooterShow, setIsHeaderFooterShow] = useState(false);
  const isLogin = useAppStore((state) => state.isLogin);

  // Kiểm tra trạng thái đăng nhập khi ứng dụng khởi động
  useEffect(() => {
    authService.checkAuthStatus();
  }, []);

  const values = {
    isHeaderFooterShow,
    setIsHeaderFooterShow,
  };

  return (
    <>
      <BrowserRouter>
        <MyContext.Provider value={values}>
          <section className="main flex">
            {isHeaderFooterShow === false && isLogin && (
              <div className="sidebarWrapper w-[17%]">
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
                  <div className="space"></div>
                </>
              )}

              <Routes>
                {/* Các trang yêu cầu đăng nhập */}
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/products/list" element={<ProtectedRoute><ProductsList /></ProtectedRoute>} />
                <Route path="/products/new" element={<ProtectedRoute><ProductCreate /></ProtectedRoute>} />
                <Route path="/products/edit/:id" element={<ProtectedRoute><ProductEdit /></ProtectedRoute>} />
                <Route path="/product/:id?" element={<ProtectedRoute><ProductCreate /></ProtectedRoute>} />
                <Route path="/category/list" element={<ProtectedRoute><ListCategory /></ProtectedRoute>} />
                <Route path="/sub-category/list" element={<ProtectedRoute><ListSubCategory /></ProtectedRoute>} />
                
                {/* Quản lý nhập hàng - Inventory Management */}
                <Route path="/inventory/receipts" element={<ProtectedRoute><InventoryReceiptsList /></ProtectedRoute>} />
                <Route path="/inventory/receipts/create" element={<ProtectedRoute><InventoryReceiptCreate /></ProtectedRoute>} />
                <Route path="/inventory/receipts/:id" element={<ProtectedRoute><InventoryReceiptDetail /></ProtectedRoute>} />
                <Route path="/inventory/receipts/edit/:id" element={<ProtectedRoute><InventoryReceiptCreate /></ProtectedRoute>} />
                
                {/* Các trang công khai */}
                <Route path="/signIn" element={<SignIn />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/otp" element={<OtpPage />} />
              </Routes>
            </div>
          </section>
        </MyContext.Provider>
      </BrowserRouter>
    </>
  );
}

export default App;
export { MyContext };
