// Định nghĩa các kiểu dữ liệu cho xác thực

import { z } from "zod"

// Schema cho API payload (camelCase như server expect) - theo pattern của example
export const loginApiPayloadSchema = z.object({
  userAccount: z
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
        message: "Tài khoản phải là email hợp lệ hoặc username (3-20 ký tự, chỉ chứa chữ, số và _)"
      }
    ),
  userPassword: z
    .string()
    .min(1, "Mật khẩu không được để trống")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(50, "Mật khẩu không được quá 50 ký tự")
    .trim()
})

// Type được infer từ schema - theo pattern của example
export type LoginApiPayload = z.infer<typeof loginApiPayloadSchema>

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  userId: number
}

export interface UserResponse {
  id: number
  account: string
  email: string
}

// Response từ API login thành công
export interface LoginResponse {
  user: UserResponse
  tokens: TokenResponse
  isSuccessful: boolean
  errorMessage: string
}

// Response từ API khi có lỗi
export interface ErrorResponse {
  code: number
  message: string
  details?: unknown
}

export interface RefreshTokenRequest {
  [key: string]: unknown
  refreshToken: string
}

// Định dạng response chung từ server
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp?: string
  path?: string
}
