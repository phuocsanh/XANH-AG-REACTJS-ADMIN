// Định nghĩa các kiểu dữ liệu cho sản phẩm
import { ApiResponse } from "./auth.model"

export interface Product {
  id: number
  name: string
  price: string
  type: number
  thumb: string
  pictures: string[]
  videos: string[]
  description: string
  quantity: number
  subTypes: number[]
  discount: string
  attributes: Record<string, unknown>
  isDraft: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

// API Response interface - matches the actual API response structure
export interface ProductApiResponse {
  id: number
  productName: string
  productPrice: string
  productStatus: number
  productThumb: string
  productPictures: string[]
  productVideos: string[]
  productRatingsAverage: number | null
  productVariations: unknown
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

// Mapper function to convert API response to Product model
export const mapApiResponseToProduct = (
  apiProduct: ProductApiResponse
): Product => {
  return {
    id: apiProduct.id,
    name: apiProduct.productName,
    price: apiProduct.productPrice,
    type: apiProduct.productType,
    thumb: apiProduct.productThumb,
    pictures: apiProduct.productPictures,
    videos: apiProduct.productVideos,
    description: apiProduct.productDescription,
    quantity: apiProduct.productQuantity,
    subTypes: apiProduct.subProductType,
    discount: apiProduct.discount,
    attributes: apiProduct.productAttributes,
    isDraft: apiProduct.isDraft,
    isPublished: apiProduct.isPublished,
    createdAt: apiProduct.createdAt,
    updatedAt: apiProduct.updatedAt,
  }
}

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

// Product Type interfaces
export interface ProductType {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
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
