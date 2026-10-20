export type PaymentMethod = 'cash' | 'transfer';

export interface Payment {
  id: number;
  code: string;
  customer_id: number;
  customer_name?: string;
  customer?: { id: number; name: string; phone?: string };
  amount: number;
  allocated_amount: number;
  payment_date: Date | string;
  payment_method: PaymentMethod;
  notes?: string;
  created_by?: number;
  created_at: Date | string;
  debt_note_code?: string;
  /** Cờ do backend tính: phiếu thu có thể hoàn tác an toàn hay không. */
  can_rollback?: boolean;
  /** Lý do bị chặn hoàn tác (nếu can_rollback = false). */
  rollback_block_reason?: string | null;
  /** Loại phiếu thu: công nợ/hóa đơn, trả vay hoặc chưa phân bổ. */
  payment_kind?: PaymentRollbackKind;
}

/** Loại phiếu thu xét theo nghiệp vụ hoàn tác. */
export type PaymentRollbackKind = "invoice" | "loan" | "unallocated";

/** Lỗi chặn hoàn tác do backend trả về. */
export interface RollbackPreviewBlocker {
  code: string;
  message: string;
}

/** Kết quả xem trước ảnh hưởng của việc hoàn tác phiếu thu. */
export interface PaymentRollbackPreview {
  payment_id: number;
  preview_token: string;
  payment_code: string;
  amount: number;
  customer_id: number | null;
  can_rollback: boolean;
  payment_kind: PaymentRollbackKind;
  blockers: RollbackPreviewBlocker[];
  warnings: string[];
  invoice_restores: Array<{
    invoice_id: number;
    invoice_code: string;
    restore_amount: number;
    partial_before: number;
    partial_after: number;
    remaining_before: number;
    remaining_after: number;
  }>;
  debt_notes: Array<{
    debt_note_id: number;
    debt_note_code: string;
    amount: number;
    paid_before: number;
    paid_after: number;
    remaining_before: number;
    remaining_after: number;
    status_before: string;
    status_after: string;
    closed_at_before: string | null;
  }>;
  accumulation: {
    delta: number;
    pending_before: number;
    pending_after: number;
    total_before: number;
    total_after: number;
  } | null;
  loan: {
    loan_id: number;
    loan_code: string;
    principal_amount: number;
    status_after: string;
  } | null;
}

/** Một bản ghi lịch sử hoàn tác phiếu thu. */
export interface PaymentRollbackHistoryItem {
  id: number;
  payment_id: number;
  payment_code: string;
  customer_id?: number | null;
  customer_name?: string | null;
  amount: number;
  payment_kind: PaymentRollbackKind;
  debt_note_code?: string | null;
  loan_code?: string | null;
  reason: string;
  rolled_back_by?: number | null;
  rollbacker?: { id: number; account: string } | null;
  rolled_back_at: string;
  affected_invoices: number;
  affected_debt_notes: number;
  allocations_snapshot: Record<string, any>[];
  debt_notes_snapshot?: Record<string, any>[] | null;
}

export interface CreatePaymentDto {
  customer_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  notes?: string;
}

export interface SettlePaymentDto {
  customer_id: number;
  amount: number;
  payment_method: PaymentMethod;
  invoice_ids?: number[];
  create_debt_note?: boolean;
  debt_note_config?: {
    season_id: number;
    due_date?: string;
    notes?: string;
  };
}

export interface PaymentAllocation {
  id: number;
  payment_id: number;
  payment_code?: string;
  allocation_type: 'invoice' | 'debt_note';
  invoice_id?: number;
  invoice_code?: string;
  invoice?: { id: number; code: string };
  debt_note_id?: number;
  debt_note_code?: string;
  debt_note?: { id: number; code: string };
  amount: number;
  created_at: Date | string;
}
