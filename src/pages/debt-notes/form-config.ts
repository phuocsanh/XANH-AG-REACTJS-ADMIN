import * as z from 'zod';

export const payDebtSchema = z.object({
  amount: z.number().min(1, 'Số tiền phải lớn hơn 0'),
  payment_method: z.enum(['cash', 'transfer']).default('cash'),
  notes: z.string().optional(),
});

export type PayDebtFormData = z.infer<typeof payDebtSchema>;

export const defaultPayDebtValues: PayDebtFormData = {
  amount: 0,
  payment_method: 'cash',
  notes: '',
};

export const debtStatusLabels = {
  active: 'Đang nợ',
  paid: 'Đã trả',
  overdue: 'Quá hạn',
  cancelled: 'Đã hủy',
  settled: 'Đã chốt sổ',
};

export const debtStatusColors = {
  active: 'warning',
  paid: 'success',
  overdue: 'error',
  cancelled: 'default',
  settled: 'orange',
} as const;
