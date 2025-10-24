import { AnyObject } from "@/models/common"
import { ApiResponse } from "./auth.model"

// Interface cho ProductSubtype
export interface ProductSubtype extends Record<string, unknown> {
  id: number
  name: string
  description?: string
  productTypeId: number
  createdAt: string
  updatedAt: string
}

// Extend ProductSubtype interface để tương thích với DataTable
export interface ExtendedProductSubtype
  extends ProductSubtype,
    Record<string, unknown> {}

// Interface cho tạo mới ProductSubtype
export interface CreateProductSubtypeDto extends AnyObject {
  subtypeName: string
  subtypeCode: string
  productTypeId: number
  description?: string
  status?: "active" | "inactive" | "archived"
}

// Interface cho cập nhật ProductSubtype
export interface UpdateProductSubtypeDto extends AnyObject {
  subtypeName?: string
  subtypeCode?: string
  productTypeId?: number
  description?: string
  status?: "active" | "inactive" | "archived"
}

// Interface cho request tạo ProductSubtype
export interface CreateProductSubtypeRequest extends AnyObject {
  name: string
  description?: string
  productTypeId: number
}

// Interface cho request cập nhật ProductSubtype
export interface UpdateProductSubtypeRequest
  extends Partial<CreateProductSubtypeRequest>,
    AnyObject {
  id: number
}

// Interface cho response ProductSubtype
export interface ProductSubtypeResponse extends ApiResponse<ProductSubtype> {
  // Additional product subtype response properties can be added here if needed
}

// Interface cho response danh sách ProductSubtype
export interface ProductSubtypeListResponse
  extends ApiResponse<{
    items: ProductSubtype[]
    total: number
  }> {
  // Additional product subtype list response properties can be added here if needed
}
