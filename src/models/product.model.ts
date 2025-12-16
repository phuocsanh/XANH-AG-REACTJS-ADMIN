// Định nghĩa các kiểu dữ liệu cho sản phẩm

import { BaseStatus } from "@/constant/base-status"
import { UploadFile } from "antd/lib/upload/interface"

// Interface cho dữ liệu sản phẩm từ API
export interface Product {
  id: number
  code: string
  name: string
  price: string
  status: BaseStatus
  thumb: string
  pictures: string[]
  videos: string[]
  ratings_average: string | null
  variations: Record<string, unknown>
  description: string
  slug: string | null
  quantity: number
  type: number | { id: number; name: string }
  sub_product_type: number[]
  discount: string
  discounted_price: string
  selled: number | null
  attributes: Record<string, unknown>
  profit_margin_percent: string
  average_cost_price: string
  unit_id?: number
  unit?: { id: number; name: string }
  latest_purchase_price?: number
  created_at: string
  updated_at: string
  // Thêm 2 trường mới
  symbol_id?: number
  symbol?: { id: number; name: string }
  ingredient: string[]
  // Thêm 2 trường mới từ server
  suggested_price?: string
  credit_price?: string // Giá bán nợ
  notes?: string // Ghi chú về sản phẩm
}

// Extend Product interface để tương thích với DataTable
export interface ExtendedProduct extends Product, Record<string, unknown> {}

// Using the Product interface defined above

import { AnyObject } from "./common"

// Mở rộng CreateProductRequest để chấp nhận UploadFile[] cho thumb và pictures
// và thêm các trường mới
export interface ProductFormValues
  extends Omit<CreateProductRequest, "thumb" | "pictures"> {
  thumb?: UploadFile[]
  pictures?: UploadFile[]
  unit?: string // Đơn vị tính
  sub_types?: number[] // Loại phụ sản phẩm (multiple selection)
  status?: BaseStatus // Trạng thái sản phẩm
  // Thêm 2 trường mới
  symbol_id?: number
  ingredient?: string
  credit_price?: string // Giá bán nợ
  notes?: string // Ghi chú
}

export interface CreateProductRequest extends AnyObject {
  name: string
  price: string
  type: number
  thumb: string
  pictures?: string[]
  videos?: string[]
  description: string
  quantity: number
  sub_product_type?: number[]
  discount?: string
  attributes?: Record<string, unknown>
  status?: BaseStatus
  unit_id?: number
  // Thêm 2 trường mới
  symbol_id?: number
  ingredient?: string[]
  credit_price?: string // Giá bán nợ
  notes?: string // Ghi chú
}

export interface UpdateProductRequest
  extends Partial<CreateProductRequest>,
    AnyObject {
  id: number
}

export interface ProductListParams {
  limit?: number
  offset?: number
  type?: number
  subType?: number
}

export interface ExtendedProductListParams extends ProductListParams {
  search?: string
  categoryId?: number
  subCategoryId?: number
  featured?: boolean
}

// Product Stats interface
export interface ProductStats {
  totalProducts: number
  totalProductTypes: number
  totalProductSubtypes: number
  publishedProducts: number
  draftProducts: number
  averagePrice: number
  totalValue: number
}

// Interface cho converted values
export interface ConvertedProductValues {
  [key: string]: unknown
  name: string
  price: string
  type: number
  quantity: number
  description: string
  thumb: string
  pictures: string[]
  attributes: Record<string, unknown>
  unit?: string
  sub_types?: number[]
  discount?: string
  status?: BaseStatus
  videos?: string[]
  // Thêm 2 trường mới
  symbol_id?: number
  ingredient?: string[]
  credit_price?: string // Giá bán nợ
  notes?: string // Ghi chú
}

export interface ProductFormProps {
  isEdit?: boolean
  productId?: string
}

export interface ProductApiResponseWithItem {
  code: number
  message: string
  data: Product | { item: Product }
}
