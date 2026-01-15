import * as z from 'zod';
import dayjs from 'dayjs';

// Schema cho item trong phiếu nhập hàng
export const receiptItemSchema = z.object({
  product_id: z.number().min(1, 'Vui lòng chọn sản phẩm'),
  product_name: z.string().optional(),
  scientific_name: z.string().optional(),
  quantity: z.number().min(1, 'Số lượng phải lớn hơn 0'),
  unit_cost: z.number().min(0, 'Đơn giá phải lớn hơn hoặc bằng 0'),
  total_price: z.number().min(0),
  expiry_date: z.any().optional(),
  individual_shipping_cost: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Schema cho form tạo phiếu nhập hàng
export const receiptFormSchema = z.object({
  supplierId: z.number().min(1, 'Vui lòng chọn nhà cung cấp'),
  bill_date: z.any().optional(),
  description: z.string().optional(),
  status: z.string().default('draft'),
  items: z.array(receiptItemSchema).min(1, 'Phải có ít nhất 1 sản phẩm'),
  
  // Phí vận chuyển/bốc vác
  hasSharedShipping: z.boolean().default(false),
  sharedShippingCost: z.number().min(0).default(0),
  allocationMethod: z.enum(['by_value', 'by_quantity']).default('by_value'),
  
  // Hình ảnh
  images: z.any().optional(),

  // Thanh toán
  paymentType: z.enum(['full', 'partial', 'debt']).default('partial'),
  paidAmount: z.number().min(0).default(0),
  paymentMethod: z.string().optional(),
  paymentDueDate: z.any().optional(),
}).superRefine((data, ctx) => {
  // 1. Validate phí vận chuyển/bốc vác (áp dụng cho mọi trạng thái)
  if (data.hasSharedShipping && (!data.sharedShippingCost || data.sharedShippingCost <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui lòng nhập số phí vận chuyển/bốc vác lớn hơn 0',
      path: ['sharedShippingCost'],
    });
  }

  // 2. Chỉ validate thanh toán khi phiếu đã duyệt
  if (data.status !== 'approved') {
    return; // Bỏ qua validation thanh toán cho phiếu nháp
  }

  // Validate payment logic
  if (data.paymentType === 'partial') {
    if (data.paidAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng nhập số tiền trả trước lớn hơn 0',
        path: ['paidAmount'],
      });
    }
    if (!data.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng chọn phương thức thanh toán',
        path: ['paymentMethod'],
      });
    }
    if (!data.paymentDueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng chọn hạn thanh toán',
        path: ['paymentDueDate'],
      });
    }
  } else if (data.paymentType === 'debt') {
    if (!data.paymentDueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng chọn hạn trả nợ',
        path: ['paymentDueDate'],
      });
    }
  } else if (data.paymentType === 'full') {
    if (!data.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng chọn phương thức thanh toán',
        path: ['paymentMethod'],
      });
    }
  }
});

// TypeScript types
export type ReceiptItemFormData = z.infer<typeof receiptItemSchema>;
export type ReceiptFormData = z.infer<typeof receiptFormSchema>;

// Default values
export const defaultReceiptValues: Partial<ReceiptFormData> = {
  status: 'draft',
  bill_date: dayjs(), // Mặc định là ngày hiện tại
  items: [],
  hasSharedShipping: false,
  sharedShippingCost: 0,
  allocationMethod: 'by_quantity',
  images: [],
  paymentType: 'partial',
  paidAmount: 0,
};
