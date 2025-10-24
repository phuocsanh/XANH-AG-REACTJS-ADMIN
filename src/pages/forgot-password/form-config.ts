import { z } from "zod"

// Schema validation cho form quên mật khẩu
export const forgotPasswordSchema = z.object({
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
        message:
          "Tài khoản phải là email hợp lệ hoặc username (3-20 ký tự, chỉ chứa chữ, số và _)",
      }
    ),
})

// Type cho form data
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// Giá trị mặc định cho form
export const defaultForgotPasswordValues: ForgotPasswordFormData = {
  userAccount: "",
}
