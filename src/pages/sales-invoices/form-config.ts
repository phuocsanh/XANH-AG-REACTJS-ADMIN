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
  average_cost_price: z.number().min(0).optional(), // ✅ Giá vốn để tính lợi nhuận
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
  // Quà tặng khi bán hàng
  gift_description: z.string().optional(),
  gift_value: z.number().min(0, 'Giá trị quà tặng phải lớn hơn hoặc bằng 0').default(0),
  items: z.array(salesInvoiceItemSchema).min(1, 'Phải có ít nhất 1 sản phẩm'),
  status: z.enum(['draft', 'confirmed', 'paid']).optional(),
}).refine((data) => {
  // Nếu có customer_id (khách hàng từ hệ thống), bắt buộc phải có season_id
  if (data.customer_id && !data.season_id) {
    return false;
  }
  return true;
}, {
  message: 'Vui lòng chọn Mùa vụ cho khách hàng này',
  path: ['season_id'], // Lỗi sẽ hiển thị ở field season_id
}).refine((data) => {
  // Nếu có customer_id (khách hàng từ hệ thống), bắt buộc phải có rice_crop_id
  if (data.customer_id && !data.rice_crop_id) {
    return false;
  }
  return true;
}, {
  message: 'Vui lòng chọn Ruộng lúa cho khách hàng này',
  path: ['rice_crop_id'], // Lỗi sẽ hiển thị ở field rice_crop_id
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
  payment_method: 'debt',
  total_amount: 0,
  discount_amount: 0,
  final_amount: 0,
  partial_payment_amount: 0,
  // Quà tặng khi bán hàng
  gift_description: '',
  gift_value: 0,
  items: [],
  status: 'draft',
};

export const defaultSalesInvoiceItemValues: SalesInvoiceItemFormData = {
  product_id: 0,
  quantity: 1,
  unit_price: 0,
  discount_amount: 0,
  notes: '',
  price_type: 'credit', // Mặc định là giá bán nợ
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
