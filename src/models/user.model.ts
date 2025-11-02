import { AnyObject } from "./common"
import { BaseStatus } from "@/constant/base-status"

// Interface cho User từ server
export interface User {
  id: number
  account: string
  login_time?: string
  logout_time?: string
  login_ip?: string
  status: BaseStatus
  created_at: string
  updated_at: string
  is_two_factor_enabled?: boolean
  deleted_at?: string
}

// Interface cho tạo user mới
export interface CreateUserDto extends AnyObject {
  account: string
  password: string
  salt: string
  login_time?: string
  logout_time?: string
  login_ip?: string
  status?: BaseStatus
  is_two_factor_enabled?: boolean
}

// Interface cho cập nhật user
export interface UpdateUserDto extends AnyObject {
  account?: string
  password?: string
  salt?: string
  login_time?: string
  logout_time?: string
  login_ip?: string
  status?: BaseStatus
  is_two_factor_enabled?: boolean
}

// Interface cho đổi mật khẩu
export interface ChangePasswordDto extends AnyObject {
  oldPassword: string
  newPassword: string
}
