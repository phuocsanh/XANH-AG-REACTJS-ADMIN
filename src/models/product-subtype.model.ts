import { AnyObject } from "@/models/common"

// Re-export ProductSubtype từ product-type.model.ts để đảm bảo tính nhất quán
export type { ProductSubtype } from "@/models/product-type.model"

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
