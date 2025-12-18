export type SalesReturnStatus = 'draft' | 'approved' | 'cancelled';

export interface SalesReturnItem {
  id: number;
  sales_return_id: number;
  product_id: number;
  product_name?: string;
  product?: {
    id: number;
    name: string;
    code?: string;
  };
  quantity: number;
  unit_price: number;
  refund_amount: number;
  reason?: string;
  created_at: string;
}

export interface SalesReturn {
  id: number;
  code: string;
  invoice_id: number;
  invoice_code?: string;
  invoice?: {
    id: number;
    code: string;
    customer_name?: string;
    customer_phone?: string;
  };
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer?: {
    id: number;
    name: string;
    phone?: string;
  };
  total_refund_amount: number;
  refund_method: 'cash' | 'debt_credit' | 'bank_transfer';
  status: SalesReturnStatus;
  reason?: string;
  notes?: string;
  approved_by?: number;
  approved_at?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  items?: SalesReturnItem[];
}

export interface CreateSalesReturnDto {
  invoice_id: number;
  refund_method: 'cash' | 'debt_credit' | 'bank_transfer';
  reason?: string;
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
    reason?: string;
  }[];
}

export interface UpdateSalesReturnStatusDto {
  status: SalesReturnStatus;
  notes?: string;
}
