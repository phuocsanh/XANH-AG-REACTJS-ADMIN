import { CreateDeliveryLogDto } from './delivery-log.model';

export type SalesInvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled' | 'refunded';

export interface SalesInvoiceItem {
  id: number;
  product_id: number;
  product_name?: string;
  unit_name?: string;
  product?: {
    id: number;
    name: string;
    trade_name?: string;
    code?: string;
    unit?: { id: number; name: string };
  };
  quantity: number;
  unit_price: number;
  discount_amount: number;
  notes?: string;
  // ✅ Thêm mới: Hỗ trợ tính năng trả hàng
  returned_quantity?: number; // Tổng số lượng đã trả
  returnable_quantity?: number; // Số lượng còn có thể trả
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
  season?: { id: number; name: string; code?: string };
  rice_crop_id?: number;
  rice_crop?: { id: number; field_name: string; rice_variety?: string };
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
  // Quà tặng khi bán hàng
  gift_description?: string;
  gift_value?: number;
}

export interface CreateSalesInvoiceDto {
  customer_id?: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  season_id?: number;
  rice_crop_id?: number;
  invoice_code?: string;
  notes?: string;
  warning?: string;
  payment_method: 'cash' | 'transfer' | 'debt';
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  partial_payment_amount?: number;
  // Quà tặng khi bán hàng
  gift_description?: string;
  gift_value?: number;
  items: {
    product_id: number;
    product_name?: string;
    unit_name?: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    notes?: string;
  }[];
  // Thông tin giao hàng (tùy chọn)
  delivery_log?: CreateDeliveryLogDto;
}

export interface AddPaymentDto {
  amount: number;
}
