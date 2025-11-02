import { UseFormProps } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  registerApiPayloadSchema,
  RegisterApiPayload,
} from "@/models/auth.model"

// Sử dụng schema từ auth.model để đảm bảo tính nhất quán
export type FormField = RegisterApiPayload

// Cấu hình form với zodResolver
const formConfig: UseFormProps<FormField> = {
  resolver: zodResolver(registerApiPayloadSchema),
  defaultValues: {
    user_account: "",
    user_password: "",
    // Loại bỏ user_email vì email là tùy chọn và không cần thiết trong form đơn giản
  },
}

export default formConfig
