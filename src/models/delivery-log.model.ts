/**
 * Enum trạng thái phiếu giao hàng
 */
export enum DeliveryStatus {
  PENDING = 'pending',
  DELIVERING = 'delivering',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Chi tiết sản phẩm trong phiếu giao hàng
 */
export interface DeliveryLogItem {
  id?: number;
  delivery_log_id?: number;
  sales_invoice_item_id?: number; // Optional khi tạo độc lập
  product_id?: number;
  product_name?: string;
  quantity_delivered: number;
  quantity?: number; // Alias
  unit?: string;
  notes?: string;
}

/**
 * Phiếu giao hàng
 */
export interface DeliveryLog {
  id?: number;
  invoice_id?: number; // Null nếu tạo độc lập
  season_id?: number; // Liên kết với mùa vụ
  delivery_date: string; // Format: YYYY-MM-DD
  delivery_start_time: string; // Format: HH:mm:ss
  delivery_address?: string;
  receiver_name?: string; // Tên người nhận
  receiver_phone?: string; // SĐT người nhận
  delivery_notes?: string; // Ghi chú giao hàng
  driver_id?: number; // ID tài xế (nếu chọn từ hệ thống)
  driver_name?: string; // Tên tài xế (hiển thị hoặc nhập tay)
  vehicle_number?: string; // Số xe (biển số)
  vehicle_plate?: string; // Alias (backward compatibility)
  fuel_cost?: number; // Chi phí nhiên liệu
  driver_cost?: number; // Chi phí tài xế
  other_costs?: number; // Chi phí khác
  total_cost?: number;
  status?: DeliveryStatus;
  notes?: string;
  items?: DeliveryLogItem[];
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
  // Relations
  invoice?: any; // SalesInvoice
}

/**
 * DTO tạo phiếu giao hàng standalone
 */
export interface CreateDeliveryLogDto {
  invoice_id?: number; // Optional - null nếu tạo độc lập
  season_id?: number; // ID mùa vụ
  delivery_date: string;
  delivery_start_time: string;
  delivery_address?: string;
  receiver_name?: string;
  receiver_phone?: string;
  delivery_notes?: string;
  driver_id?: number; // ID tài xế (nếu chọn từ hệ thống)
  driver_name?: string; // Tên tài xế (hiển thị hoặc nhập tay)
  vehicle_number?: string;
  distance_km?: number;
  fuel_cost?: number;
  driver_cost?: number;
  other_costs?: number;
  total_cost?: number;
  status?: DeliveryStatus;
  items?: {
    sales_invoice_item_id?: number; // Optional khi tạo độc lập
    product_id?: number; // Optional khi tạo từ hóa đơn
    quantity: number; // Số lượng giao
    unit?: string;
    notes?: string;
  }[];
}

/**
 * Response phân trang
 */
export interface DeliveryLogListResponse {
  data: DeliveryLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
