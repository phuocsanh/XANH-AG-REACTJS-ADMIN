// Định nghĩa các kiểu dữ liệu cho loại sản phẩm
import { ApiResponse } from "./auth.model"
import { PaginationData, PaginationResponse } from "./pagination"
import { AnyObject } from "./common"
import { ProductSubtype } from "./product-subtype.model"
import { BaseStatus } from "@/constant/base-status"

export interface ProductType {
  id: number
  name: string
  code: string
  description: string
  status: BaseStatus
  created_at: string
  updated_at: string
  deleted_at?: string
}

// Extend ProductType interface để tương thích với DataTable
export interface ExtendedProductType
  extends ProductType,
    Record<string, unknown> {}

// Extend ProductSubtype interface để tương thích với DataTable
export interface ExtendedProductSubtype
  extends ProductSubtype,
    Record<string, unknown> {}

export interface ProductTypeRequest {
  [key: string]: unknown
  name: string
  code: string
  description?: string
  status?: BaseStatus
}

export interface ProductSubtypeRequest {
  [key: string]: unknown
  name: string
  description?: string
  productTypeId: number
}

export interface ProductSubtypeMappingRequest {
  [key: string]: unknown
  typeId: number
  subtypeId: number
}

export interface CreateProductTypeRequest extends AnyObject {
  name: string
  code: string
  description?: string
  status?: BaseStatus
}

export interface UpdateProductTypeRequest
  extends Partial<CreateProductTypeRequest>,
    AnyObject {
  id: number
}

export interface ProductTypeResponse extends ApiResponse<ProductType> {}

export interface ProductTypesListResponse
  extends PaginationResponse<ProductType> {}

export type ProductTypeListData = PaginationData<ProductType>

export interface ProductTypeListResponse
  extends ApiResponse<{
    items: ProductType[]
    total: number
  }> {
  // Additional product type list response properties can be added here if needed
}

export interface CreateProductSubtypeRequest extends AnyObject {
  name: string
  description?: string
  productTypeId: number
}

export interface UpdateProductSubtypeRequest
  extends Partial<CreateProductSubtypeRequest>,
    AnyObject {
  id: number
}

export interface ProductSubtypeResponse extends ApiResponse<ProductSubtype> {
  // Additional product subtype response properties can be added here if needed
}

export interface ProductSubtypeListResponse
  extends ApiResponse<{
    items: ProductSubtype[]
    total: number
  }> {
  // Additional product subtype list response properties can be added here if needed
}
