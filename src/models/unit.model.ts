import { AnyObject } from "@/models/common"
import { BaseStatus } from "@/constant/base-status"

// Interface cho Unit entity
export interface Unit {
  id: number
  name: string
  code: string
  description?: string
  status: BaseStatus
  created_at: string
  updated_at: string
  deleted_at?: string
}

// Interface cho tạo mới Unit
export interface CreateUnitDto extends AnyObject {
  name: string
  code: string
  description?: string
  status?: BaseStatus
}

// Interface cho cập nhật Unit
export interface UpdateUnitDto extends AnyObject {
  name?: string
  code?: string
  description?: string
  status?: BaseStatus
}
