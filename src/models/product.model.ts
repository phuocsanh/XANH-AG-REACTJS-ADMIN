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
