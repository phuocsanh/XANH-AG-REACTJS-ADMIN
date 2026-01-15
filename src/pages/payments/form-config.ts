import * as z from 'zod';

// Schema cho thanh toán đơn giản
export const simplePaymentSchema = z.object({
  customer_id: z.number().min(1, 'Vui lòng chọn khách hàng'),
  amount: z.number().min(1, 'Số tiền phải lớn hơn 0'),
  payment_method: z.enum(['cash', 'transfer']).default('cash'),
  payment_date: z.string().optional(),
  notes: z.string().optional(),
});

// Schema cho chốt sổ với phiếu nợ
export const settlePaymentSchema = z.object({
  customer_id: z.number().min(1, 'Vui lòng chọn khách hàng'),
  amount: z.number().min(1, 'Số tiền phải lớn hơn 0'),
  payment_method: z.enum(['cash', 'transfer']).default('cash'),
  invoice_ids: z.array(z.number()).optional(),
  create_debt_note: z.boolean().default(false),
  debt_note_config: z.object({
    season_id: z.number(),
    due_date: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

export type SimplePaymentFormData = z.infer<typeof simplePaymentSchema>;
export type SettlePaymentFormData = z.infer<typeof settlePaymentSchema>;

export const defaultSimplePaymentValues: SimplePaymentFormData = {
  customer_id: 0,
  amount: 0,
  payment_method: 'cash',
  payment_date: new Date().toISOString().split('T')[0],
  notes: '',
};

export const defaultSettlePaymentValues: SettlePaymentFormData = {
  customer_id: 0,
  amount: 0,
  payment_method: 'cash',
  invoice_ids: [],
  create_debt_note: false,
};

export const paymentMethodLabels = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  debt: 'Công nợ',
};
