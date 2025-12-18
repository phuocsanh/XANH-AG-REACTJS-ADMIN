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

// Hàm map status từ number sang string
export const getReturnStatusText = (status: number | string): string => {
  const statusMap: { [key: string | number]: string } = {
    0: 'Nháp',
    2: 'Đã duyệt',
    4: 'Đã hủy',
    'draft': 'Nháp',
    'approved': 'Đã duyệt',
    'cancelled': 'Đã hủy',
  }
  return statusMap[status] || String(status)
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
    total_amount: apiReturn.total_amount,
    reason: apiReturn.reason,
    status: normalizedStatus,  // Giữ nguyên status code ('draft', 'approved', ...)
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
