// Định nghĩa các kiểu dữ liệu cho xác thực

import { z } from "zod"

// Schema cho API payload (snake_case như server expect) - theo pattern của example
export const loginApiPayloadSchema = z.object({
  user_account: z
    .string()
    .min(1, "Tài khoản không được để trống")
    .trim()
    .refine(
      (value) => {
        // Kiểm tra định dạng email hoặc username
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
        return emailRegex.test(value) || usernameRegex.test(value)
      },
      {
        message:
          "Tài khoản phải là email hợp lệ hoặc username (3-20 ký tự, chỉ chứa chữ, số và _)",
      }
    ),
  user_password: z
    .string()
    .min(1, "Mật khẩu không được để trống")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(50, "Mật khẩu không được quá 50 ký tự")
    .trim(),
})

// Type được infer từ schema - theo pattern của example
export type LoginApiPayload = z.infer<typeof loginApiPayloadSchema>

// Schema cho đăng ký người dùng
export const registerApiPayloadSchema = z.object({
  user_account: z
    .string()
    .min(1, "Tài khoản không được để trống")
    .trim()
    .refine(
      (value) => {
        // Kiểm tra định dạng email hoặc username
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
        return emailRegex.test(value) || usernameRegex.test(value)
      },
      {
        message:
          "Tài khoản phải là email hợp lệ hoặc username (3-20 ký tự, chỉ chứa chữ, số và _)",
      }
    ),
  user_password: z
    .string()
    .min(1, "Mật khẩu không được để trống")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(50, "Mật khẩu không được quá 50 ký tự")
    .trim(),
  user_salt: z.string().optional(), // Salt sẽ được tạo tự động ở server
  user_email: z.string().email("Email không hợp lệ").optional(),
  user_state: z.number().optional(),
})

// Schema cho đổi mật khẩu
export const changePasswordApiPayloadSchema = z.object({
  old_password: z.string().min(1, "Mật khẩu cũ không được để trống").trim(),
  new_password: z
    .string()
    .min(1, "Mật khẩu mới không được để trống")
    .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
    .max(50, "Mật khẩu mới không được quá 50 ký tự")
    .trim(),
})

// Types được infer từ schema
export type RegisterApiPayload = z.infer<typeof registerApiPayloadSchema>
export type ChangePasswordApiPayload = z.infer<
  typeof changePasswordApiPayloadSchema
>

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user_id: number
}

// Response user từ server NestJS
export interface UserResponse {
  user_id: number
  user_account: string
}

// Response từ API login thành công từ server NestJS
export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: UserResponse
}

// Cập nhật lại interface cho response mới từ server
export interface LoginApiResponse {
  success: boolean
  data: LoginResponse
  meta: {
    timestamp: string
    path: string
    method: string
  }
}

// Response từ API khi có lỗi
export interface ErrorResponse {
  code: number
  message: string
  details?: unknown
}

export interface RefreshTokenRequest {
  [key: string]: unknown
  refresh_token: string
}

// Định dạng response chung từ server
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp?: string
  path?: string
}
