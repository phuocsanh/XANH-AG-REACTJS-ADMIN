import { z } from "zod"

// Schema validation cho form nhà cung cấp
export const supplierSchema = z.object({
  name: z.string().min(1, "Tên nhà cung cấp là bắt buộc"),
  code: z.string().min(1, "Mã nhà cung cấp là bắt buộc"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  contact_person: z.string().optional(),
  status: z.enum(["active", "inactive", "pending", "archived"]).default("active"),
  notes: z.string().optional(),
})

// Types cho form data
export type SupplierFormData = z.infer<typeof supplierSchema>

// Giá trị mặc định cho form
export const defaultSupplierValues: SupplierFormData = {
  name: "",
  code: "",
  address: "",
  phone: "",
  email: "",
  contact_person: "",
  status: "active",
  notes: "",
}
