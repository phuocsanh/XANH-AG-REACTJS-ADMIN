import React, { useState, useContext } from "react"
import Button from "@mui/material/Button"
import { FaRegBell } from "react-icons/fa"
import { MdOutlineEmail } from "react-icons/md"
import { FiMenu } from "react-icons/fi"
import { useNavigate } from "react-router-dom"

import { UserImage } from "../user-image"

import Avatar from "@mui/material/Avatar"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import Divider from "@mui/material/Divider"
import PersonAdd from "@mui/icons-material/PersonAdd"
import Settings from "@mui/icons-material/Settings"
import Logout from "@mui/icons-material/Logout"
import Login from "@mui/icons-material/Login"
import { useAppStore } from "../../stores"
import { MyContext } from "../../App"

export const Header: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const { setIsSidebarOpen } = useContext(MyContext)
  const navigate = useNavigate()
  const isLogin = useAppStore((state) => state.isLogin)

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = (): void => {
    setAnchorEl(null)
  }

  const handleLogin = (): void => {
    handleClose()
    navigate('/sign-in')
  }

  const handleLogout = (): void => {
    // Logout logic here
    handleClose()
    useAppStore.setState({ accessToken: undefined, isLogin: false })
  }

  const toggleMobileSidebar = (): void => {
    // Chỉ mở mobile sidebar, không ẩn header
    const event = new CustomEvent("toggleMobileSidebar")
    window.dispatchEvent(event)
  }

  const toggleDesktopSidebar = (): void => {
    // Toggle sidebar trên desktop
    setIsSidebarOpen((prev) => !prev)
  }

  return (
    <header className='w-full fixed top-0 right-0 py-3 z-[100] flex items-center justify-between px-4 shadow-sm' style={{background: 'linear-gradient(180deg, #059669 0%, #047857 100%)'}}>
      {/* Mobile menu button */}
      <div className='md:hidden'>
        <Button onClick={toggleMobileSidebar}>
          <FiMenu className='text-xl text-white' />
        </Button>
      </div>

      {/* Desktop sidebar toggle button */}
      <div className='hidden md:block'>
        <Button onClick={toggleDesktopSidebar}>
          <FiMenu className='text-xl text-white' />
        </Button>
      </div>

      <div className='ml-auto part2'>
        <ul className='flex items-center gap-3'>
          <li>
            <Button 
              style={{background: 'white'}}
              className='!border-2 !border-white !rounded-full'
            >
              <FaRegBell className='text-green-700' />
            </Button>
          </li>
          <li>
            <Button 
              style={{background: 'white'}}
              className='!border-2 !border-white !rounded-full'
            >
              <MdOutlineEmail className='text-green-700' />
            </Button>
          </li>

          <li>
            <div className='myAcc' onClick={handleClick}>
              <UserImage />
            </div>

            <Menu
              anchorEl={anchorEl}
              id='account-menu'
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: "visible",
                  filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                  mt: 1.5,
                  "& .MuiAvatar-root": {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  "&::before": {
                    content: '""',
                    display: "block",
                    position: "absolute",
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) rotate(45deg)",
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              {/* Chỉ hiển thị khi đã đăng nhập */}
              {isLogin && [
                <MenuItem key="account" onClick={handleClose}>
                  <Avatar /> My account
                </MenuItem>,
                <Divider key="divider" />,
                <MenuItem key="add" onClick={handleClose}>
                  <ListItemIcon>
                    <PersonAdd fontSize='small' />
                  </ListItemIcon>
                  Add another account
                </MenuItem>,
                <MenuItem key="settings" onClick={handleClose}>
                  <ListItemIcon>
                    <Settings fontSize='small' />
                  </ListItemIcon>
                  Settings
                </MenuItem>,
                <MenuItem key="logout" onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize='small' />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              ]}

              {/* Chỉ hiển thị khi chưa đăng nhập */}
              {!isLogin && (
                <MenuItem onClick={handleLogin}>
                  <ListItemIcon>
                    <Login fontSize='small' />
                  </ListItemIcon>
                  Login
                </MenuItem>
              )}
            </Menu>
          </li>
        </ul>
      </div>
    </header>
  )
}
