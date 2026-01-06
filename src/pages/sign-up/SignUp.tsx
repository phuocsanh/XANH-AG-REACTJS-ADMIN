import Logo from "../../assets/images/logo-xanh.jpg"
import Button from "@mui/material/Button"
import { Link, useNavigate } from "react-router-dom"
import { CircularProgress, InputAdornment, TextField } from "@mui/material"
import { useForm } from "react-hook-form"
import formConfig, { FormField } from "./form-config"
import { useContext, useState } from "react"
import { MyContext } from "@/App"
import { useRegisterMutation } from "@/queries/auth"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import styled from "styled-components"
import { toast } from "react-toastify"

const CustomTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "100px", // Đặt border-radius tại đây
  },
})

export const SignUp = () => {
  const context = useContext(MyContext)
  const navigate = useNavigate()

  // Kiểm tra context có tồn tại không
  if (!context) {
    throw new Error("SignUp must be used within MyContext.Provider")
  }

  const { setIsHeaderFooterShow } = context

  // Set hiển thị header và footer khi component mount
  useState(() => {
    window.scrollTo(0, 0)
    setIsHeaderFooterShow(true)
  })

  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm<FormField>(formConfig)

  const [showPassword, setShowPassword] = useState(false)
  const registerMutation = useRegisterMutation()

  const onSubmit = async (values: FormField) => {
    try {
      // Sử dụng trực tiếp values từ form với validation đã được thực hiện
      await registerMutation.mutateAsync(values)

      // Nếu đăng ký thành công, chuyển hướng đến trang đăng nhập
      toast.success("Vui lòng đăng nhập để tiếp tục")
      navigate("/sign-in")
    } catch (error) {
      // Lỗi đã được xử lý trong useRegisterMutation
      console.error("Lỗi đăng ký:", error)
    }
  }

  return (
    <>
      <div className='min-h-screen'>
        <div className='header flex items-center justify-between'>
          <div className='logo'>
            <Link to='/'>
              <img src={Logo} alt='Logo' />
            </Link>
          </div>
          <div className='ml-auto flex items-center justify-end gap-3'>
            <Link to='/sign-in'>
              <Button className='btn-border btn-round'>Đăng nhập</Button>
            </Link>
          </div>
        </div>

        <div className='max-w-md mx-auto p-4 sm:p-6'>
          <h1 className='text-center font-weight-bold'>
            Tạo tài khoản mới
            <br />
            Đăng ký để bắt đầu sử dụng dịch vụ.
          </h1>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className='mt-6'>
              <CustomTextField
                id='user_account'
                label='Tài khoản (Email hoặc Username)'
                variant='outlined'
                required
                className='w-full'
                error={!!errors.user_account?.message || false}
                {...register("user_account")}
              />
              {errors.user_account && (
                <p className='mt-1 text-red-600'>
                  {errors.user_account.message}
                </p>
              )}
            </div>

            <div className='mt-6 mb-8'>
              <CustomTextField
                id='user_password'
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
                <p className='mt-1 text-red-600'>
                  {errors.user_password.message}
                </p>
              )}
            </div>

            <Button
              className={`w-100 btn-blue btn-round h-12 `}
              type='submit'
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <CircularProgress size={24} color='inherit' />
              ) : (
                <p className='text-white'>Đăng ký</p>
              )}
            </Button>
          </form>

          <div className='mt-6 text-center'>
            <p>
              Đã có tài khoản?{" "}
              <Link to='/sign-in' className='text-blue-600 hover:underline'>
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
