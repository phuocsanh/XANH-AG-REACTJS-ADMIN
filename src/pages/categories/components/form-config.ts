import { z } from "zod"
import { Status } from "../../../models/common"

// Schema cho ProductType theo cấu trúc backend
export const productTypeSchema = z.object({
  name: z.string().min(1, "Tên loại sản phẩm không được để trống!").trim(),
  code: z.string().optional(), // Backend tự động generate code nếu không cung cấp
  description: z.string().optional(),
  status: z.nativeEnum(Status).default(Status.ACTIVE),
})

// Type cho form data
export type ProductTypeFormData = z.infer<typeof productTypeSchema>

// Giá trị mặc định cho form
export const defaultProductTypeValues: ProductTypeFormData = {
  name: "",
  code: "",
  description: "",
  status: Status.ACTIVE,
}
