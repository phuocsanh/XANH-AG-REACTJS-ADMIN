import * as z from 'zod';

// Schema cho từng item trong hóa đơn
export const salesInvoiceItemSchema = z.object({
  product_id: z.number().min(1, 'Vui lòng chọn sản phẩm'),
  product_name: z.string().optional(),
  quantity: z.number().min(1, 'Số lượng phải lớn hơn 0'),
  unit_price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  discount_amount: z.number().min(0, 'Giảm giá phải lớn hơn hoặc bằng 0').default(0),
  notes: z.string().optional(),
  price_type: z.enum(['cash', 'credit']).default('cash'), // Loại giá: tiền mặt hoặc nợ
});

// Schema cho hóa đơn
export const salesInvoiceSchema = z.object({
  customer_id: z.number().optional(),
  customer_name: z.string().min(1, 'Tên khách hàng là bắt buộc'),
  customer_phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 số'),
  customer_address: z.string().optional(),
  season_id: z.number().optional(),
  rice_crop_id: z.number().optional(),
  invoice_code: z.string().optional(),
  notes: z.string().optional(),
  warning: z.string().optional(),
  payment_method: z.enum(['cash', 'transfer', 'debt']).default('cash'),
  total_amount: z.number().min(0),
  discount_amount: z.number().min(0).default(0),
  final_amount: z.number().min(0),
  partial_payment_amount: z.number().min(0).default(0),
  items: z.array(salesInvoiceItemSchema).min(1, 'Phải có ít nhất 1 sản phẩm'),
  status: z.enum(['draft', 'confirmed', 'paid']).optional(),
});

export type SalesInvoiceItemFormData = z.infer<typeof salesInvoiceItemSchema>;
export type SalesInvoiceFormData = z.infer<typeof salesInvoiceSchema>;

export const defaultSalesInvoiceValues: SalesInvoiceFormData = {
  customer_id: undefined,
  customer_name: '',
  customer_phone: '',
  customer_address: '',
  season_id: undefined,
  rice_crop_id: undefined,
  invoice_code: '',
  notes: '',
  warning: '',
  payment_method: 'cash',
  total_amount: 0,
  discount_amount: 0,
  final_amount: 0,
  partial_payment_amount: 0,
  items: [],
  status: 'draft',
};

export const defaultSalesInvoiceItemValues: SalesInvoiceItemFormData = {
  product_id: 0,
  quantity: 1,
  unit_price: 0,
  discount_amount: 0,
  notes: '',
  price_type: 'cash', // Mặc định là giá tiền mặt
};

export const paymentMethodLabels = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  debt: 'Công nợ',
};

export const invoiceStatusLabels = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  paid: 'Đã thanh toán',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

export const priceTypeLabels = {
  cash: 'Giá tiền mặt',
  credit: 'Giá bán nợ',
};
