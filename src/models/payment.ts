export type PaymentMethod = 'cash' | 'transfer';

export interface Payment {
  id: number;
  code: string;
  customer_id: number;
  customer_name?: string;
  amount: number;
  allocated_amount: number;
  payment_date: Date | string;
  payment_method: PaymentMethod;
  notes?: string;
  created_by?: number;
  created_at: Date | string;
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
  debt_note_id?: number;
  debt_note_code?: string;
  amount: number;
  created_at: Date | string;
}
