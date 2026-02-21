import { z } from "zod"
import { UploadFile } from "antd/lib/upload/interface"

// Schema validation cho form sản phẩm
export const productFormSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được để trống"),
  trade_name: z.string().min(1, "Hiệu thuốc không được để trống"),
  volume: z.string().optional(), // Dung tích/Khối lượng
  price: z.string()
    .min(1, "Giá bán tiền mặt không được để trống")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Giá bán tiền mặt phải là số >= 0"
    }),
  credit_price: z.string()
    .min(1, "Giá bán nợ không được để trống")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Giá bán nợ phải là số >= 0"
    }),
  tax_selling_price: z.string()
    .min(1, "GBKT không được để trống")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "GBKT phải là số >= 0"
    }),
  type: z.number().min(1, "Vui lòng chọn loại sản phẩm"),
  quantity: z.coerce.number().min(0, "Số lượng không hợp lệ"),
  discount: z.string().optional(),
  description: z.string().optional(),
  thumb: z.array(z.any()).optional(),
  pictures: z.array(z.any()).optional(),
  videos: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  unit_id: z.number().min(1, "Vui lòng chọn đơn vị tính"), // Bắt buộc nhập
  sub_types: z.array(z.number()).optional(),
  status: z.enum(["active", "inactive", "archived", "pending"]).optional(),
  // Thêm 2 trường mới
  symbol_id: z.number().optional(),
  ingredient: z.string().min(1, "Vui lòng nhập thành phần nguyên liệu"), // Bắt buộc nhập
  notes: z.string().optional(), // Ghi chú (tùy chọn)
  // Thêm 2 trường mới từ server
  profit_margin_percent: z.string().optional(), // Không bắt buộc
  average_cost_price: z.string().optional(), // Không bắt buộc
  has_input_invoice: z.boolean().default(true), // Bắt buộc nhập, mặc định là có hóa đơn
  taxable_quantity_stock: z.coerce.number().optional(), // Số lượng tồn khai thuế
  is_sold_on_web: z.boolean().default(false),
  show_price_on_web: z.boolean().default(true),
  // Trường cho danh sách thuộc tính động trên FE
  attribute_list: z.array(z.object({
    key: z.string(),
    value: z.any()
  })).optional(),
  unit_conversions: z.array(z.object({
    id: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number().optional()),
    unit_id: z.number().min(1, "Vui lòng chọn đơn vị"),
    conversion_factor: z.coerce.number().min(0, "Hệ số không hợp lệ"),
    is_base_unit: z.boolean().default(false),
    is_purchase_unit: z.boolean().default(false),
    is_sales_unit: z.boolean().default(false),
    sort_order: z.number().optional(),
    notes: z.string().optional(),
  })).optional(),
  components: z.array(z.object({
    id: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number().optional()),
    componentProductId: z.number().min(1, "Vui lòng chọn nguyên liệu"),
    quantity: z.coerce.number().min(0.0001, "Số lượng phải lớn hơn 0"),
    unitId: z.number().optional(),
  })).optional(),
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
  trade_name: string // Hiệu thuốc / Tên thương mại
  volume?: string // Dung tích/Khối lượng
  price: string // Giữ nguyên là string
  credit_price?: string // Giá bán nợ
  type: number | undefined
  quantity: number
  discount?: string
  description?: string
  thumb?: UploadFile[]
  pictures?: UploadFile[]
  videos?: string[]
  attributes?: Record<string, unknown>
  unit_id: number | undefined // Bắt buộc nhập (validation sẽ kiểm tra)
  sub_types?: number[]
  status?: "active" | "inactive" | "archived" | "pending"
  // Thêm 2 trường mới
  symbol_id?: number
  ingredient: string // Bắt buộc nhập
  notes?: string // Ghi chú
  // Thêm 2 trường mới từ server
  profit_margin_percent: string
  average_cost_price: string
  has_input_invoice: boolean // Trạng thái hóa đơn đầu vào
  tax_selling_price: string // Giá bán khai thuế
  taxable_quantity_stock?: number // Số lượng tồn khai thuế
  is_sold_on_web?: boolean
  show_price_on_web?: boolean
  attribute_list?: { key: string; value: any }[]
  unit_conversions?: any[]
  components?: {
    id?: number
    componentProductId: number
    quantity: number
    unitId?: number
    componentProduct?: any
  }[]
}

// Interface cho ConvertedProductValues (phù hợp với cấu trúc hiện tại)
export interface ConvertedProductValues {
  [key: string]: unknown
  name: string
  trade_name: string // Hiệu thuốc / Tên thương mại
  volume?: string // Dung tích/Khối lượng
  price: string // Giữ nguyên là string
  credit_price?: string // Giá bán nợ
  type: number
  quantity: number
  description: string
  thumb: string
  pictures: string[]
  attributes: Record<string, unknown>
  unit_id: number | undefined // Bắt buộc nhập
  sub_types?: number[]
  discount?: string
  status?: "active" | "inactive" | "archived" | "pending"
  videos?: string[]
  // Thêm 2 trường mới
  symbol_id?: number
  ingredient: string[] // Chuyển thành mảng khi gửi lên server
  notes?: string // Ghi chú
  // Thêm 2 trường mới từ server
  profit_margin_percent: string
  average_cost_price: string
  has_input_invoice: boolean // Trạng thái hóa đơn đầu vào
  tax_selling_price: string // Giá bán khai thuế
  taxable_quantity_stock?: number // Số lượng tồn khai thuế
  suggested_price?: string
  unit_conversions?: any[]
  components?: any[]
}

// Giá trị mặc định cho form
export const defaultProductFormValues: ProductFormValues = {
  name: "",
  trade_name: "", // Hiệu thuốc mặc định
  volume: "", // Dung tích mặc định
  price: "0", // Giá bán tiền mặt mặc định là 0
  credit_price: "0", // Giá bán nợ mặc định là 0
  type: undefined,
  quantity: 0,
  discount: "0",
  description: "",
  unit_id: undefined, // Bắt buộc nhập
  status: "active",
  ingredient: "", // Bắt buộc nhập
  notes: "", // Ghi chú
  profit_margin_percent: "", // Thêm trường mới
  average_cost_price: "", // Thêm trường mới
  has_input_invoice: true, // Mặc định là có hóa đơn
  tax_selling_price: "0", // Giá khai thuế mặc định là 0
  taxable_quantity_stock: 0, // Mặc định là 0
  is_sold_on_web: false,
  show_price_on_web: true,
  unit_conversions: [],
  components: [],
}
