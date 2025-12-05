import { z } from "zod"

// Schema validation cho form người dùng
export const userSchema = z.object({
  account: z.string().min(1, "Tài khoản là bắt buộc"),
  email: z.string().email("Email không hợp lệ").optional(),
  status: z.number().optional(),
})

// Schema validation cho form tạo người dùng mới (bao gồm mật khẩu)
export const createUserSchema = userSchema.extend({
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  salt: z.string().optional(),
})

// Schema validation cho form cập nhật người dùng
export const updateUserSchema = userSchema.partial()

// Types cho form data
export type UserFormData = z.infer<typeof userSchema>
export type CreateUserData = z.infer<typeof createUserSchema>
export type UpdateUserData = z.infer<typeof updateUserSchema>

// Giá trị mặc định cho form
export const defaultUserValues: UserFormData = {
  account: "",
  email: "",
  status: 1, // Mặc định là hoạt động
}

// Giá trị mặc định cho form tạo người dùng
export const defaultCreateUserValues: CreateUserData = {
  account: "",
  password: "",
  salt: "",
  email: "",
  status: 1,
}
