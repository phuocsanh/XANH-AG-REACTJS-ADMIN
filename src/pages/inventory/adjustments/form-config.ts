import * as z from 'zod';

// Schema cho item trong phiếu điều chỉnh
export const adjustmentItemSchema = z.object({
  product_id: z.number().min(1, 'Vui lòng chọn sản phẩm'),
  product_name: z.string().optional(),
  quantity_change: z.number().refine((val) => val !== 0, {
    message: 'Số lượng thay đổi không được bằng 0',
  }),
  source_batch_id: z.number().optional(),
  taxable_quantity: z.number().min(0, 'Số lượng thuế không được âm').optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((item, context) => {
  const taxableQuantity = item.taxable_quantity || 0
  if (item.quantity_change > 0 && taxableQuantity > item.quantity_change) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['taxable_quantity'],
      message: 'SL thuế không được vượt số lượng tăng',
    })
  }
  if (item.quantity_change > 0 && taxableQuantity > 0 && !item.source_batch_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['source_batch_id'],
      message: 'Chọn lô nhập nguồn để xác định GBKT',
    })
  }
});

// Schema cho form tạo phiếu điều chỉnh
export const adjustmentFormSchema = z.object({
  adjustment_type: z.enum(['IN', 'OUT'], {
    errorMap: () => ({ message: 'Vui lòng chọn loại điều chỉnh' }),
  }),
  reason: z.string().min(5, 'Lý do phải có ít nhất 5 ký tự'),
  notes: z.string().optional(),
  status: z.enum(['draft', 'approved']).default('draft'),
  items: z.array(adjustmentItemSchema).min(1, 'Phải có ít nhất 1 sản phẩm'),
  images: z.any().optional(),
});

// TypeScript types
export type AdjustmentItemFormData = z.infer<typeof adjustmentItemSchema>;
export type AdjustmentFormData = z.infer<typeof adjustmentFormSchema>;

// Default values
export const defaultAdjustmentValues: Partial<AdjustmentFormData> = {
  adjustment_type: 'IN',
  reason: '',
  notes: '',
  status: 'draft',
  items: [],
  images: [],
};
