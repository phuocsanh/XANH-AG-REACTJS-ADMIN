import * as z from 'zod';

// Schema cho item trong phiếu trả hàng
export const returnItemSchema = z.object({
  product_id: z.number().min(1, 'Vui lòng chọn sản phẩm'),
  product_name: z.string().optional(),
  quantity: z.number().min(1, 'Số lượng phải lớn hơn 0'),
  unit_cost: z.number().min(0, 'Đơn giá phải lớn hơn hoặc bằng 0'),
  total_price: z.number().min(0),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

// Schema cho form tạo phiếu trả hàng
export const returnFormSchema = z.object({
  receipt_id: z.number().min(1, 'Vui lòng chọn phiếu nhập kho'),
  return_code: z.string().min(1, 'Mã phiếu không được để trống'),
  supplier_id: z.number().min(1, 'Vui lòng chọn nhà cung cấp'),
  reason: z.string().min(10, 'Lý do phải có ít nhất 10 ký tự'),
  notes: z.string().optional(),
  items: z.array(returnItemSchema).min(1, 'Phải có ít nhất 1 sản phẩm trả'),
  images: z.any().optional(), // Có thể là string[] (URLs) hoặc object objects[] (IDs + URLs)
  status: z.enum(['draft', 'approved', 'cancelled']).default('draft'),
});

// TypeScript types
export type ReturnItemFormData = z.infer<typeof returnItemSchema>;
export type ReturnFormData = z.infer<typeof returnFormSchema>;

// Default values
export const defaultReturnValues: Partial<ReturnFormData> = {
  return_code: '',
  reason: '',
  notes: '',
  items: [],
  images: [],
  status: 'draft',
};
