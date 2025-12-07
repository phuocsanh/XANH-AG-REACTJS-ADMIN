// Trạng thái phiếu công nợ
export type DebtNoteStatus = 'active' | 'paid' | 'overdue' | 'cancelled' | 'settled';

export interface DebtNote {
  id: number;
  code: string;
  customer_id: number;
  customer_name?: string;
  customer?: { id: number; name: string; phone?: string; code?: string };
  season_id?: number;
  season_name?: string;
  season?: { id: number; name: string; code?: string };
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: DebtNoteStatus;
  due_date?: Date | string;
  notes?: string;
  source_invoices?: number[];
  created_by?: number;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * @deprecated Không sử dụng nữa. Dùng SettleAndRolloverDto thay thế.
 * Chức năng trả nợ đã chuyển sang /payments/settle-debt
 */
export interface PayDebtDto {
  amount: number;
  payment_method: 'cash' | 'transfer';
  notes?: string;
}

export interface CreateDebtNoteDto {
  customer_id: number;
  season_id?: number;
  amount: number;
  due_date?: string;
  notes?: string;
  source_invoices?: number[];
}

/**
 * DTO cho API chốt sổ công nợ mới
 * Endpoint: POST /payments/settle-debt
 */
export interface SettleAndRolloverDto {
  customer_id: number;
  season_id: number;
  amount: number;
  payment_method: 'cash' | 'transfer';
  payment_date?: string;
  notes?: string;
}

/**
 * Response từ API chốt sổ công nợ
 */
export interface SettleAndRolloverResponse {
  payment: {
    id: number;
    code: string;
    amount: number;
    payment_method: string;
  };
  settled_invoices: Array<{
    id: number;
    remaining_amount: number;
    payment_status: string;
  }>;
  old_debt_note?: {
    id: number;
    status: string;
    paid_amount: number;
    remaining_amount: number;
  };
  new_debt_note?: any;
}

/**
 * Thống kê công nợ từ API
 */
export interface DebtNoteStatistics {
  total_debt: number;
  overdue_count: number;
  active_count: number;
  paid_count: number;
}
