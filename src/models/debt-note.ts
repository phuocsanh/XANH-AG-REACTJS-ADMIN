export type DebtNoteStatus = 'active' | 'paid' | 'overdue' | 'cancelled';

export interface DebtNote {
  id: number;
  code: string;
  customer_id: number;
  customer_name?: string;
  season_id?: number;
  season_name?: string;
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
