// Định nghĩa các kiểu dữ liệu cho quản lý nhập hàng (Inventory Management)

import { ApiResponse } from "./auth.model"

// Enum cho trạng thái phiếu nhập hàng
export enum InventoryReceiptStatus {
  DRAFT = 0,        // Nháp
  PENDING = 1,      // Chờ duyệt
  APPROVED = 2,     // Đã duyệt
  COMPLETED = 3,    // Hoàn thành (đã nhập kho)
  CANCELLED = 4     // Đã hủy
}

// Enum cho loại giao dịch kho
export enum InventoryTransactionType {
  STOCK_IN = 1,     // Nhập kho
  STOCK_OUT = 2,    // Xuất kho
  ADJUSTMENT = 3    // Điều chỉnh
}

// Interface cho phiếu nhập hàng từ API
export interface InventoryReceiptApiResponse {
  id: number
  code: string
  description?: string
  status: number
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
  items?: InventoryReceiptItemApiResponse[]
}

// Interface cho chi tiết phiếu nhập hàng (items) từ API
export interface InventoryReceiptItemApiResponse {
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

// Interface cho lịch sử kho từ API
export interface InventoryHistoryApiResponse {
  id: number
  productId: number
  productName: string
  transactionType: number
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

// Interface cho phiếu nhập hàng đã được chuyển đổi
export interface InventoryReceipt {
  id: number
  code: string
  description?: string
  status: InventoryReceiptStatus
  statusText: string
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

// Interface cho chi tiết phiếu nhập hàng
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
  transactionType: InventoryTransactionType
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
    items: apiReceipt.items?.map(mapApiResponseToInventoryReceiptItem)
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
    updatedAt: apiItem.updatedAt
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
    transactionTypeText: getInventoryTransactionTypeText(apiHistory.transactionType),
    quantity: apiHistory.quantity,
    unitPrice: apiHistory.unitPrice,
    totalPrice: apiHistory.totalPrice,
    balanceAfter: apiHistory.balanceAfter,
    receiptId: apiHistory.receiptId,
    receiptCode: apiHistory.receiptCode,
    description: apiHistory.description,
    createdBy: apiHistory.createdBy,
    createdAt: apiHistory.createdAt
  }
}

// Helper functions
export function getInventoryReceiptStatusText(status: number): string {
  switch (status) {
    case InventoryReceiptStatus.DRAFT:
      return 'Nháp'
    case InventoryReceiptStatus.PENDING:
      return 'Chờ duyệt'
    case InventoryReceiptStatus.APPROVED:
      return 'Đã duyệt'
    case InventoryReceiptStatus.COMPLETED:
      return 'Hoàn thành'
    case InventoryReceiptStatus.CANCELLED:
      return 'Đã hủy'
    default:
      return 'Không xác định'
  }
}

export function getInventoryTransactionTypeText(type: number): string {
  switch (type) {
    case InventoryTransactionType.STOCK_IN:
      return 'Nhập kho'
    case InventoryTransactionType.STOCK_OUT:
      return 'Xuất kho'
    case InventoryTransactionType.ADJUSTMENT:
      return 'Điều chỉnh'
    default:
      return 'Không xác định'
  }
}

// Request interfaces
export interface CreateInventoryReceiptRequest {
  [key: string]: unknown
  description?: string
  supplierName?: string
  supplierContact?: string
  items: CreateInventoryReceiptItemRequest[]
}

export interface CreateInventoryReceiptItemRequest {
  productId: number
  quantity: number
  unitPrice: string
  expiryDate?: string
  batchNumber?: string
  notes?: string
}

export interface UpdateInventoryReceiptRequest extends Partial<CreateInventoryReceiptRequest> {
  id: number
}

export interface UpdateInventoryReceiptItemRequest extends Partial<CreateInventoryReceiptItemRequest> {
  id: number
}

// Response interfaces
export interface InventoryReceiptResponse extends ApiResponse<InventoryReceipt> {}

export interface InventoryReceiptListApiResponse extends ApiResponse<{
  items: InventoryReceipt[]
  total: number
}> {}

export interface InventoryHistoryResponse extends ApiResponse<InventoryHistory> {}

export interface InventoryHistoryListApiResponse extends ApiResponse<{
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

// Stock-in request interface
export interface StockInRequest {
  [key: string]: unknown
  receiptId: number
}