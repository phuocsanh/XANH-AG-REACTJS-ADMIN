import Logo from "../../assets/images/logo.png"
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
    borderRadius: "100px", // Đặt border-radius tại đây
  },
})
export const SignIn = () => {
  const context = useContext(MyContext)

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(true)
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
      // Sử dụng trực tiếp values từ form với validation đã được thực hiện - theo pattern của example
      await loginMutation.mutateAsync(values)
    } catch (error) {
      // Lỗi đã được xử lý trong useLoginMutation
      console.error("Lỗi đăng nhập:", error)
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
            {/* <Link to='/sign-in'>
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
              error={!!errors.userAccount?.message || false}
              {...register("userAccount")}
            />
            {errors.userAccount && (
              <p className='mt-1 text-red-600'>{errors.userAccount.message}</p>
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
              error={!!errors.userPassword?.message || false}
              {...register("userPassword")}
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

            {errors.userPassword && (
              <p className='mt-1 text-red-600'>{errors.userPassword.message}</p>
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
