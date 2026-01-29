import { AnyObject } from "@/models/common"

/**
 * Enum cho trạng thái hóa đơn bán hàng
 */
export enum SalesInvoiceStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * Enum cho trạng thái thanh toán
 */
export enum SalesPaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export const getSalesStatusText = (status: any): string => {
  const s = String(status).toLowerCase();
  const statusMap: { [key: string]: string } = {
    'draft': 'Nháp',
    'confirmed': 'Đã xác nhận',
    'paid': 'Đã thanh toán',
    'cancelled': 'Đã hủy',
    'refunded': 'Đã hoàn tiền',
  }
  return statusMap[s] || 'Không xác định';
}

export const getSalesPaymentStatusText = (status: any): string => {
  const s = String(status).toLowerCase();
  const statusMap: { [key: string]: string } = {
    'pending': 'Chờ thanh toán',
    'partial': 'Thanh toán một phần',
    'paid': 'Đã thanh toán',
    'cancelled': 'Đã hủy',
    'refunded': 'Đã hoàn tiền',
  }
  return statusMap[s] || 'Không xác định';
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho chi tiết hóa đơn bán hàng
 */
export interface SalesInvoiceItem {
  /** ID của chi tiết hóa đơn */
  id: number
  /** ID của hóa đơn bán hàng */
  invoice_id: number
  /** ID của sản phẩm */
  product_id: number
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
  unit_price: number
  /** Tổng tiền (quantity * unit_price) */
  total_price: number
  /** Số tiền giảm giá */
  discount_amount?: number
  /** Số lượng tính thuế */
  taxable_quantity: number
  /** Ghi chú */
  notes?: string
  /** Ngày tạo */
  created_at: string
  /** Ngày cập nhật */
  updated_at: string
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho hóa đơn bán hàng
 */
export interface SalesInvoice {
  /** ID của hóa đơn */
  id: number
  /** Mã hóa đơn (tên trường từ backend) */
  code?: string
  /** Mã hóa đơn */
  invoice_code: string
  /** Tên khách hàng */
  customer_name: string
  /** Số điện thoại khách hàng */
  customer_phone?: string
  /** Email khách hàng */
  customer_email?: string
  /** Địa chỉ khách hàng */
  customer_address?: string
  /** ID Ruộng lúa (liên kết với rice_crop) */
  rice_crop_id?: number
  /** ID mùa vụ */
  season_id?: number
  /** Tổng số tiền */
  total_amount: number
  /** Số tiền giảm giá */
  discount_amount?: number
  /** Số tiền cuối cùng */
  final_amount: number
  /** Trạng thái hóa đơn */
  status: SalesInvoiceStatus
  /** Trạng thái thanh toán */
  payment_status: SalesPaymentStatus
  /** Ghi chú */
  notes?: string
  /** Danh sách chi tiết hóa đơn */
  items?: SalesInvoiceItem[]
  /** Ngày tạo */
  created_at: string
  /** Ngày cập nhật */
  updated_at: string
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho request tạo chi tiết hóa đơn bán hàng
 */
export interface CreateSalesInvoiceItemRequest extends AnyObject {
  /** ID của sản phẩm */
  product_id: number
  /** Số lượng sản phẩm */
  quantity: number
  /** Giá đơn vị */
  unit_price: number
  /** Số tiền giảm giá */
  discount_amount?: number
  /** Ghi chú */
  notes?: string
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho request tạo hóa đơn bán hàng
 */
export interface CreateSalesInvoiceRequest extends AnyObject {
  /** Mã hóa đơn */
  invoice_code: string
  /** Tên khách hàng */
  customer_name: string
  /** Số điện thoại khách hàng */
  customer_phone?: string
  /** Email khách hàng */
  customer_email?: string
  /** Địa chỉ khách hàng */
  customer_address?: string
  /** ID Ruộng lúa (liên kết với rice_crop) */
  rice_crop_id?: number
  /** ID mùa vụ */
  season_id?: number
  /** Tổng số tiền */
  total_amount: number
  /** Số tiền giảm giá */
  discount_amount?: number
  /** Số tiền cuối cùng */
  final_amount: number
  /** Ghi chú */
  notes?: string
  /** Danh sách chi tiết hóa đơn */
  items: CreateSalesInvoiceItemRequest[]
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho request cập nhật hóa đơn bán hàng
 */
export interface UpdateSalesInvoiceRequest
  extends Partial<CreateSalesInvoiceRequest>,
    AnyObject {}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho thống kê bán hàng
 */
export interface SalesStats {
  /** Tổng số hóa đơn */
  total_invoices: number
  /** Số hóa đơn chờ thanh toán */
  pending_invoices: number
  /** Số hóa đơn đã thanh toán */
  paid_invoices: number
  /** Số hóa đơn đã hủy */
  cancelled_invoices: number
  /** Tổng doanh thu */
  total_revenue: number
  /** Doanh thu hôm nay */
  today_revenue: number
  /** Doanh thu tháng này */
  month_revenue: number
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho báo cáo bán hàng theo thời gian
 */
export interface SalesReport {
  /** Ngày */
  date: string
  /** Số lượng hóa đơn */
  invoice_count: number
  /** Tổng doanh thu */
  total_revenue: number
  /** Tổng số lượng sản phẩm bán */
  total_quantity: number
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho báo cáo sản phẩm bán chạy
 */
export interface TopSellingProduct {
  /** ID sản phẩm */
  product_id: number
  /** Tên sản phẩm */
  product_name: string
  /** Mã sản phẩm */
  product_code: string
  /** Hình ảnh sản phẩm */
  product_image?: string
  /** Tổng số lượng bán */
  total_quantity_sold: number
  /** Tổng doanh thu */
  total_revenue: number
  /** Số lần xuất hiện trong hóa đơn */
  invoice_count: number
}
