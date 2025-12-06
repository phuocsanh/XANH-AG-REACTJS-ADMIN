import Logo from "../../assets/images/logo-xanh.png"
import Button from "@mui/material/Button"
import { Link } from "react-router-dom"
import { CircularProgress, InputAdornment, TextField } from "@mui/material"
import { useForm } from "react-hook-form"
import formConfig, { FormField } from "./form-config"
import { useContext, useEffect, useState } from "react"
import { MyContext } from "@/App"
import { useLoginMutation } from "@/queries/auth"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import styled from "styled-components"

const CustomTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "100px",
  },
})
export const SignIn = () => {
  const context = useContext(MyContext)

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(false)
  }, [])

  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm<FormField>(formConfig)

  const [showPassword, setShowPassword] = useState(false)
  const loginMutation = useLoginMutation()

  const onSubmit = async (values: FormField) => {
    try {
      await loginMutation.mutateAsync(values)
    } catch (error) {
      console.error("Lỗi đăng nhập:", error)
    }
  }
  return (
    <>
      <div className='min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50'>
        <div className='w-full max-w-md'>
          <div className='text-center mb-8'>
            <Link to='/'>
              <img src={Logo} alt="Logo" className="h-24 mx-auto mb-6" />
            </Link>
            <h1 className='text-center font-bold text-2xl md:text-3xl font-sans tracking-wide leading-relaxed'>
              <span
                style={{
                  background: "var(--gradient-sidebar)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "inline-block"
                }}
              >
                Xin chào đến với VTNN XANH!
              </span>
              <br />
              <span className="text-gray-500 text-lg md:text-xl font-normal mt-2 block">
                Đăng nhập với thông tin của bạn.
              </span>
            </h1>
          </div>

          <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100'>
            <div className='mb-6'>
              <CustomTextField
                id='outlined-basic'
                label='Tài khoản (Email hoặc Username)'
                variant='outlined'
                required
                className='w-full'
                error={!!errors.user_account?.message || false}
                {...register("user_account")}
              />
              {errors.user_account && (
                <p className='mt-1 text-red-600 text-sm ml-2'>
                  {errors.user_account.message}
                </p>
              )}
            </div>

            <div className='mb-8'>
              <CustomTextField
                id='outlined-basic'
                label='Mật khẩu'
                variant='outlined'
                className='w-full'
                required
                type={showPassword ? undefined : "password"}
                error={!!errors.user_password?.message || false}
                {...register("user_password")}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <span
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ cursor: "pointer" }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {errors.user_password && (
                <p className='mt-1 text-red-600 text-sm ml-2'>
                  {errors.user_password.message}
                </p>
              )}
            </div>

            <Button
              className={`w-full btn-blue btn-round h-12 shadow-lg hover:shadow-xl transition-all duration-300`}
              onClick={handleSubmit(onSubmit)}
              disabled={loginMutation.isPending}
              style={{ fontSize: "16px", fontWeight: "600" }}
            >
              {loginMutation.isPending ? (
                <CircularProgress size={24} color='inherit' />
              ) : (
                "Đăng nhập"
              )}
            </Button>

            {/* Thêm nút đăng ký */}
            <div className='mt-6 text-center text-gray-500'>
              <p>
                Chưa có tài khoản?{" "}
                <Link 
                  to='/sign-up' 
                  className='font-bold hover:underline'
                  style={{ color: "var(--green-medium)" }}
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
