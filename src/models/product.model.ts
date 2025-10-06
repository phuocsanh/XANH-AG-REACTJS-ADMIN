// Định nghĩa các kiểu dữ liệu cho sản phẩm

export enum ProductStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  DRAFT = 2,
  OUT_OF_STOCK = 3,
  DISCONTINUED = 4,
}

import { ApiResponse } from "./auth.model"
import { ProductType } from "./product-type.model"

// Interface cho dữ liệu sản phẩm từ API
export interface ProductApiResponse {
  id: number
  productName: string
  productPrice: string
  productStatus: number
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
  isDraft: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

// Interface cho dữ liệu sản phẩm - sử dụng tên trường giống API response
export interface Product {
  id: number
  productName: string
  productPrice: string
  productStatus: number
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
  isDraft: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

// Interface cho phân trang
export interface PaginationResponse {
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// Interface cho response từ API
export interface ProductApiResponseData {
  items: ProductApiResponse[]
  pagination: PaginationResponse
}

// Using the ProductApiResponse interface defined above

export interface CreateProductRequest {
  [key: string]: unknown // Index signature để tương thích với api.post
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
  isDraft?: boolean
  isPublished?: boolean
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
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
    items: ProductApiResponse[]
    total: number
  }> {}

export interface ProductResponse extends ApiResponse<Product> {
  // Additional product response properties can be added here if needed
}

export interface CreateProductTypeRequest {
  [key: string]: unknown
  name: string
  description?: string
}

export interface UpdateProductTypeRequest
  extends Partial<CreateProductTypeRequest> {
  id: number
}

export type ProductTypeResponse = ApiResponse<ProductType>

export interface ProductTypeListResponse
  extends ApiResponse<{
    items: ProductType[]
    total: number
  }> {
  // Additional product type list response properties can be added here if needed
}

export interface ProductSubtype {
  id: number
  name: string
  description?: string
  productTypeId: number
  createdAt: string
  updatedAt: string
}

export interface CreateProductSubtypeRequest {
  [key: string]: unknown
  name: string
  description?: string
  productTypeId: number
}

export interface UpdateProductSubtypeRequest
  extends Partial<CreateProductSubtypeRequest> {
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
