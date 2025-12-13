import { useContext, useEffect } from "react"
import { MyContext } from "../../App"
import Logo from "../../assets/images/logo.png"
import Button from "@mui/material/Button"
import { LuArrowRightToLine } from "react-icons/lu"
import { FaRegUser } from "react-icons/fa6"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import FormField from "@/components/form/form-field"
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
  defaultForgotPasswordValues,
} from "./form-config"

export const ForgotPassword = () => {
  const context = useContext(MyContext)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: defaultForgotPasswordValues,
  })

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(true)
  }, [context])

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      // Here you would implement the actual forgot password logic
      console.log("Forgot password request for:", data.user_account)
      // Example API call:
      // await forgotPasswordApi.call(data.user_account)
    } catch (error) {
      console.error("Error requesting password reset:", error)
    }
  }

  return (
    <>
      <div className='signUpSection bg-white' style={{ height: "100vh" }}>
        <div className='header flex items-center justify-between'>
          <div className='logo'>
            <img src={Logo} />
          </div>
          <div className='ml-auto flex items-center justify-end gap-3'>
            <Link to='/sign-in'>
              <Button className='btn-border btn-round'>
                <LuArrowRightToLine /> Login
              </Button>
            </Link>
            <Link to='/signUp'>
              <Button className='btn-blue btn-round'>
                <FaRegUser /> Sign Up
              </Button>
            </Link>
          </div>
        </div>

        <br />
        <br />
        <br />
        <div className='container signUpPage'>
          <h1 className='text-center font-weight-bold'>
            Having trouble to sign in? <br />
            Reset your password.
          </h1>

          <form className='form mt-5' onSubmit={handleSubmit(onSubmit)}>
            <div className='col_ lg'>
              <h4>Full Name</h4>
              <FormField
                name="user_account"
                control={control}
                label="Tài khoản (Email hoặc Username)"
                placeholder="Nhập email hoặc username"
                required
              />
            </div>

            <Button type='submit' className='btn-blue btn-lg w-100 mb-3'>
              Reset Password
            </Button>

            <p className='text-center text'>
              Don’t want to reset? <Link to='/sign-in'>Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  )
}
