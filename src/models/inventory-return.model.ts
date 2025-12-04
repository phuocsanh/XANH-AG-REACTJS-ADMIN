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
  status?: 'draft' | 'approved' | 'completed' | 'cancelled'
  notes?: string
  created_by: number
  items: ReturnItem[]
}

export interface InventoryReturn {
  id: number
  code: string
  receipt_id?: number
  supplier_id: number
  supplier_name?: string
  total_amount: string
  reason: string
  status: string
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

export interface ReturnApiResponse {
  id: number
  code: string
  receipt_id?: number
  supplier_id: number
  supplier_name?: string
  total_amount: string
  reason: string
  status: number
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

// Hàm map status từ number sang string
export const getReturnStatusText = (status: number | string): string => {
  if (typeof status === 'string') return status
  
  const statusMap: { [key: number]: string } = {
    0: 'Nháp',
    1: 'Chờ duyệt',
    2: 'Đã duyệt',
    3: 'Hoàn thành',
    4: 'Đã hủy',
  }
  return statusMap[status] || 'Không xác định'
}

// Hàm map API response sang InventoryReturn
export const mapApiResponseToReturn = (
  apiReturn: ReturnApiResponse
): InventoryReturn => {
  return {
    id: apiReturn.id,
    code: apiReturn.code,
    receipt_id: apiReturn.receipt_id,
    supplier_id: apiReturn.supplier_id,
    supplier_name: apiReturn.supplier_name,
    total_amount: apiReturn.total_amount,
    reason: apiReturn.reason,
    status: getReturnStatusText(apiReturn.status),
    notes: apiReturn.notes,
    created_by: apiReturn.created_by,
    created_at: apiReturn.created_at,
    updated_at: apiReturn.updated_at,
    approved_at: apiReturn.approved_at,
    completed_at: apiReturn.completed_at,
    cancelled_at: apiReturn.cancelled_at,
    items: apiReturn.items,
    supplier: apiReturn.supplier,
  }
}

// Enum cho trạng thái phiếu trả hàng
export enum ReturnStatus {
  DRAFT = 0,
  PENDING = 1,
  APPROVED = 2,
  COMPLETED = 3,
  CANCELLED = 4,
}
