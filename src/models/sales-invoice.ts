export type SalesInvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled' | 'refunded';

export interface SalesInvoiceItem {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  notes?: string;
}

export interface SalesInvoice {
  id: number;
  code: string;
  customer_id?: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  season_id?: number;
  season_name?: string;
  rice_crop_id?: number;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  partial_payment_amount: number;
  remaining_amount: number;
  notes?: string;
  warning?: string;
  status: SalesInvoiceStatus;
  created_by: number;
  created_at: Date | string;
  updated_at: Date | string;
  items?: SalesInvoiceItem[];
}

export interface CreateSalesInvoiceDto {
  customer_id?: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  season_id?: number;
  invoice_code?: string;
  notes?: string;
  warning?: string;
  payment_method: 'cash' | 'transfer' | 'debt';
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  partial_payment_amount?: number;
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    notes?: string;
  }[];
}

export interface AddPaymentDto {
  amount: number;
}
