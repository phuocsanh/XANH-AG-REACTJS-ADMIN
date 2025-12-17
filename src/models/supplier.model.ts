// Định nghĩa các kiểu dữ liệu cho quản lý nhà cung cấp (Supplier Management)

import { BaseStatus } from "@/constant/base-status"

// Interface cho nhà cung cấp
export interface Supplier {
  id: number
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  contact_person?: string
  status: BaseStatus
  notes?: string
  created_by: number
  updated_by?: number | null
  deleted_by?: number | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

// Interface cho request tạo nhà cung cấp mới
export interface CreateSupplierRequest {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  name: string
  code?: string
  address?: string
  phone?: string
  email?: string
  contact_person?: string
  notes?: string
}

// Interface cho request cập nhật nhà cung cấp
export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  id: number
}

// Interface cho metadata trong response
export interface ResponseMeta {
  timestamp: string
  path: string
  method: string
}

// Interface cho thông tin phân trang
export interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

// Interface cho response thành công không phân trang
export interface SuccessResponse<T> {
  success: true
  data: T
  meta: ResponseMeta
}

// Interface cho response thành công có phân trang
export interface PaginatedSuccessResponse<T> {
  success: true
  data: T[]
  meta: ResponseMeta
  pagination: PaginationInfo
}

// Interface cho response từ API tạo/cập nhật nhà cung cấp (không phân trang)
export type SupplierApiResponse = SuccessResponse<Supplier>

// Interface cho response danh sách nhà cung cấp (có phân trang)
export type SupplierListApiResponse = PaginatedSuccessResponse<Supplier>
