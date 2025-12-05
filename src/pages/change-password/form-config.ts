import { z } from "zod"
import { changePasswordApiPayloadSchema } from "@/models/auth.model"

// Extend schema với trường confirm_password để validate trên UI
export const changePasswordFormSchema = changePasswordApiPayloadSchema
  .extend({
    confirm_password: z
      .string()
      .min(1, "Vui lòng xác nhận mật khẩu mới")
      .trim(),
  })
  .refine((data) => data.new_password !== data.old_password, {
    message: "Mật khẩu mới phải khác mật khẩu hiện tại",
    path: ["new_password"],
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirm_password"],
  })

// Type cho form data
export type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>

// Default values cho form
export const defaultChangePasswordValues: ChangePasswordFormData = {
  old_password: "",
  new_password: "",
  confirm_password: "",
}
