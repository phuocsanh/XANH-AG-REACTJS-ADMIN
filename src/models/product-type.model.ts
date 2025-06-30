// Định nghĩa các kiểu dữ liệu cho loại sản phẩm
import { ApiResponse } from './auth.model';

export interface ProductType {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSubtype {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductTypeRequest {
  [key: string]: unknown;
  name: string;
  description?: string;
}

export interface ProductSubtypeRequest {
  [key: string]: unknown;
  name: string;
  description?: string;
}

export interface ProductSubtypeMappingRequest {
  [key: string]: unknown;
  typeId: number;
  subtypeId: number;
}

export interface ProductTypeResponse extends ApiResponse<ProductType> {}

export interface ProductTypesListResponse extends ApiResponse<ProductType[]> {}

export interface ProductSubtypeResponse extends ApiResponse<ProductSubtype> {}

export interface ProductSubtypesListResponse extends ApiResponse<ProductSubtype[]> {}
