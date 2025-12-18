import * as z from 'zod';

// Schema cho item trong phiếu điều chỉnh
export const adjustmentItemSchema = z.object({
  product_id: z.number().min(1, 'Vui lòng chọn sản phẩm'),
  product_name: z.string().optional(),
  quantity_change: z.number().refine((val) => val !== 0, {
    message: 'Số lượng thay đổi không được bằng 0',
  }),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

// Schema cho form tạo phiếu điều chỉnh
export const adjustmentFormSchema = z.object({
  adjustment_type: z.enum(['IN', 'OUT'], {
    errorMap: () => ({ message: 'Vui lòng chọn loại điều chỉnh' }),
  }),
  reason: z.string().min(5, 'Lý do phải có ít nhất 5 ký tự'),
  notes: z.string().optional(),
  items: z.array(adjustmentItemSchema).min(1, 'Phải có ít nhất 1 sản phẩm'),
  images: z.any().optional(), // Có thể là string[] (URLs) hoặc object objects[] (IDs + URLs)
});

// TypeScript types
export type AdjustmentItemFormData = z.infer<typeof adjustmentItemSchema>;
export type AdjustmentFormData = z.infer<typeof adjustmentFormSchema>;

// Default values
export const defaultAdjustmentValues: Partial<AdjustmentFormData> = {
  adjustment_type: 'IN',
  reason: '',
  notes: '',
  items: [],
  images: [],
};
