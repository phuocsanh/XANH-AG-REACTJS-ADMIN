// Định nghĩa các kiểu dữ liệu cho sản phẩm
import { ApiResponse } from './auth.model';

export interface Product {
  id: number;
  name: string;
  price: string;
  type: number;
  thumb: string;
  pictures: string[];
  videos: string[];
  description: string;
  quantity: number;
  subTypes: number[];
  discount: string;
  attributes: Record<string, any>;
  isDraft: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  price: string;
  type: number;
  thumb: string;
  pictures?: string[];
  videos?: string[];
  description: string;
  quantity: number;
  subTypes?: number[];
  discount?: string;
  attributes?: Record<string, any>;
  isDraft?: boolean;
  isPublished?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number;
}

export interface ProductListParams {
  limit?: number;
  offset?: number;
  type?: number;
  subType?: number;
}

export interface ProductListResponse extends ApiResponse<{
  items: Product[];
  total: number;
}> {}

export interface ProductResponse extends ApiResponse<Product> {}

// Product Type interfaces
export interface ProductType {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductTypeRequest {
  name: string;
  description?: string;
}

export interface UpdateProductTypeRequest extends Partial<CreateProductTypeRequest> {
  id: number;
}

export interface ProductTypeResponse extends ApiResponse<ProductType> {}

export interface ProductTypeListResponse extends ApiResponse<{
  items: ProductType[];
  total: number;
}> {}

// Product Subtype interfaces
export interface ProductSubtype {
  id: number;
  name: string;
  description?: string;
  productTypeId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductSubtypeRequest {
  name: string;
  description?: string;
  productTypeId: number;
}

export interface UpdateProductSubtypeRequest extends Partial<CreateProductSubtypeRequest> {
  id: number;
}

export interface ProductSubtypeResponse extends ApiResponse<ProductSubtype> {}

export interface ProductSubtypeListResponse extends ApiResponse<{
  items: ProductSubtype[];
  total: number;
}> {}

// Product Stats interface
export interface ProductStats {
  totalProducts: number;
  totalProductTypes: number;
  totalProductSubtypes: number;
  publishedProducts: number;
  draftProducts: number;
  averagePrice: number;
  totalValue: number;
}

export interface ProductStatsResponse extends ApiResponse<ProductStats> {}
