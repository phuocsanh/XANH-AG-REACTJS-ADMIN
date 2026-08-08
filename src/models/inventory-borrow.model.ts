export type InventoryBorrowStatus =
  | "draft"
  | "approved"
  | "partial_returned"
  | "returned"
  | "converted_to_sale"
  | "cancelled"

export interface InventoryBorrowItem {
  id?: number
  product_id: number
  batch_id: number
  receipt_item_id?: number | null
  quantity: number
  returned_quantity?: number
  converted_to_sale_quantity?: number
  notes?: string
  product?: {
    id: number
    name: string
    trade_name?: string
    unit?: { name?: string }
  }
  batch?: {
    id: number
    code?: string
    remaining_quantity?: number
    expiry_date?: string
    unit_cost_price?: string
    supplier?: { id: number; name: string }
  }
}

export interface InventoryBorrow {
  id: number
  code: string
  borrower_customer_id?: number | null
  borrower_name: string
  borrow_date: string
  expected_return_date?: string | null
  status: InventoryBorrowStatus
  notes?: string
  created_by?: number
  approved_by?: number | null
  approved_at?: string | null
  created_at: string
  updated_at: string
  borrower_customer?: { id: number; name: string; phone?: string }
  items?: InventoryBorrowItem[]
}

export interface CreateInventoryBorrowRequest {
  borrower_customer_id?: number
  borrower_name: string
  borrow_date: string
  expected_return_date?: string
  status?: InventoryBorrowStatus
  notes?: string
  items: Array<{
    product_id: number
    batch_id: number
    quantity: number
    notes?: string
  }>
}

export const getInventoryBorrowStatusText = (status: InventoryBorrowStatus | string) => {
  const map: Record<string, string> = {
    draft: "Nháp",
    approved: "Đang mượn",
    partial_returned: "Trả một phần",
    returned: "Đã trả",
    converted_to_sale: "Chuyển bán",
    cancelled: "Đã hủy",
  }
  return map[String(status)] || String(status)
}

export const getInventoryBorrowStatusColor = (status: InventoryBorrowStatus | string) => {
  const map: Record<string, string> = {
    draft: "default",
    approved: "gold",
    partial_returned: "blue",
    returned: "green",
    converted_to_sale: "purple",
    cancelled: "red",
  }
  return map[String(status)] || "default"
}
