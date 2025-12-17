// Định nghĩa các kiểu dữ liệu cho ký hiệu (symbol)

import { BaseStatus } from "@/constant/base-status"
import { AnyObject } from "./common"

// Interface cho dữ liệu ký hiệu từ API
export interface Symbol {
  id: number
  code: string
  name: string
  description?: string
  status: BaseStatus
  created_at: string
  updated_at: string
  deleted_at?: string
}

// Interface cho form dữ liệu ký hiệu
export interface SymbolFormData {
  code?: string
  name: string
  description?: string
  status?: BaseStatus
}

// Giá trị mặc định cho form ký hiệu
export const defaultSymbolValues: SymbolFormData = {
  name: "",
  description: "",
  status: "active",
}

// Interface cho tạo mới ký hiệu
export interface CreateSymbolDto extends AnyObject {
  code?: string
  name: string
  description?: string
  status?: BaseStatus
}

// Interface cho cập nhật ký hiệu
export interface UpdateSymbolDto extends Partial<CreateSymbolDto>, AnyObject {
  // Không bao gồm id trong body request khi cập nhật
}

// Interface cho tham số tìm kiếm ký hiệu
export interface SymbolListParams {
  limit?: number
  offset?: number
  search?: string
}
