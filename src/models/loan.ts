export type LoanStatus = 'active' | 'paid' | 'overdue' | 'cancelled'

export interface Loan {
  id: number
  code: string
  customer_id: number
  customer?: { id: number; name: string; phone?: string; code?: string }
  loan_date: Date | string
  repayment_date?: Date | string
  principal_amount: number
  monthly_interest_rate: number
  loan_days: number
  interest_amount: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_id?: number
  status: LoanStatus
  notes?: string
  created_by?: number
  created_at: Date | string
  updated_at: Date | string
}

export interface CreateLoanDto {
  customer_id: number
  loan_date: string
  principal_amount: number
  monthly_interest_rate?: number // Lãi suất mỗi tháng (%) (tùy chọn)
  notes?: string
}

export interface RepayLoanDto {
  repayment_date?: string
  monthly_interest_rate: number
  payment_method?: 'cash' | 'transfer'
  notes?: string
}
