// Định nghĩa các kiểu dữ liệu cho sản phẩm

export enum ProductStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  DRAFT = 2,
  OUT_OF_STOCK = 3,
  DISCONTINUED = 4,
}

import { ApiResponse } from "./auth.model"
import { BaseStatus } from "@/constant/base-status"
import { UploadFile } from "antd/lib/upload/interface"

// Interface cho dữ liệu sản phẩm từ API
export interface Product {
  id: number
  productName: string
  productPrice: string
  status: BaseStatus
  productThumb: string
  productPictures: string[]
  productVideos: string[]
  productRatingsAverage: number | null
  productVariations: Record<string, unknown>
  productDescription: string
  productSlug: string | null
  productQuantity: number
  productType: number
  subProductType: number[]
  discount: string
  productDiscountedPrice: string
  productSelled: number | null
  productAttributes: Record<string, unknown>
  profitMarginPercent: string
  averageCostPrice: string
  unitId?: number
  latestPurchasePrice?: number
  createdAt: string
  updatedAt: string
}

// Extend Product interface để tương thích với DataTable
export interface ExtendedProduct extends Product, Record<string, unknown> {}

// Interface cho phân trang
export interface PaginationResponse {
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// Using the Product interface defined above

import { AnyObject } from "./common"

// Mở rộng CreateProductRequest để chấp nhận UploadFile[] cho thumb và pictures
// và thêm các trường mới
export interface ProductFormValues
  extends Omit<CreateProductRequest, "thumb" | "pictures"> {
  thumb?: UploadFile[]
  pictures?: UploadFile[]
  unit?: string // Đơn vị tính
  subTypes?: number[] // Loại phụ sản phẩm (multiple selection)
  status?: BaseStatus // Trạng thái sản phẩm
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
  subTypes?: number[]
  discount?: string
  attributes?: Record<string, unknown>
  status?: BaseStatus
  unitId?: number
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

export interface ProductListResponse
  extends ApiResponse<{
    items: Product[]
    total: number
  }> {}

export interface ProductResponse extends ApiResponse<Product> {
  // Additional product response properties can be added here if needed
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

export interface ProductStatsResponse extends ApiResponse<ProductStats> {
  // Additional product stats response properties can be added here if needed
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
  subTypes?: number[]
  discount?: string
  status?: BaseStatus
  videos?: string[]
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
