import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { createContext, Dispatch, SetStateAction, useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Header } from "./components/Header";
import { ProductsList } from "./pages/Products/productsList";
import { SignUp } from "./pages/signUp";
import { SignIn } from "./pages/signIn";
import { ForgotPassword } from "./pages/forgotPassword";
import { OtpPage } from "./pages/otp";
import { ProductCreate } from "./pages/Products/productCreate";
import ListCategory from "./pages/Categories/ListCategory";
import ListSubCategory from "./pages/SubCategories/ListSubCategory";

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
            {isHeaderFooterShow === false && (
              <div className="sidebarWrapper w-[17%]">
                <Sidebar />
              </div>
            )}

            <div
              className={`content_Right w-[${
                isHeaderFooterShow === false ? "83%" : "100%"
              }] ${isHeaderFooterShow === true ? "padding" : ""}`}
            >
              {isHeaderFooterShow === false && (
                <>
                  <Header />
                  <div className="space"></div>
                </>
              )}

              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products/list" element={<ProductsList />} />
                <Route path="/product/:id?" element={<ProductCreate />} />
                <Route path="/category/list" element={<ListCategory />} />
                <Route
                  path="/sub-category/list"
                  element={<ListSubCategory />}
                />
                <Route path="/signUp" element={<SignUp />} />
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
