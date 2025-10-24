import { z } from "zod"

// Schema validation cho form người dùng
export const userSchema = z.object({
  userAccount: z.string().min(1, "Tài khoản là bắt buộc"),
  userEmail: z.string().email("Email không hợp lệ").optional(),
  userState: z.number().optional(),
})

// Schema validation cho form tạo người dùng mới (bao gồm mật khẩu)
export const createUserSchema = userSchema.extend({
  userPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  userSalt: z.string().optional(),
})

// Schema validation cho form cập nhật người dùng
export const updateUserSchema = userSchema.partial()

// Types cho form data
export type UserFormData = z.infer<typeof userSchema>
export type CreateUserData = z.infer<typeof createUserSchema>
export type UpdateUserData = z.infer<typeof updateUserSchema>

// Giá trị mặc định cho form
export const defaultUserValues: UserFormData = {
  userAccount: "",
  userEmail: "",
  userState: 1, // Mặc định là hoạt động
}

// Giá trị mặc định cho form tạo người dùng
export const defaultCreateUserValues: CreateUserData = {
  userAccount: "",
  userPassword: "",
  userSalt: "",
  userEmail: "",
  userState: 1,
}
