// Định nghĩa các kiểu dữ liệu cho ký hiệu (symbol)

import { BaseStatus } from "@/constant/base-status"
import { AnyObject } from "./common"

// Interface cho dữ liệu ký hiệu từ API
export interface Symbol {
  id: number
  symbolCode: string
  symbolName: string
  description?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

// Interface cho form dữ liệu ký hiệu
export interface SymbolFormData {
  symbolCode: string
  symbolName: string
  description?: string
  status?: BaseStatus
}

// Giá trị mặc định cho form ký hiệu
export const defaultSymbolValues: SymbolFormData = {
  symbolCode: "",
  symbolName: "",
  description: "",
  status: "active",
}

// Interface cho tạo mới ký hiệu
export interface CreateSymbolDto extends AnyObject {
  symbolCode: string
  symbolName: string
  description?: string
  status?: BaseStatus
}

// Interface cho cập nhật ký hiệu
export interface UpdateSymbolDto extends Partial<CreateSymbolDto>, AnyObject {
  id: number
}

// Interface cho tham số tìm kiếm ký hiệu
export interface SymbolListParams {
  limit?: number
  offset?: number
  search?: string
}
