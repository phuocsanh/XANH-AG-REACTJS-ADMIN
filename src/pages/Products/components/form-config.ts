import { z } from "zod"
import { UploadFile } from "antd/lib/upload/interface"

// Schema validation cho form sản phẩm
export const productFormSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được để trống"),
  price: z.string().min(1, "Giá bán không được để trống"), // Giữ nguyên là string
  type: z.number().min(1, "Vui lòng chọn loại sản phẩm"),
  quantity: z.number().min(0, "Số lượng không hợp lệ"),
  discount: z.string().optional(),
  description: z.string().optional(),
  thumb: z.array(z.any()).optional(),
  pictures: z.array(z.any()).optional(),
  videos: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  unit_id: z.number().optional(), // Bắt buộc nhập
  sub_types: z.array(z.number()).optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  // Thêm 2 trường mới
  symbol_id: z.number().optional(),
  ingredient: z.string().min(1, "Vui lòng nhập thành phần nguyên liệu"), // Bắt buộc nhập
  // Thêm 2 trường mới từ server
  profit_margin_percent: z
    .string()
    .min(1, "Vui lòng nhập phần trăm lợi nhuận mong muốn"),
  average_cost_price: z.string().min(1, "Vui lòng nhập giá vốn trung bình"),
})

// Schema validation cho form tạo sản phẩm mới (yêu cầu thêm một số trường bắt buộc)
export const createProductFormSchema = productFormSchema

// Schema validation cho form cập nhật sản phẩm
export const updateProductFormSchema = productFormSchema.partial()

// Types cho form data
export type ProductFormData = z.infer<typeof productFormSchema>
export type CreateProductFormData = z.infer<typeof createProductFormSchema>
export type UpdateProductFormData = z.infer<typeof updateProductFormSchema>

// Interface cho ProductFormValues (phù hợp với cấu trúc hiện tại)
export interface ProductFormValues {
  name: string
  price: string // Giữ nguyên là string
  type: number | undefined
  quantity: number
  discount?: string
  description?: string
  thumb?: UploadFile[]
  pictures?: UploadFile[]
  videos?: string[]
  attributes?: Record<string, unknown>
  unit_id: number | undefined // Bắt buộc nhập
  sub_types?: number[]
  status?: "active" | "inactive" | "archived"
  // Thêm 2 trường mới
  symbol_id?: number
  ingredient: string // Bắt buộc nhập
  // Thêm 2 trường mới từ server
  profit_margin_percent: string
  average_cost_price: string
}

// Interface cho ConvertedProductValues (phù hợp với cấu trúc hiện tại)
export interface ConvertedProductValues {
  [key: string]: unknown
  name: string
  price: string // Giữ nguyên là string
  type: number
  quantity: number
  description: string
  thumb: string
  pictures: string[]
  attributes: Record<string, unknown>
  unit_id: number | undefined // Bắt buộc nhập
  sub_types?: number[]
  discount?: string
  status?: "active" | "inactive" | "archived"
  videos?: string[]
  // Thêm 2 trường mới
  symbol_id?: number
  ingredient: string[] // Chuyển thành mảng khi gửi lên server
  // Thêm 2 trường mới từ server
  profit_margin_percent: string
  average_cost_price: string
  suggested_price?: string
}

// Giá trị mặc định cho form
export const defaultProductFormValues: ProductFormValues = {
  name: "",
  price: "", // Giữ nguyên là string
  type: undefined,
  quantity: 0,
  discount: "0",
  description: "",
  unit_id: undefined, // Bắt buộc nhập
  status: "active",
  ingredient: "", // Bắt buộc nhập
  profit_margin_percent: "", // Thêm trường mới
  average_cost_price: "", // Thêm trường mới
  // Các trường optional khác sẽ là undefined theo mặc định
}
