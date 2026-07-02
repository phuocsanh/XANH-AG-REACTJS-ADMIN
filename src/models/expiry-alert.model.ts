/**
 * Model TypeScript cho chức năng cảnh báo lô hàng sắp hết hạn
 */

/** Loại cảnh báo hết hạn */
export type ExpiryAlertType = 'warning' | 'critical' | 'expired'

/** Trạng thái xử lý cảnh báo */
export type ExpiryAlertStatus = 'pending' | 'resolved'

/** Thông tin tóm tắt sản phẩm trong alert */
export interface ExpiryAlertProduct {
  id: number
  name: string
  code?: string
}

/** Thông tin tóm tắt lô hàng trong alert */
export interface ExpiryAlertBatch {
  id: number
  code?: string
}

/** Entity cảnh báo hết hạn */
export interface ExpiryAlert {
  id: number
  product_id: number
  batch_id: number
  /** Ngày hết hạn của lô hàng */
  expiry_date: string
  /** Số lượng còn lại trong lô */
  remaining_quantity: number
  /** Loại cảnh báo: warning (60–120 ngày), critical (0–60 ngày), expired (đã hết hạn) */
  alert_type: ExpiryAlertType
  /** Số ngày còn lại đến hết hạn (âm nếu đã hết hạn) */
  days_until_expiry: number
  /** Đã gửi push notification chưa */
  is_notified: boolean
  /** Thời điểm gửi notification */
  notified_at?: string | null
  /** Đã xử lý chưa (bán hết, hủy lô...) */
  is_resolved: boolean
  /** Ghi chú xử lý */
  resolution_notes?: string | null
  created_at: string
  updated_at: string
  /** Thông tin sản phẩm (joined) */
  product?: ExpiryAlertProduct
  /** Thông tin lô hàng (joined) */
  batch?: ExpiryAlertBatch
}

/** Thống kê tổng hợp cảnh báo */
export interface ExpiryAlertStats {
  /** Tổng tất cả alert (pending + resolved) */
  total: number
  /** Số alert chưa xử lý */
  pending: number
  /** Số lô sắp hết hạn mức warning (60–120 ngày) */
  warning: number
  /** Số lô sắp hết hạn mức critical (< 60 ngày) */
  critical: number
  /** Số lô đã hết hạn */
  expired: number
  /** Số alert đã xử lý */
  resolved: number
}

/** Response phân trang cho danh sách alert */
export interface ExpiryAlertPaginatedResponse {
  items: ExpiryAlert[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Params bộ lọc danh sách alert */
export interface ExpiryAlertListParams {
  status?: ExpiryAlertStatus
  type?: ExpiryAlertType
  page?: number
  limit?: number
}

/** Request xử lý nhiều alert cùng lúc */
export interface ResolveMultipleRequest {
  ids: number[]
  notes?: string
  [key: string]: unknown
}

/** Response sau khi xử lý nhiều alert */
export interface ResolveMultipleResponse {
  resolved: number
}
