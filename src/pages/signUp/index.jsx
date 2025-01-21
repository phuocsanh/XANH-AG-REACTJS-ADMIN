import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../App";
import Logo from "../../assets/images/logo.png";
import Button from "@mui/material/Button";
import { LuArrowRightToLine } from "react-icons/lu";
import { FaRegUser } from "react-icons/fa6";
import { IoLogoGoogleplus } from "react-icons/io";
import { FaFacebook } from "react-icons/fa6";
import { FaRegEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa6";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { Link } from "react-router-dom";

export const SignUp = () => {
  const [isShowPassword, setIsShowPassword] = useState(false);

  const context = useContext(MyContext);

  useEffect(() => {
    window.scrollTo(0, 0);
    context.setIsHeaderFooterShow(true);
  }, []);

  return (
    <>
      <div className="signUpSection bg-white">
        <div className="header flex items-center justify-between">
          <div className="logo">
          <Link to="/"><img src={Logo} /></Link>
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
            Join us today! Get special
            <br /> benefits and stay up-to-date.
          </h1>

          <div className="flex items-center gap-3 mt-4 socialBtn">
            <Button className="col">
              <IoLogoGoogleplus style={{ fontSize: "20px" }} /> Signin with
              Google
            </Button>
            <Button className="col">
              <FaFacebook /> Signin with Facebook
            </Button>
          </div>

          <br />

          <h3 className="text-center text-sm font-bold">
            Or, Sign up with your email
          </h3>

          <form className="form mt-5">
            <div className="col_ lg">
              <h4>Full Name</h4>
              <div className="form-group">
                <input
                  type="text"
                  className="input lg"
                  placeholder="Enter Your Full Name"
                />
              </div>
            </div>

            <div className="col_ lg">
              <h4>Email</h4>
              <div className="form-group">
                <input
                  type="text"
                  className="input lg"
                  placeholder="Enter Your Email"
                />
              </div>
            </div>

            <div className="col_ lg">
              <h4>Password</h4>
              <div className="form-group relative">
                <input
                  type={isShowPassword === false ? "password" : "text"}
                  className="input lg"
                  placeholder="Enter Your Password"
                />
                <Button onClick={() => setIsShowPassword(!isShowPassword)}>
                  {isShowPassword === false ? <FaEyeSlash /> : <FaRegEye />}
                </Button>
              </div>
            </div>

            <FormControlLabel
              control={<Checkbox />}
              label="By signing up you have agreed to our Terms & Privacy Policy"
            />

            <Button className="btn-blue btn-lg w-100 mb-3">
              Create Account
            </Button>

            <p className="text-center text">
              Don’t have an account? <Link to="/signIn">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};
