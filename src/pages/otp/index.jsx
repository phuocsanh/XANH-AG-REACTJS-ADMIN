import { useContext, useEffect } from "react"
import { MyContext } from "../../App"
import Logo from "../../assets/images/logo.png"
import Button from "@mui/material/Button"
import { LuArrowRightToLine } from "react-icons/lu"

import { Link } from "react-router-dom"

export const OtpPage = () => {
  const context = useContext(MyContext)

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(true)
  }, [])

  const onChangeOtpInput = (e) => {
    let input = e.target.getAttribute("id")
    if (input !== "otp4") {
      e.target.nextSibling.focus()
    }
  }

  return (
    <>
      <div className='signUpSection bg-white' style={{ height: "100vh" }}>
        <div className='header flex items-center justify-between'>
          <div className='logo'>
            <Link to='/'>
              <img src={Logo} />
            </Link>
          </div>
          <div className='ml-auto flex items-center justify-end gap-3'>
            <Link to='/signIn'>
              <Button className='btn-border btn-round'>
                <LuArrowRightToLine /> Login
              </Button>
            </Link>
          </div>
        </div>

        <br />
        <br />
        <br />
        <div className='container signUpPage'>
          <h1 className='text-center font-weight-bold'>OTP Verification</h1>

          <h3 className='text-center mt-4'>
            OTP has been sent to +*********12
          </h3>

          <form className='form mt-4'>
            <div className='flex items-center justify-center otpBox w-[400px] m-auto pb-5 gap-4'>
              <input
                type='text'
                maxLength='1'
                onChange={onChangeOtpInput}
                id='otp1'
              />
              <input
                type='text'
                maxLength='1'
                onChange={onChangeOtpInput}
                id='otp2'
              />
              <input
                type='text'
                maxLength='1'
                onChange={onChangeOtpInput}
                id='otp3'
              />
              <input
                type='text'
                maxLength='1'
                onChange={onChangeOtpInput}
                id='otp4'
              />
            </div>

            <div className='flex items-center gap-4'>
              <Button className='btn-border btn-lg w-100 mb-3'>
                Resend OTP
              </Button>

              <Button className='btn-blue btn-lg w-100 mb-3'>
                Reset Password
              </Button>
            </div>

            <p className='text-center text'>
              Don’t want to reset? <Link to='/signIn'>Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  )
}
