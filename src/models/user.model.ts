import { AnyObject } from "./common"

// Interface cho User từ server
export interface User {
  userId: number
  userAccount: string
  userEmail?: string
  userState?: number
  createdAt?: string
  updatedAt?: string
}

// Interface cho tạo user mới
export interface CreateUserDto extends AnyObject {
  userAccount: string
  userPassword: string
  userSalt: string
  userEmail?: string
  userState?: number
}

// Interface cho cập nhật user
export interface UpdateUserDto extends AnyObject {
  userAccount?: string
  userPassword?: string
  userSalt?: string
  userEmail?: string
  userState?: number
}

// Interface cho đổi mật khẩu
export interface ChangePasswordDto extends AnyObject {
  oldPassword: string
  newPassword: string
}
