import * as z from 'zod';

export const customerSchema = z.object({
  code: z.string().optional(), // Backend tự động generate code nếu không cung cấp
  name: z.string().min(1, 'Tên khách hàng là bắt buộc'),
  phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 số'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().optional(),
  type: z.enum(['regular', 'vip', 'wholesale']).default('regular'),
  tax_code: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export const defaultCustomerValues: CustomerFormData = {
  code: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  type: 'regular',
  tax_code: '',
  notes: '',
};

export const customerTypeLabels = {
  regular: 'Khách hàng thường',
  vip: 'Khách hàng VIP',
  wholesale: 'Khách hàng sỉ',
};
