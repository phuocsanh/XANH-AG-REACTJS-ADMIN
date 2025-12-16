import * as z from 'zod';

export const salesReturnItemSchema = z.object({
  product_id: z.number().min(1, 'Vui lòng chọn sản phẩm'),
  product_name: z.string().optional(),
  quantity: z.number().min(1, 'Số lượng phải lớn hơn 0'),
  unit_price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  reason: z.string().optional(),
});

export const salesReturnSchema = z.object({
  invoice_id: z.number().min(1, 'Vui lòng chọn hóa đơn'),
  refund_method: z.enum(['cash', 'debt_credit']).default('cash'),
  reason: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(salesReturnItemSchema).min(1, 'Phải có ít nhất 1 sản phẩm trả'),
});

export type SalesReturnItemFormData = z.infer<typeof salesReturnItemSchema>;
export type SalesReturnFormData = z.infer<typeof salesReturnSchema>;

export const defaultSalesReturnValues: SalesReturnFormData = {
  invoice_id: undefined as unknown as number, // Set to undefined to show placeholder
  refund_method: 'cash',
  reason: '',
  notes: '',
  items: [],
};

export const refundMethodLabels = {
  cash: 'Hoàn tiền mặt',
  debt_credit: 'Trừ công nợ',
};

export const returnStatusLabels = {
  draft: 'Nháp',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

export const returnStatusColors = {
  draft: 'default',
  completed: 'success',
  cancelled: 'error',
} as const;

