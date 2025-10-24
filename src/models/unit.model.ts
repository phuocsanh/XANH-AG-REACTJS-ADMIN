import { AnyObject } from "@/models/common"
import { BaseStatus } from "@/constant/base-status"

// Interface cho Unit entity
export interface Unit {
  id: number
  unitName: string
  unitCode: string
  description?: string
  status: BaseStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

// Interface cho tạo mới Unit
export interface CreateUnitDto extends AnyObject {
  unitName: string
  unitCode: string
  description?: string
  status?: BaseStatus
}

// Interface cho cập nhật Unit
export interface UpdateUnitDto extends AnyObject {
  unitName?: string
  unitCode?: string
  description?: string
  status?: BaseStatus
}
