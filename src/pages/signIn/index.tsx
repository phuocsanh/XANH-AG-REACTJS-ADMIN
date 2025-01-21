import Logo from "../../assets/images/logo.png";
import Button from "@mui/material/Button";
import { LuArrowRightToLine } from "react-icons/lu";
import { FaRegUser } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { InputAdornment, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import formConfig, { FormField } from "./formConfig";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "@/App";
import { useLoginMutation } from "@/queries/use-auth";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styled from "styled-components";
const CustomTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "100px", // Đặt border-radius tại đây
  },
});
export const SignIn = () => {
  const context = useContext(MyContext);
  useEffect(() => {
    window.scrollTo(0, 0);
    context.setIsHeaderFooterShow(true);
  }, []);
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormField>(formConfig);
  const [showPassword, setShowPassword] = useState(false);
  const login = useLoginMutation();
  const onSubmit = (values: FormField) => {
    login.mutate({ email: values.email, password: values.password });
  };
  return (
    <>
      <div className="signUpSection bg-white min-h-screen">
        <div className="header flex items-center justify-between">
          <div className="logo">
            <Link to="/">
              <img src={Logo} />
            </Link>
          </div>
          <div className="ml-auto flex items-center justify-end gap-3">
            <Link to="/signIn">
              <Button className="btn-border btn-round">
                <LuArrowRightToLine /> Login
              </Button>
            </Link>
            <Link to="/signUp">
              <Button className="btn-blue btn-round">
                <FaRegUser /> Sign Up
              </Button>
            </Link>
          </div>
        </div>

        <div className="container signUpPage">
          <h1 className="text-center font-weight-bold">
            Welcome Back!
            <br />
            Sign in with your credentials.
          </h1>
          <div className="mt-20">
            <CustomTextField
              id="outlined-basic"
              label="Email"
              variant="outlined"
              required
              className="w-full"
              error={!!errors.email?.message || false}
              onChange={(e) => setValue("email", e.target.value)}
            />
            {errors.email && (
              <p className="mt-1 text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="mt-9">
            <CustomTextField
              id="outlined-basic"
              label="Mật khẩu"
              variant="outlined"
              className="w-full"
              required
              type={showPassword ? undefined : "password"}
              error={!!errors.password?.message || false}
              onChange={(e) => setValue("password", e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ cursor: "pointer" }}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {errors.password && (
              <p className="mt-1 text-red-600">{errors.password.message}</p>
            )}
          </div>

          <br />

          <Button
            loading={login.isPending}
            disabled={login.isPending}
            className={`w-100 btn-blue  btn-round h-12 mt-4`}
            onClick={handleSubmit(onSubmit)}
          >
            {!login.isPending && <p className="text-white"> Đăng nhập</p>}
          </Button>
        </div>
      </div>
    </>
  );
};
