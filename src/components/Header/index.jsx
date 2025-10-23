import { useState } from "react"
import Button from "@mui/material/Button"
import { FaRegBell } from "react-icons/fa"
import { MdOutlineEmail } from "react-icons/md"

import { UserImage } from "../user-image"

import Avatar from "@mui/material/Avatar"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import Divider from "@mui/material/Divider"
import PersonAdd from "@mui/icons-material/PersonAdd"
import Settings from "@mui/icons-material/Settings"
import Logout from "@mui/icons-material/Logout"
import { useAppStore } from "@/stores"

export const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    // Logout logic here
    handleClose()
    useAppStore.setState({ accessToken: undefined, isLogin: false })
  }

  return (
    <header className='fixed top-0 right-0 bg-white py-3 z-[100] flex items-center justify-between px-4'>
      {/* <SearchBox /> */}
      <div className='ml-auto part2'>
        <ul className='flex items-center gap-3'>
          <li>
            <Button>
              <FaRegBell />
            </Button>
          </li>
          <li>
            <Button>
              <MdOutlineEmail />
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
              <MenuItem onClick={handleClose}>
                <Avatar /> Profile
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <Avatar /> My account
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <PersonAdd fontSize='small' />
                </ListItemIcon>
                Add another account
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <Settings fontSize='small' />
                </ListItemIcon>
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize='small' />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </li>
        </ul>
      </div>
    </header>
  )
}
