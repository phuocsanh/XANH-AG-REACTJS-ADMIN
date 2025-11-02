import { UseFormProps } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginApiPayloadSchema, LoginApiPayload } from "@/models/auth.model"

// Sử dụng schema từ auth.model để đảm bảo tính nhất quán - theo pattern của example
export type FormField = LoginApiPayload

// Cấu hình form với zodResolver
const formConfig: UseFormProps<FormField> = {
  resolver: zodResolver(loginApiPayloadSchema),
  defaultValues: {
    user_account: "",
    user_password: "",
  },
}

export default formConfig
