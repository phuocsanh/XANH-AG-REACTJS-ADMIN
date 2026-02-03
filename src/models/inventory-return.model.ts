// Model cho Phiếu Xuất Trả Hàng (Return)

export interface ReturnItem {
  product_id: number
  quantity: number
  unit_cost: number
  total_price: number
  reason?: string
  notes?: string
}

export interface CreateReturnRequest {
  return_code: string
  receipt_id?: number
  supplier_id: number
  total_amount: number
  reason: string
  status?: 'draft' | 'approved' | 'cancelled'
  notes?: string
  created_by: number
  items: ReturnItem[]
}

export interface InventoryReturn {
  id: number
  code: string
  receipt_id?: number
  supplier_id?: number
  supplier_name?: string
  total_amount: number
  reason?: string
  status: string
  notes?: string
  images?: string[]
  created_by: number
  created_at: string
  updated_at: string
  deleted_at?: string
  
  // Refund fields
  refund_amount?: number
  refund_status?: 'pending' | 'partial' | 'refunded'
  refund_method?: string
  
  // Relations
  receipt?: any
  supplier?: any
  items?: InventoryReturnItem[]
  refunds?: InventoryReturnRefund[]
  
  // Timestamps
  approved_at?: string
  cancelled_at?: string
}

// Type alias cho return item
export type InventoryReturnItem = ReturnItem

// Interface cho refund record
export interface InventoryReturnRefund {
  id: number
  return_id: number
  refund_date: string
  amount: number
  refund_method: string
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

export interface ReturnApiResponse {
  id: number
  code: string
  receipt_id?: number
  supplier_id: number
  supplier_name?: string
  total_amount: string
  reason: string
  status: string | number  // Hỗ trợ cả string ('draft') và number (0)
  notes?: string
  created_by: number
  created_at: string
  updated_at: string
  approved_at?: string
  completed_at?: string
  cancelled_at?: string
  items?: ReturnItem[]
  supplier?: {
    id: number
    name: string
    code: string
  }
}

// Enum cho trạng thái phiếu trả hàng (Chuẩn hóa dạng chuỗi tiếng Anh)
export enum ReturnStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
}

// Hàm map status sang tên hiển thị Tiếng Việt
export const getReturnStatusText = (status: any): string => {
  const s = String(status).toLowerCase();
  const statusMap: { [key: string]: string } = {
    'draft': 'Nháp',
    '0': 'Nháp',
    'approved': 'Đã duyệt',
    '2': 'Đã duyệt',
    'completed': 'Đã duyệt', // Legacy mapping
    '3': 'Đã duyệt',
    'cancelled': 'Đã hủy',
    '4': 'Đã hủy',
  }
  return statusMap[s] || 'Không xác định';
}

/**
 * Hàm chuẩn hóa trạng thái về dạng Enum chuỗi tiếng Anh
 */
export const normalizeReturnStatus = (status: any): ReturnStatus => {
  const s = String(status).toLowerCase();
  if (s === 'draft' || s === '0') return ReturnStatus.DRAFT;
  if (s === 'approved' || s === '2' || s === 'completed' || s === '3') return ReturnStatus.APPROVED;
  if (s === 'cancelled' || s === '4') return ReturnStatus.CANCELLED;
  return ReturnStatus.DRAFT;
}

// Hàm map API response sang InventoryReturn
export const mapApiResponseToReturn = (
  apiReturn: ReturnApiResponse
): InventoryReturn => {
  // Normalize status: nếu là number thì convert sang string code
  let normalizedStatus: string;
  if (typeof apiReturn.status === 'number') {
    const statusCodeMap: { [key: number]: string } = {
      0: 'draft',
      2: 'approved',
      4: 'cancelled',
    };
    normalizedStatus = statusCodeMap[apiReturn.status] || 'draft';
  } else {
    normalizedStatus = apiReturn.status;
  }

  return {
    id: apiReturn.id,
    code: apiReturn.code,
    receipt_id: apiReturn.receipt_id,
    supplier_id: apiReturn.supplier_id,
    supplier_name: apiReturn.supplier_name,
    total_amount: parseFloat(apiReturn.total_amount || '0'),
    reason: apiReturn.reason,
    status: normalizedStatus,  // Giữ nguyên status code ('draft', 'approved', ...)
    notes: apiReturn.notes,
    created_by: apiReturn.created_by,
    created_at: apiReturn.created_at,
    updated_at: apiReturn.updated_at,
    items: apiReturn.items,
    supplier: apiReturn.supplier,
    approved_at: apiReturn.approved_at,
    cancelled_at: apiReturn.cancelled_at,
  }
}

// Xóa Enum cũ vì đã định nghĩa ở trên
