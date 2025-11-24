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
  invoice_id: 0,
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
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  completed: 'Hoàn tất',
};

export const returnStatusColors = {
  pending: 'warning',
  approved: 'info',
  rejected: 'error',
  completed: 'success',
} as const;
