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
  contactPerson?: string
  status: BaseStatus
  notes?: string
  createdBy: number
  updatedBy?: number
  deletedBy?: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

// Interface cho request tạo nhà cung cấp mới
export interface CreateSupplierRequest {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  contactPerson?: string
  notes?: string
}

// Interface cho request cập nhật nhà cung cấp
export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  id: number
}

// Interface cho response từ API
export interface SupplierApiResponse extends Supplier {}

// Interface cho response danh sách
export interface SupplierListApiResponse {
  items: Supplier[]
  total: number
}
