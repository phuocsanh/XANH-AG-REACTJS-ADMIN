// Định nghĩa các kiểu dữ liệu cho quản lý nhập hàng (Inventory Management)

import { ApiResponse } from "./auth.model"

// Enum cho trạng thái phiếu nhập hàng
export enum InventoryReceiptStatus {
  DRAFT = 1,
  PENDING = 2,
  APPROVED = 3,
  COMPLETED = 4,
  CANCELLED = 5,
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
  status: string // Thay number thành string để khớp với backend
  totalAmount: number // Thay string thành number để khớp với backend
  supplierId?: number // Thay supplierName thành supplierId để khớp với backend
  createdBy: number
  approvedBy?: number
  completedBy?: number
  createdAt: string
  updatedAt: string
  approvedAt?: string
  completedAt?: string
  items?: InventoryReceiptItem[]
}

// Interface cho chi tiết phiếu nhập hàng (items)
export interface InventoryReceiptItem {
  id: number
  receiptId: number
  productId: number
  quantity: number
  unitCost: number // Thay unitPrice thành unitCost và string thành number để khớp với backend
  totalPrice: number // Thay string thành number để khớp với backend
  notes?: string
  createdAt: string
  updatedAt: string
}

// Giữ lại các interface ApiResponse để tương thích với backend (nếu cần)
export interface InventoryReceiptApiResponse {
  id: number
  code: string
  description?: string // Giữ nguyên để tương thích với API response
  status: number // Giữ nguyên để tương thích với API response
  totalAmount: string // Giữ nguyên để tương thích với API response
  supplierName?: string // Giữ nguyên để tương thích với API response
  supplierContact?: string // Giữ nguyên để tương thích với API response
  createdBy: number
  approvedBy?: number
  completedBy?: number
  createdAt: string
  updatedAt: string
  approvedAt?: string
  completedAt?: string
  items?: InventoryReceiptItemApiResponse[]
}

export interface InventoryReceiptItemApiResponse {
  id: number
  receiptId: number
  productId: number
  productName: string // Giữ nguyên để tương thích với API response
  quantity: number
  unitPrice: string // Giữ nguyên để tương thích với API response
  totalPrice: string // Giữ nguyên để tương thích với API response
  expiryDate?: string // Giữ nguyên để tương thích với API response
  batchNumber?: string // Giữ nguyên để tương thích với API response
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InventoryHistoryApiResponse extends InventoryHistory {}

// Interface cho lịch sử kho
export interface InventoryHistory {
  id: number
  productId: number
  productName: string
  transactionType: number
  transactionTypeText: string
  quantity: number
  unitPrice: string
  totalPrice: string
  balanceAfter: number
  receiptId?: number
  receiptCode?: string
  description?: string
  createdBy: number
  createdAt: string
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
    totalAmount: parseFloat(apiReceipt.totalAmount), // Chuyển string thành number
    supplierId: 0, // Tạm thời đặt là 0, sẽ cập nhật sau khi có API chính xác
    createdBy: apiReceipt.createdBy,
    approvedBy: apiReceipt.approvedBy,
    completedBy: apiReceipt.completedBy,
    createdAt: apiReceipt.createdAt,
    updatedAt: apiReceipt.updatedAt,
    approvedAt: apiReceipt.approvedAt,
    completedAt: apiReceipt.completedAt,
    items: apiReceipt.items?.map(mapApiResponseToInventoryReceiptItem),
  }
}

export function mapApiResponseToInventoryReceiptItem(
  apiItem: InventoryReceiptItemApiResponse
): InventoryReceiptItem {
  return {
    id: apiItem.id,
    receiptId: apiItem.receiptId,
    productId: apiItem.productId,
    quantity: apiItem.quantity,
    unitCost: parseFloat(apiItem.unitPrice), // Thay unitPrice thành unitCost và chuyển string thành number
    totalPrice: parseFloat(apiItem.totalPrice), // Chuyển string thành number
    notes: apiItem.notes,
    createdAt: apiItem.createdAt,
    updatedAt: apiItem.updatedAt,
  }
}

export function mapApiResponseToInventoryHistory(
  apiHistory: InventoryHistoryApiResponse
): InventoryHistory {
  return {
    id: apiHistory.id,
    productId: apiHistory.productId,
    productName: apiHistory.productName,
    transactionType: apiHistory.transactionType as InventoryTransactionType,
    transactionTypeText: getInventoryTransactionTypeText(
      apiHistory.transactionType
    ),
    quantity: apiHistory.quantity,
    unitPrice: apiHistory.unitPrice,
    totalPrice: apiHistory.totalPrice,
    balanceAfter: apiHistory.balanceAfter,
    receiptId: apiHistory.receiptId,
    receiptCode: apiHistory.receiptCode,
    description: apiHistory.description,
    createdBy: apiHistory.createdBy,
    createdAt: apiHistory.createdAt,
  }
}

// Helper functions
export const getInventoryReceiptStatusText = (status: number): string => {
  switch (status) {
    case InventoryReceiptStatus.DRAFT:
      return "Nháp"
    case InventoryReceiptStatus.PENDING:
      return "Chờ duyệt"
    case InventoryReceiptStatus.APPROVED:
      return "Đã duyệt"
    case InventoryReceiptStatus.COMPLETED:
      return "Hoàn thành"
    case InventoryReceiptStatus.CANCELLED:
      return "Đã hủy"
    default:
      return "Không xác định"
  }
}

export const getInventoryTransactionTypeText = (type: number): string => {
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
// Interface cho request tạo phiếu nhập hàng mới (khớp với backend DTO)
export interface CreateInventoryReceiptRequest {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  code: string // Mã phiếu nhập hàng (bắt buộc) - thay receiptCode thành code
  supplierId?: number // ID nhà cung cấp (tùy chọn) - thay supplierName thành supplierId
  totalAmount: number // Tổng tiền (bắt buộc)
  notes?: string // Ghi chú (tùy chọn)
  status: string // Trạng thái (bắt buộc)
  items: CreateInventoryReceiptItemRequest[] // Danh sách sản phẩm (bắt buộc)
}

// Interface cho request tạo chi tiết phiếu nhập hàng (khớp với backend DTO)
export interface CreateInventoryReceiptItemRequest {
  productId: number // ID sản phẩm (bắt buộc)
  quantity: number // Số lượng (bắt buộc)
  unitCost: number // Giá vốn đơn vị (bắt buộc)
  totalPrice: number // Tổng giá tiền (bắt buộc)
  notes?: string // Ghi chú (tùy chọn)
}

// Interface cho form chi tiết phiếu nhập hàng - sử dụng trong UI
export interface InventoryReceiptItemForm
  extends CreateInventoryReceiptItemRequest {
  key: string
  productName?: string
}

export interface UpdateInventoryReceiptRequest
  extends Partial<CreateInventoryReceiptRequest> {
  id: number
}

export interface UpdateInventoryReceiptItemRequest
  extends Partial<CreateInventoryReceiptItemRequest> {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  id: number
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
  status?: number
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
  productId: number
  batchCode?: string
  unitCostPrice: string
  originalQuantity: number
  remainingQuantity: number
  expiryDate?: Date
  manufacturingDate?: Date
  supplierId?: number
  notes?: string
  receiptItemId?: number
  createdAt: Date
  updatedAt: Date
}

export interface InventoryTransaction {
  id: number
  productId: number
  transactionType: string
  quantity: number
  unitCostPrice: string
  totalCostValue: string
  remainingQuantity: number
  newAverageCost: string
  receiptItemId?: number
  referenceType?: string
  referenceId?: number
  notes?: string
  createdByUserId: number
  createdAt: Date
  updatedAt: Date
}

// Request DTOs
export interface CreateInventoryBatchRequest {
  productId: number
  batchCode?: string
  unitCostPrice: string
  originalQuantity: number
  remainingQuantity: number
  expiryDate?: Date
  manufacturingDate?: Date
  supplierId?: number
  notes?: string
  receiptItemId?: number
}

export interface CreateInventoryTransactionRequest {
  productId: number
  transactionType: string
  quantity: number
  unitCostPrice: string
  totalCostValue: string
  remainingQuantity: number
  newAverageCost: string
  receiptItemId?: number
  referenceType?: string
  referenceId?: number
  notes?: string
  createdByUserId: number
}

// Stock operation interfaces
export interface StockInRequest {
  productId: number
  quantity: number
  unitCost: number
  receiptItemId?: number
  batchCode?: string
  expiryDate?: Date
}

export interface StockOutRequest {
  productId: number
  quantity: number
  referenceType: string
  referenceId?: number
  notes?: string
}

// Inventory summary and reports
export interface InventorySummary {
  productId: number
  totalQuantity: number
  totalValue: string
  averageCost: string
  batches: InventoryBatch[]
}

export interface InventoryValueReport {
  productId: number
  productName: string
  quantity: number
  averageCost: string
  totalValue: string
}

export interface LowStockAlert {
  productId: number
  productName: string
  currentQuantity: number
  threshold: number
}

export interface ExpiringBatchAlert {
  batchId: number
  productId: number
  productName: string
  batchCode?: string
  expiryDate: Date
  remainingQuantity: number
  daysUntilExpiry: number
}

export interface FifoCalculation {
  totalCost: string
  averageCost: string
  batches: {
    batchId: number
    quantity: number
    unitCost: string
    totalCost: string
  }[]
}

export interface BatchTrackingInfo {
  productId: number
  productName: string
  batches: {
    id: number
    batchCode?: string
    originalQuantity: number
    remainingQuantity: number
    unitCostPrice: string
    expiryDate?: Date
    manufacturingDate?: Date
    createdAt: Date
  }[]
}
