import { z } from "zod"

// Export the Unit interface from the model
export type { Unit } from "@/models/unit.model"

// Schema validation cho form đơn vị tính
export const unitSchema = z.object({
  name: z.string().min(1, "Tên đơn vị tính là bắt buộc"),
  code: z.string().optional(), // Backend tự động generate code nếu không cung cấp
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "pending", "archived"]).default("active"),
})

// Type cho form data
export type UnitFormData = z.infer<typeof unitSchema>

// Giá trị mặc định cho form
export const defaultUnitValues: UnitFormData = {
  name: "",
  code: "",
  description: "",
  status: "active",
}
