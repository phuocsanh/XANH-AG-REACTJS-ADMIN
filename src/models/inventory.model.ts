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
  bill_date?: string // Ngày trên hóa đơn/ngày nhập hàng thực tế
  status: string // Trạng thái là string text tiếng Việt (đã map) hoặc raw string
  status_code?: string // status code raw (draft, pending...)
  total_amount: number // Thay totalAmount thành total_amount và string thành number để khớp với backend
  supplier_id?: number // Thay supplierName thành supplier_id để khớp với backend
  supplier_name?: string // Thêm supplier_name để hiển thị
  supplier?: { id: number; name: string; code?: string; contact_person?: string; phone?: string; address?: string }
  created_by: number
  approved_by?: number
  created_at: string
  updated_at: string
  approved_at?: string
  items?: InventoryReceiptItem[]
  
  // Relations
  creator?: { id: number; username: string; full_name?: string }
  approver?: { id: number; username: string; full_name?: string }
  
  // Payment fields
  paid_amount?: number
  payment_status?: 'unpaid' | 'partial' | 'paid'
  payment_method?: string
  payment_due_date?: string
  
  // Adjustment fields
  adjusted_amount?: number
  returned_amount?: number
  final_amount?: number
  supplier_amount?: number
  debt_amount?: number
  shared_shipping_cost?: number
  shipping_allocation_method?: string
  
  // Discount fields
  discount_amount?: number
  discount_value?: number
  discount_type?: 'percentage' | 'fixed_amount'
  
  // Flags
  has_returns?: boolean
  has_adjustments?: boolean
  is_payment_locked?: boolean
  
  // Images
  images?: string[] // Mảng URL ảnh hóa đơn
  
  // Tax
  is_taxable?: boolean // Phiếu có hóa đơn đầu vào
  
  // Relations
  payments?: InventoryReceiptPayment[]
}

// Interface cho payment record
export interface InventoryReceiptPayment {
  id: number
  receipt_id: number
  payment_date: string
  amount: number
  payment_method: string
  notes?: string
  created_by: number
  created_at: string
  updated_at: string
  deleted_at?: string
  creator?: {
    id: number
    username: string
    account?: string
  }
}

// Interface cho thống kê phiếu nhập hàng (8 chỉ số)
export interface InventoryReceiptStats {
  totalReceipts: number
  draftReceipts: number
  approvedReceipts: number
  cancelledReceipts: number
  debtReceiptsCount: number
  totalValue: string | number
  totalPaid: string | number
  totalDebt: string | number
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
  product_name?: string
  unit_name?: string
  product?: any // Thay bằng Product interface nếu có thể import
  batch_number?: string
  expiry_date?: string
  individual_shipping_cost?: number
  discount_amount?: number
  discount_value?: number
  discount_type?: 'percentage' | 'fixed_amount'
}

// Giữ lại các interface ApiResponse để tương thích với backend (nếu cần)
export interface InventoryReceiptApiResponse {
  id: number
  code: string
  description?: string // Giữ nguyên để tương thích với API response
  bill_date?: string // Ngày hóa đơn
  status: string // Backend trả về string
  total_amount: string // Thay totalAmount thành total_amount
  supplier_id?: number // Thêm supplier_id
  supplier_name?: string // Thay supplierName thành supplier_name
  supplier?: { id: number; name: string; code?: string; contact_person?: string; phone?: string; address?: string } // Thêm object supplier đầy đủ
  supplier_contact?: string // Thay supplierContact thành supplier_contact
  created_by: number
  approved_by?: number
  created_at: string
  updated_at: string
  approved_at?: string
  shipping_allocation_method?: string
  discount_amount?: string | number
  discount_value?: string | number
  discount_type?: string
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
// Helper function để lấy tên hiển thị của user (Nickname hoặc Account)
const formatUserDisplayName = (user: any) => {
  if (!user) return undefined;
  return user.user_profile?.nickname || user.full_name || user.account || user.username || `ID: ${user.id}`;
};

export function mapApiResponseToInventoryReceipt(
  apiReceipt: any // Đổi sang any để nhận thêm payment fields
): InventoryReceipt {
  return {
    id: apiReceipt.id,
    code: apiReceipt.code,
    notes: apiReceipt.description || apiReceipt.notes, // Hỗ trợ cả 2 fields
    bill_date: apiReceipt.bill_date,
    status: getInventoryReceiptStatusText(apiReceipt.status), // Chuyển status number thành text
    status_code: apiReceipt.status, // Giữ nguyên status code raw
    total_amount: parseFloat(apiReceipt.total_amount), // Chuyển string thành number
    supplier_id: apiReceipt.supplier_id || (apiReceipt.supplier?.id || 0),
    supplier_name: apiReceipt.supplier?.name || apiReceipt.supplier_name,
    supplier: apiReceipt.supplier,
    created_by: apiReceipt.created_by,
    approved_by: apiReceipt.approved_by,
    created_at: apiReceipt.created_at,
    updated_at: apiReceipt.updated_at,
    approved_at: apiReceipt.approved_at,
    items: apiReceipt.items?.map(mapApiResponseToInventoryReceiptItem),
    
    // Payment fields
    paid_amount: apiReceipt.paid_amount ? parseFloat(apiReceipt.paid_amount) : 0,
    payment_status: apiReceipt.payment_status,
    payment_method: apiReceipt.payment_method,
    payment_due_date: apiReceipt.payment_due_date,
    
    // Adjustment fields
    adjusted_amount: apiReceipt.adjusted_amount ? parseFloat(apiReceipt.adjusted_amount) : 0,
    returned_amount: apiReceipt.returned_amount ? parseFloat(apiReceipt.returned_amount) : 0,
    final_amount: apiReceipt.final_amount ? parseFloat(apiReceipt.final_amount) : undefined,
    supplier_amount: apiReceipt.supplier_amount ? parseFloat(apiReceipt.supplier_amount) : undefined,
    debt_amount: apiReceipt.debt_amount ? parseFloat(apiReceipt.debt_amount) : 0,
    shared_shipping_cost: apiReceipt.shared_shipping_cost ? parseFloat(apiReceipt.shared_shipping_cost) : 0,
    shipping_allocation_method: apiReceipt.shipping_allocation_method,
    
    // Discount fields
    discount_amount: apiReceipt.discount_amount ? parseFloat(apiReceipt.discount_amount) : 0,
    discount_value: apiReceipt.discount_value ? parseFloat(apiReceipt.discount_value) : 0,
    discount_type: apiReceipt.discount_type,
    
    // Flags
    has_returns: apiReceipt.has_returns,
    has_adjustments: apiReceipt.has_adjustments,
    is_payment_locked: apiReceipt.is_payment_locked,
    
    // Relations
    payments: apiReceipt.payments,
    creator: apiReceipt.creator ? {
      ...apiReceipt.creator,
      full_name: formatUserDisplayName(apiReceipt.creator)
    } : undefined,
    approver: apiReceipt.approver ? {
      ...apiReceipt.approver,
      full_name: formatUserDisplayName(apiReceipt.approver)
    } : undefined,
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
    expiry_date: apiItem.expiry_date, // Thêm expiry_date
    batch_number: apiItem.batch_number, // Thêm batch_number
    individual_shipping_cost: apiItem.individual_shipping_cost ? parseFloat(apiItem.individual_shipping_cost) : 0,
    discount_amount: apiItem.discount_amount ? parseFloat(apiItem.discount_amount) : 0,
    discount_value: apiItem.discount_value ? parseFloat(apiItem.discount_value) : 0,
    discount_type: apiItem.discount_type,
    notes: apiItem.notes,
    created_at: apiItem.created_at,
    updated_at: apiItem.updated_at,
    product_name: apiItem.product?.trade_name || apiItem.product?.name || apiItem.product_name || '',
    unit_name: apiItem.product?.unit?.name || apiItem.product?.unit_name || apiItem.unit_name || '',
    ...(apiItem.product && { product: apiItem.product }),  // Giữ lại product relation nếu có
  }
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
  const s = String(status || '').toLowerCase().trim();
  // English codes or raw numbers
  if (s === 'draft' || s === '1') return InventoryReceiptStatus.DRAFT;
  if (s === 'approved' || s === '2' || s === '3' || s === 'completed' || s === '4') return InventoryReceiptStatus.APPROVED;
  if (s === 'cancelled' || s === '5') return InventoryReceiptStatus.CANCELLED;
  
  // Vietnamese labels (as fallback)
  if (s === 'nháp') return InventoryReceiptStatus.DRAFT;
  if (s === 'đã duyệt') return InventoryReceiptStatus.APPROVED;
  if (s === 'đã hủy') return InventoryReceiptStatus.CANCELLED;
  
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
  bill_date?: string // Ngày hóa đơn (tùy chọn)
  status: string // Trạng thái phiếu nhập: draft, approved, cancelled (bắt buộc)
  created_by: number // ID người tạo (bắt buộc)
  items: CreateInventoryReceiptItemRequest[] // Danh sách chi tiết phiếu nhập
  
  // ===== TRƯỜNG MỚI - PHÍ VẬN CHUYỂN =====
  shared_shipping_cost?: number // Phí vận chuyển chung (tùy chọn)
  shipping_allocation_method?: 'by_value' | 'by_quantity' // Phương thức phân bổ (tùy chọn)
  
  // ===== TRƯỜNG MỚI - THUẾ =====
  is_taxable?: boolean // Có hóa đơn đầu vào
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
  scientific_name?: string
  unit_name?: string
}

// Interface cho request tạo chi tiết phiếu nhập hàng
export interface CreateInventoryReceiptItemRequest extends AnyObject {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  product_id: number // ID sản phẩm (bắt buộc)
  quantity: number // Số lượng (bắt buộc)
  unit_cost: number // Giá vốn đơn vị (bắt buộc)
  total_price: number // Tổng tiền (bắt buộc)
  expiry_date?: string // Ngày hết hạn (tùy chọn)
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
  supplier_id?: number // Thêm supplier_id param
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
  remaining_quantity: number

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
  creator?: { id: number; username: string; full_name?: string }
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
