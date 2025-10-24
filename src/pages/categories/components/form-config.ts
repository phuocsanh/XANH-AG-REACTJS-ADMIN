import { z } from "zod"
import { Status } from "../../../models/common"

// Schema cho ProductType theo cấu trúc backend
export const productTypeSchema = z.object({
  typeName: z.string().min(1, "Tên loại sản phẩm không được để trống!").trim(),
  typeCode: z.string().min(1, "Mã loại sản phẩm không được để trống!").trim(),
  description: z.string().optional(),
  status: z.nativeEnum(Status).default(Status.ACTIVE),
})

// Type cho form data
export type ProductTypeFormData = z.infer<typeof productTypeSchema>

// Giá trị mặc định cho form
export const defaultProductTypeValues: ProductTypeFormData = {
  typeName: "",
  typeCode: "",
  description: "",
  status: Status.ACTIVE,
}
