import { useContext, useEffect } from "react"
import { MyContext } from "../../App"
import Logo from "../../assets/images/logo.png"
import Button from "@mui/material/Button"
import { LuArrowRightToLine } from "react-icons/lu"
import { FaRegUser } from "react-icons/fa6"

import { Link } from "react-router-dom"

export const ForgotPassword = () => {
  const context = useContext(MyContext)

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(true)
  }, [])

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

          <form className='form mt-5'>
            <div className='col_ lg'>
              <h4>Full Name</h4>
              <div className='form-group'>
                <input
                  type='text'
                  className='input lg'
                  placeholder='Enter Your Full Name'
                />
              </div>
            </div>

            <Button className='btn-blue btn-lg w-100 mb-3'>
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
