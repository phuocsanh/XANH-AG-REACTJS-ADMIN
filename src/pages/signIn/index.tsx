import Logo from "../../assets/images/logo.png"
import Button from "@mui/material/Button"
import { LuArrowRightToLine } from "react-icons/lu"
import { FaRegUser } from "react-icons/fa6"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { CircularProgress, InputAdornment, TextField } from "@mui/material"
import { useForm } from "react-hook-form"
import formConfig, { FormField } from "./formConfig"
import { useContext, useEffect, useState } from "react"
import { MyContext } from "@/App"
import { useLoginMutation } from "@/queries/use-auth"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import styled from "styled-components"
import { toast } from "react-toastify"
const CustomTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "100px", // Đặt border-radius tại đây
  },
})
export const SignIn = () => {
  const context = useContext(MyContext)
  const navigate = useNavigate()
  const location = useLocation()

  // Lấy đường dẫn redirect sau khi đăng nhập thành công (nếu có)
  const from = location.state?.from || "/"

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(true)
  }, [])

  const {
    handleSubmit,
    setValue,
    formState: { errors },
    register,
  } = useForm<FormField>(formConfig)

  const [showPassword, setShowPassword] = useState(false)
  const loginMutation = useLoginMutation()

  const onSubmit = async (values: FormField) => {
    try {
      // Sử dụng trực tiếp values từ form với validation đã được thực hiện - theo pattern của example
      await loginMutation.mutateAsync(values);
    } catch (error) {
      // Lỗi đã được xử lý trong useLoginMutation
      console.error("Lỗi đăng nhập:", error);
    }
  }
  return (
    <>
      <div className='signUpSection bg-white min-h-screen'>
        <div className='header flex items-center justify-between'>
          <div className='logo'>
            <Link to='/'>
              <img src={Logo} />
            </Link>
          </div>
          <div className='ml-auto flex items-center justify-end gap-3'>
            {/* <Link to='/signIn'>
              <Button className='btn-border btn-round'>
                <LuArrowRightToLine /> Login
              </Button>
            </Link> */}
          </div>
        </div>

        <div className='container signUpPage'>
          <h1 className='text-center font-weight-bold'>
            Welcome Back!
            <br />
            Sign in with your credentials.
          </h1>
          <div className='mt-20'>
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
              <p className='mt-1 text-red-600'>{errors.user_account.message}</p>
            )}
          </div>

          <div className='mt-9'>
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
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {errors.user_password && (
              <p className='mt-1 text-red-600'>{errors.user_password.message}</p>
            )}
          </div>

          <br />

          <Button
            className={`w-100 btn-blue btn-round h-12 mt-4`}
            onClick={handleSubmit(onSubmit)}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <CircularProgress size={24} color='inherit' />
            ) : (
              <p className='text-white'>Đăng nhập</p>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
