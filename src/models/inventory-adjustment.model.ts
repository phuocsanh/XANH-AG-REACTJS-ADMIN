// Model cho Phiếu Điều Chỉnh Kho (Adjustment)

export interface AdjustmentItem {
  product_id: number
  quantity_change: number // Dương: tăng, Âm: giảm
  reason?: string
  notes?: string
}

export interface CreateAdjustmentRequest {
  adjustment_code: string
  adjustment_type: 'IN' | 'OUT'
  reason: string
  status?: 'draft' | 'approved' | 'completed' | 'cancelled'
  notes?: string
  created_by: number
  items: AdjustmentItem[]
}

export interface InventoryAdjustment {
  id: number
  code: string
  adjustment_type: 'IN' | 'OUT'
  reason: string
  status: string
  notes?: string
  created_by: number
  created_at: string
  updated_at: string
  approved_at?: string
  completed_at?: string
  cancelled_at?: string
  items?: AdjustmentItem[]
}

export interface AdjustmentApiResponse {
  id: number
  code: string
  adjustment_type: 'IN' | 'OUT'
  reason: string
  status: number
  notes?: string
  created_by: number
  created_at: string
  updated_at: string
  approved_at?: string
  completed_at?: string
  cancelled_at?: string
  items?: AdjustmentItem[]
}

// Hàm map status từ number sang string
export const getAdjustmentStatusText = (status: number | string): string => {
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

// Hàm map API response sang InventoryAdjustment
export const mapApiResponseToAdjustment = (
  apiAdjustment: AdjustmentApiResponse
): InventoryAdjustment => {
  return {
    id: apiAdjustment.id,
    code: apiAdjustment.code,
    adjustment_type: apiAdjustment.adjustment_type,
    reason: apiAdjustment.reason,
    status: getAdjustmentStatusText(apiAdjustment.status),
    notes: apiAdjustment.notes,
    created_by: apiAdjustment.created_by,
    created_at: apiAdjustment.created_at,
    updated_at: apiAdjustment.updated_at,
    approved_at: apiAdjustment.approved_at,
    completed_at: apiAdjustment.completed_at,
    cancelled_at: apiAdjustment.cancelled_at,
    items: apiAdjustment.items,
  }
}

// Enum cho trạng thái phiếu điều chỉnh
export enum AdjustmentStatus {
  DRAFT = 0,
  PENDING = 1,
  APPROVED = 2,
  COMPLETED = 3,
  CANCELLED = 4,
}

// Enum cho loại điều chỉnh
export enum AdjustmentType {
  IN = 'IN',
  OUT = 'OUT',
}
