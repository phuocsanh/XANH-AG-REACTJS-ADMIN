import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { createContext, Dispatch, SetStateAction, useState, useEffect } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Header } from "./components/Header";
import { ProductsList } from "./pages/Products/productsList";
import { SignIn } from "./pages/signIn";
import { ForgotPassword } from "./pages/forgotPassword";
import { OtpPage } from "./pages/otp";
import { ProductCreate } from "./pages/Products/productCreate";
import ListCategory from "./pages/Categories/ListCategory";
import ListSubCategory from "./pages/SubCategories/ListSubCategory";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAppStore } from "./stores";
import authService from "./services/auth.service";

type TypeMyContext = {
  isLogin: boolean;
  setIsLogin: Dispatch<SetStateAction<boolean>>;
  isHeaderFooterShow: boolean;
  setIsHeaderFooterShow: Dispatch<SetStateAction<boolean>>;
};

const MyContext = createContext<TypeMyContext>({
  isLogin: false,
  setIsLogin: () => {},
  isHeaderFooterShow: false,
  setIsHeaderFooterShow: () => {},
});

function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [isHeaderFooterShow, setIsHeaderFooterShow] = useState(false);

  // Kiểm tra trạng thái đăng nhập khi ứng dụng khởi động
  useEffect(() => {
    const isLoggedIn = authService.checkAuthStatus();
    setIsLogin(!!isLoggedIn);
    
    // Cập nhật store nếu cần
    if (isLoggedIn) {
      useAppStore.setState({ isLogin: true });
    }
  }, []);

  // Đồng bộ trạng thái đăng nhập với store
  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state) => {
      setIsLogin(!!state.isLogin);
    });
    
    return () => unsubscribe();
  }, []);

  const values = {
    isLogin,
    setIsLogin,
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
                <Route path="/product/:id?" element={<ProtectedRoute><ProductCreate /></ProtectedRoute>} />
                <Route path="/category/list" element={<ProtectedRoute><ListCategory /></ProtectedRoute>} />
                <Route path="/sub-category/list" element={<ProtectedRoute><ListSubCategory /></ProtectedRoute>} />
                
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
