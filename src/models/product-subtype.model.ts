import { AnyObject } from "@/models/common"

// Interface cho ProductSubtype entity
export interface ProductSubtype {
  id: number
  subtypeName: string
  subtypeCode: string
  productTypeId: number
  description?: string
  status: "active" | "inactive" | "archived"
  createdAt: string
  updatedAt: string
}

// Interface cho tạo mới ProductSubtype
export interface CreateProductSubtypeDto extends AnyObject {
  subtypeName: string
  subtypeCode: string
  productTypeId: number
  description?: string
  status?: "active" | "inactive" | "archived"
}

// Interface cho cập nhật ProductSubtype
export interface UpdateProductSubtypeDto extends AnyObject {
  subtypeName?: string
  subtypeCode?: string
  productTypeId?: number
  description?: string
  status?: "active" | "inactive" | "archived"
}
