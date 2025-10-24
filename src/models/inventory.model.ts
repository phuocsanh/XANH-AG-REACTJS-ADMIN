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

// Interface cho phiếu nhập hàng - sử dụng trực tiếp từ API với các trường bổ sung
export interface InventoryReceipt {
  id: number
  code: string
  description?: string
  status: number
  statusText: string // Trường bổ sung để hiển thị text trạng thái
  totalAmount: string
  supplierName?: string
  supplierContact?: string
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
  productName: string
  quantity: number
  unitPrice: string
  totalPrice: string
  expiryDate?: string
  batchNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Interface cho lịch sử kho
export interface InventoryHistory {
  id: number
  productId: number
  productName: string
  transactionType: number
  transactionTypeText: string // Trường bổ sung để hiển thị text loại giao dịch
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

// Giữ lại các interface ApiResponse để tương thích với backend (nếu cần)
export interface InventoryReceiptApiResponse extends InventoryReceipt {}
export interface InventoryReceiptItemApiResponse extends InventoryReceiptItem {}
export interface InventoryHistoryApiResponse extends InventoryHistory {}

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
    description: apiReceipt.description,
    status: apiReceipt.status as InventoryReceiptStatus,
    statusText: getInventoryReceiptStatusText(apiReceipt.status),
    totalAmount: apiReceipt.totalAmount,
    supplierName: apiReceipt.supplierName,
    supplierContact: apiReceipt.supplierContact,
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
    productName: apiItem.productName,
    quantity: apiItem.quantity,
    unitPrice: apiItem.unitPrice,
    totalPrice: apiItem.totalPrice,
    expiryDate: apiItem.expiryDate,
    batchNumber: apiItem.batchNumber,
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
// Hàm helper để lấy text trạng thái
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

// Hàm helper để lấy text loại giao dịch
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
  receiptCode: string // Mã phiếu nhập hàng (bắt buộc)
  supplierName?: string // Tên nhà cung cấp (tùy chọn)
  supplierContact?: string // Liên hệ nhà cung cấp (tùy chọn)
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
