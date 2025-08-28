/**
 * Interface định nghĩa cấu trúc dữ liệu cho chi tiết hóa đơn bán hàng
 */
export interface SalesInvoiceItem {
  /** ID của chi tiết hóa đơn */
  id: number
  /** ID của hóa đơn bán hàng */
  invoiceId: number
  /** ID của sản phẩm */
  productId: number
  /** Thông tin sản phẩm */
  product?: {
    id: number
    name: string
    code: string
    image?: string
    unit?: string
  }
  /** Số lượng sản phẩm */
  quantity: number
  /** Giá đơn vị */
  unitPrice: number
  /** Tổng tiền (quantity * unitPrice) */
  totalPrice: number
  /** Số tiền giảm giá */
  discountAmount?: number
  /** Ghi chú */
  notes?: string
  /** Ngày tạo */
  createdAt: string
  /** Ngày cập nhật */
  updatedAt: string
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho hóa đơn bán hàng
 */
export interface SalesInvoice {
  /** ID của hóa đơn */
  id: number
  /** Mã hóa đơn */
  invoiceCode: string
  /** Tên khách hàng */
  customerName: string
  /** Số điện thoại khách hàng */
  customerPhone?: string
  /** Email khách hàng */
  customerEmail?: string
  /** Địa chỉ khách hàng */
  customerAddress?: string
  /** Tổng số tiền */
  totalAmount: number
  /** Số tiền giảm giá */
  discountAmount?: number
  /** Số tiền cuối cùng */
  finalAmount: number
  /** Trạng thái thanh toán */
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED'
  /** Ghi chú */
  notes?: string
  /** Danh sách chi tiết hóa đơn */
  items?: SalesInvoiceItem[]
  /** Ngày tạo */
  createdAt: string
  /** Ngày cập nhật */
  updatedAt: string
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho request tạo chi tiết hóa đơn bán hàng
 */
export interface CreateSalesInvoiceItemRequest {
  /** ID của sản phẩm */
  productId: number
  /** Số lượng sản phẩm */
  quantity: number
  /** Giá đơn vị */
  unitPrice: number
  /** Số tiền giảm giá */
  discountAmount?: number
  /** Ghi chú */
  notes?: string
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho request tạo hóa đơn bán hàng
 */
export interface CreateSalesInvoiceRequest {
  /** Mã hóa đơn */
  invoiceCode: string
  /** Tên khách hàng */
  customerName: string
  /** Số điện thoại khách hàng */
  customerPhone?: string
  /** Email khách hàng */
  customerEmail?: string
  /** Địa chỉ khách hàng */
  customerAddress?: string
  /** Tổng số tiền */
  totalAmount: number
  /** Số tiền giảm giá */
  discountAmount?: number
  /** Số tiền cuối cùng */
  finalAmount: number
  /** Ghi chú */
  notes?: string
  /** Danh sách chi tiết hóa đơn */
  items: CreateSalesInvoiceItemRequest[]
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho request cập nhật hóa đơn bán hàng
 */
export interface UpdateSalesInvoiceRequest extends Partial<CreateSalesInvoiceRequest> {}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho thống kê bán hàng
 */
export interface SalesStats {
  /** Tổng số hóa đơn */
  totalInvoices: number
  /** Số hóa đơn chờ thanh toán */
  pendingInvoices: number
  /** Số hóa đơn đã thanh toán */
  paidInvoices: number
  /** Số hóa đơn đã hủy */
  cancelledInvoices: number
  /** Tổng doanh thu */
  totalRevenue: number
  /** Doanh thu hôm nay */
  todayRevenue: number
  /** Doanh thu tháng này */
  monthRevenue: number
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho báo cáo bán hàng theo thời gian
 */
export interface SalesReport {
  /** Ngày */
  date: string
  /** Số lượng hóa đơn */
  invoiceCount: number
  /** Tổng doanh thu */
  totalRevenue: number
  /** Tổng số lượng sản phẩm bán */
  totalQuantity: number
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho báo cáo sản phẩm bán chạy
 */
export interface TopSellingProduct {
  /** ID sản phẩm */
  productId: number
  /** Tên sản phẩm */
  productName: string
  /** Mã sản phẩm */
  productCode: string
  /** Hình ảnh sản phẩm */
  productImage?: string
  /** Tổng số lượng bán */
  totalQuantitySold: number
  /** Tổng doanh thu */
  totalRevenue: number
  /** Số lần xuất hiện trong hóa đơn */
  invoiceCount: number
}