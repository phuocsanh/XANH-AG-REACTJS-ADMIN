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
  status?: 'draft' | 'approved' | 'cancelled'
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

// Enum cho trạng thái phiếu điều chỉnh (Chuẩn hóa dạng chuỗi tiếng Anh)
export enum AdjustmentStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
}

// Hàm map status sang tên hiển thị Tiếng Việt
export const getAdjustmentStatusText = (status: any): string => {
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
    cancelled_at: apiAdjustment.cancelled_at,
    items: apiAdjustment.items,
  }
}

/**
 * Hàm chuẩn hóa trạng thái về dạng Enum chuỗi tiếng Anh
 */
export const normalizeAdjustmentStatus = (status: any): AdjustmentStatus => {
  const s = String(status).toLowerCase();
  if (s === 'draft' || s === '0') return AdjustmentStatus.DRAFT;
  if (s === 'approved' || s === '2' || s === 'completed' || s === '3') return AdjustmentStatus.APPROVED;
  if (s === 'cancelled' || s === '4') return AdjustmentStatus.CANCELLED;
  return AdjustmentStatus.DRAFT;
}

// Enum cho loại điều chỉnh
export enum AdjustmentType {
  IN = 'IN',
  OUT = 'OUT',
}
