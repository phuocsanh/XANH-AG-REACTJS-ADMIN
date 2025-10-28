import { AnyObject } from "./common"
import { BaseStatus } from "@/constant/base-status"

// Interface cho User từ server
export interface User {
  id: number
  account: string
  loginTime?: string
  logoutTime?: string
  loginIp?: string
  status: BaseStatus
  createdAt: string
  updatedAt: string
  isTwoFactorEnabled?: boolean
  deletedAt?: string
}

// Interface cho tạo user mới
export interface CreateUserDto extends AnyObject {
  account: string
  password: string
  salt: string
  loginTime?: string
  logoutTime?: string
  loginIp?: string
  status?: BaseStatus
  isTwoFactorEnabled?: boolean
}

// Interface cho cập nhật user
export interface UpdateUserDto extends AnyObject {
  account?: string
  password?: string
  salt?: string
  loginTime?: string
  logoutTime?: string
  loginIp?: string
  status?: BaseStatus
  isTwoFactorEnabled?: boolean
}

// Interface cho đổi mật khẩu
export interface ChangePasswordDto extends AnyObject {
  oldPassword: string
  newPassword: string
}
