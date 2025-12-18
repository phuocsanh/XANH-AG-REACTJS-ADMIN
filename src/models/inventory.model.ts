// Định nghĩa các kiểu dữ liệu cho quản lý nhập hàng (Inventory Management)

import { ApiResponse } from "./auth.model"
import { AnyObject } from "./common"

// Types cho Upload Ảnh Hóa Đơn
export interface ReceiptImage {
  id: number
  url: string
  name: string
  type: string
  size: number
  created_at: string
}

export interface UploadImageRequest {
  fileId: number
  fieldName?: string
}

// Enum cho trạng thái phiếu nhập hàng (sử dụng string lowercase)
// Backend chỉ có 3 status: draft, approved, cancelled
export enum InventoryReceiptStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
}

// Enum cho loại giao dịch kho
export enum InventoryTransactionType {
  IMPORT = 1,
  EXPORT = 2,
  ADJUSTMENT = 3,
}

// Interface cho phiếu nhập hàng
export interface InventoryReceipt {
  id: number
  code: string
  notes?: string // Thay description thành notes để khớp với backend
  status: string // Trạng thái là string text tiếng Việt (đã map) hoặc raw string
  status_code?: string // status code raw (draft, pending...)
  total_amount: number // Thay totalAmount thành total_amount và string thành number để khớp với backend
  supplier_id?: number // Thay supplierName thành supplier_id để khớp với backend
  supplier_name?: string // Thêm supplier_name để hiển thị
  supplier?: { id: number; name: string; code?: string }
  created_by: number
  approved_by?: number
  created_at: string
  updated_at: string
  approved_at?: string
  items?: InventoryReceiptItem[]
}

// Interface cho chi tiết phiếu nhập hàng (items)
export interface InventoryReceiptItem {
  id: number
  receipt_id: number
  product_id: number
  quantity: number
  unit_cost: number // Thay unitPrice thành unit_cost và string thành number để khớp với backend
  total_price: number // Thay totalPrice thành total_price và string thành number để khớp với backend
  notes?: string
  created_at: string
  updated_at: string
}

// Giữ lại các interface ApiResponse để tương thích với backend (nếu cần)
export interface InventoryReceiptApiResponse {
  id: number
  code: string
  description?: string // Giữ nguyên để tương thích với API response
  status: string // Backend trả về string
  total_amount: string // Thay totalAmount thành total_amount
  supplier_id?: number // Thêm supplier_id
  supplier_name?: string // Thay supplierName thành supplier_name
  supplier_contact?: string // Thay supplierContact thành supplier_contact
  created_by: number
  approved_by?: number
  created_at: string
  updated_at: string
  approved_at?: string
  items?: InventoryReceiptItemApiResponse[]
}

export interface InventoryReceiptItemApiResponse {
  id: number
  receipt_id: number
  product_id: number
  product_name: string // Thay productName thành product_name
  quantity: number
  unit_price: string // Thay unitPrice thành unit_price
  total_price: string // Thay totalPrice thành total_price
  expiry_date?: string // Thay expiryDate thành expiry_date
  batch_number?: string // Thay batchNumber thành batch_number
  notes?: string
  created_at: string
  updated_at: string
}

export interface InventoryHistoryApiResponse extends InventoryHistory {}

// Interface cho lịch sử kho
export interface InventoryHistory {
  id: number
  product_id: number
  product_name: string
  transaction_type: number
  transaction_type_text: string
  quantity: number
  unit_price: string
  total_price: string
  balance_after: number
  receipt_id?: number
  receipt_code?: string
  description?: string
  created_by: number
  created_at: string
}

// Interface cho phân trang
export interface PaginationResponse {
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// Interface cho response từ API
export interface InventoryReceiptListResponse {
  items: InventoryReceiptApiResponse[]
  pagination: PaginationResponse
}

export interface InventoryHistoryListResponse {
  items: InventoryHistoryApiResponse[]
  pagination: PaginationResponse
}

// Mapper functions
export function mapApiResponseToInventoryReceipt(
  apiReceipt: InventoryReceiptApiResponse
): InventoryReceipt {
  return {
    id: apiReceipt.id,
    code: apiReceipt.code,
    notes: apiReceipt.description, // Thay description thành notes
    status: getInventoryReceiptStatusText(apiReceipt.status), // Chuyển status number thành text
    status_code: apiReceipt.status, // Giữ nguyên status code raw
    total_amount: parseFloat(apiReceipt.total_amount), // Chuyển string thành number
    supplier_id: apiReceipt.supplier_id || 0,
    supplier_name: apiReceipt.supplier_name,
    created_by: apiReceipt.created_by,
    approved_by: apiReceipt.approved_by,
    created_at: apiReceipt.created_at,
    updated_at: apiReceipt.updated_at,
    approved_at: apiReceipt.approved_at,
    items: apiReceipt.items?.map(mapApiResponseToInventoryReceiptItem),
  }
}

export function mapApiResponseToInventoryReceiptItem(
  apiItem: any  // Đổi type để nhận cả product relation
): InventoryReceiptItem {
  return {
    id: apiItem.id,
    receipt_id: apiItem.receipt_id,
    product_id: apiItem.product_id,
    quantity: apiItem.quantity,
    unit_cost: parseFloat(apiItem.unit_cost || apiItem.unit_price || '0'), // Hỗ trợ cả 2 field
    total_price: parseFloat(apiItem.total_price || '0'),
    notes: apiItem.notes,
    created_at: apiItem.created_at,
    updated_at: apiItem.updated_at,
    ...(apiItem.product && { product: apiItem.product }),  // Giữ lại product relation nếu có
  } as any
}

export function mapApiResponseToInventoryHistory(
  apiHistory: InventoryHistoryApiResponse
): InventoryHistory {
  return {
    id: apiHistory.id,
    product_id: apiHistory.product_id,
    product_name: apiHistory.product_name,
    transaction_type: apiHistory.transaction_type,
    transaction_type_text: getInventoryTransactionTypeText(
      apiHistory.transaction_type
    ),
    quantity: apiHistory.quantity,
    unit_price: apiHistory.unit_price,
    total_price: apiHistory.total_price,
    balance_after: apiHistory.balance_after,
    receipt_id: apiHistory.receipt_id,
    receipt_code: apiHistory.receipt_code,
    description: apiHistory.description,
    created_by: apiHistory.created_by,
    created_at: apiHistory.created_at,
  }
}

// Hàm map status sang tên hiển thị Tiếng Việt
export const getInventoryReceiptStatusText = (status: any): string => {
  const s = String(status).toLowerCase();
  const statusMap: { [key: string]: string } = {
    'draft': 'Nháp',
    '1': 'Nháp',
    'approved': 'Đã duyệt',
    '2': 'Đã duyệt',
    '3': 'Đã duyệt',
    'completed': 'Đã duyệt', // Legacy mapping
    '4': 'Đã duyệt',
    'cancelled': 'Đã hủy',
    '5': 'Đã hủy',
  }
  return statusMap[s] || 'Không xác định';
}

/**
 * Hàm chuẩn hóa trạng thái về dạng Enum chuỗi tiếng Anh
 */
export const normalizeReceiptStatus = (status: any): InventoryReceiptStatus => {
  const s = String(status).toLowerCase();
  if (s === 'draft' || s === '1') return InventoryReceiptStatus.DRAFT;
  if (s === 'approved' || s === '2' || s === '3' || s === 'completed' || s === '4') return InventoryReceiptStatus.APPROVED;
  if (s === 'cancelled' || s === '5') return InventoryReceiptStatus.CANCELLED;
  return InventoryReceiptStatus.DRAFT;
}

export const getInventoryTransactionTypeText = (type: InventoryTransactionType): string => {
  switch (type) {
    case InventoryTransactionType.IMPORT:
      return "Nhập kho"
    case InventoryTransactionType.EXPORT:
      return "Xuất kho"
    case InventoryTransactionType.ADJUSTMENT:
      return "Điều chỉnh"
    default:
      return "Không xác định"
  }
}

// Request interfaces
// Interface cho request tạo phiếu nhập hàng
export interface CreateInventoryReceiptRequest extends AnyObject {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  receipt_code?: string // Mã phiếu nhập (tùy chọn - backend tự sinh nếu không có)
  supplier_id: number // ID nhà cung cấp (bắt buộc)
  total_amount: number // Tổng tiền (bắt buộc)
  notes?: string // Ghi chú (tùy chọn)
  status: string // Trạng thái phiếu nhập: draft, approved, cancelled (bắt buộc)
  created_by: number // ID người tạo (bắt buộc)
  items: CreateInventoryReceiptItemRequest[] // Danh sách chi tiết phiếu nhập
  
  // ===== TRƯỜNG MỚI - PHÍ VẬN CHUYỂN =====
  shared_shipping_cost?: number // Phí vận chuyển chung (tùy chọn)
  shipping_allocation_method?: 'by_value' | 'by_quantity' // Phương thức phân bổ (tùy chọn)
}

// Interface cho request cập nhật phiếu nhập hàng
export interface UpdateInventoryReceiptRequest
  extends Partial<CreateInventoryReceiptRequest>,
    AnyObject {
  id: number // ID của phiếu nhập cần cập nhật
}

// Interface cho form chi tiết phiếu nhập hàng
export interface InventoryReceiptItemForm
  extends CreateInventoryReceiptItemRequest {
  key: string
  product_name?: string
}

// Interface cho request tạo chi tiết phiếu nhập hàng
export interface CreateInventoryReceiptItemRequest extends AnyObject {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  product_id: number // ID sản phẩm (bắt buộc)
  quantity: number // Số lượng (bắt buộc)
  unit_cost: number // Giá vốn đơn vị (bắt buộc)
  total_price: number // Tổng tiền (bắt buộc)
  notes?: string // Ghi chú (tùy chọn)
  
  // ===== TRƯỜNG MỚI - PHÍ VẬN CHUYỂN =====
  individual_shipping_cost?: number // Phí vận chuyển riêng cho sản phẩm này (tùy chọn)
}

// Interface cho request cập nhật chi tiết phiếu nhập hàng
export interface UpdateInventoryReceiptItemRequest
  extends Partial<CreateInventoryReceiptItemRequest>,
    AnyObject {
  id: number // ID của chi tiết phiếu nhập cần cập nhật
}

// Interface cho request nhập kho
export interface StockInRequest extends AnyObject {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  receipt_id: number // ID phiếu nhập
  product_id: number // ID sản phẩm
  quantity: number // Số lượng nhập
  unit_cost_price: string // Giá vốn đơn vị
  total_cost_price: string // Tổng giá vốn
  batch_number?: string // Số lô (tùy chọn)
  expiry_date?: string // Ngày hết hạn (tùy chọn)
  notes?: string // Ghi chú (tùy chọn)
  created_by_user_id: number // ID người tạo
}

// Interface cho request xuất kho
export interface StockOutRequest extends AnyObject {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  product_id: number // ID sản phẩm
  quantity: number // Số lượng xuất
  unit_selling_price: string // Giá bán đơn vị
  total_selling_price: string // Tổng giá bán
  customer_info?: string // Thông tin khách hàng (tùy chọn)
  notes?: string // Ghi chú (tùy chọn)
  created_by_user_id: number // ID người tạo
}

// Response interfaces
export interface InventoryReceiptResponse
  extends ApiResponse<InventoryReceipt> {}

export interface InventoryReceiptListApiResponse
  extends ApiResponse<{
    items: InventoryReceipt[]
    total: number
  }> {}

export interface InventoryHistoryResponse
  extends ApiResponse<InventoryHistory> {}

export interface InventoryHistoryListApiResponse
  extends ApiResponse<{
    items: InventoryHistory[]
    total: number
  }> {}

// Query parameters
export interface InventoryReceiptListParams {
  limit?: number
  offset?: number
  status?: string // Backend mong đợi string
  code?: string
  supplierName?: string
  startDate?: string
  endDate?: string
}

export interface InventoryHistoryListParams {
  limit?: number
  offset?: number
  productId?: number
  transactionType?: number
  startDate?: string
  endDate?: string
}

// Inventory models and interfaces
export interface InventoryBatch {
  id: number
  product_id: number
  batch_number: string
  quantity: number
  unit_cost_price: string
  total_cost_price: string
  expiry_date?: string
  supplier_id?: number
  received_at: string
  created_by_user_id: number
  created_at: string
  updated_at: string
}

export interface InventoryTransaction {
  id: number
  product_id: number
  transaction_type: InventoryTransactionType
  quantity: number
  unit_cost_price: string
  total_cost_price: string
  reference_id?: number
  reference_type?: string
  notes?: string
  created_by_user_id: number
  created_at: string
  updated_at: string
}

// Request DTOs
export interface CreateInventoryBatchRequest extends AnyObject {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  product_id: number
  batch_number: string
  quantity: number
  unit_cost_price: string
  total_cost_price: string
  expiry_date?: string
  supplier_id?: number
  received_at: string
  created_by_user_id: number
}

export interface CreateInventoryTransactionRequest extends AnyObject {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  product_id: number
  transaction_type: InventoryTransactionType
  quantity: number
  unit_cost_price: string
  total_cost_price: string
  reference_id?: number
  reference_type?: string
  notes?: string
  created_by_user_id: number
}

// Stock operation interfaces

// Inventory summary and reports
export interface InventorySummary {
  product_id: number
  product_name: string
  current_stock: number
  reserved_stock: number
  available_stock: number
  average_cost_price: string
  total_value: string
  last_updated: string
}

export interface InventoryValueReport {
  total_inventory_value: string
  total_products: number
  low_stock_items: number
  out_of_stock_items: number
  report_date: string
}

export interface LowStockAlert {
  product_id: number
  product_name: string
  current_stock: number
  minimum_stock_level: number
  alert_date: string
}

export interface ExpiringBatchAlert {
  batch_id: number
  product_id: number
  product_name: string
  batch_number: string
  expiry_date: string
  days_until_expiry: number
  alert_date: string
}

export interface FifoCalculation {
  product_id: number
  quantity_requested: number
  calculated_cost: string
  remaining_stock: number
  fifo_layers: Array<{
    batch_id: number
    quantity: number
    unit_cost: string
    total_cost: string
  }>
}

export interface BatchTrackingInfo {
  batch_id: number
  product_id: number
  product_name: string
  batch_number: string
  initial_quantity: number
  current_quantity: number
  unit_cost_price: string
  total_initial_cost: string
  total_current_value: string
  received_at: string
  expiry_date?: string
  supplier_name?: string
  created_by_user_id: number
  created_at: string
  updated_at: string
}

export interface FifoValue {
  product_id: number
  product_name: string
  current_stock: number
  fifo_value: string
  average_cost_value: string
  difference: string
  last_calculated: string
}

export interface WeightedAverageCost {
  product_id: number
  product_name: string
  current_stock: number
  total_cost: string
  weighted_average_cost: string
  last_updated: string
}
