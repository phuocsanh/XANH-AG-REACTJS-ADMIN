import { z } from "zod"

// Schema validation cho form loại phụ sản phẩm
export const productSubtypeSchema = z.object({
  name: z.string().min(1, "Tên loại phụ sản phẩm là bắt buộc"),
  code: z.string().min(1, "Mã loại phụ sản phẩm là bắt buộc"),
  product_type_id: z
    .number({
      invalid_type_error: "Loại sản phẩm là bắt buộc",
      required_error: "Loại sản phẩm là bắt buộc",
    })
    .min(1, "Loại sản phẩm là bắt buộc")
    .optional(), // Cho phép undefined/null khi chưa chọn
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
})

// Type cho form data
export type ProductSubtypeFormData = z.infer<typeof productSubtypeSchema>

// Giá trị mặc định cho form
export const defaultProductSubtypeValues: ProductSubtypeFormData = {
  name: "",
  code: "",
  product_type_id: undefined, // Không có giá trị mặc định khi chưa chọn
  description: "",
  status: "active",
}
