/**
 * Interface cho hóa đơn mua hàng từ bên ngoài (nông dân tự nhập)
 */
export interface ExternalPurchase {
  id: number;
  rice_crop_id: number;
  customer_id: number;
  purchase_date: string;
  supplier_name: string;
  total_amount: number;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  items: ExternalPurchaseItem[];
}

export interface ExternalPurchaseItem {
  id: number;
  external_purchase_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface CreateExternalPurchaseDto {
  rice_crop_id: number;
  purchase_date: string;
  supplier_name: string;
  total_amount: number;
  notes?: string;
  items: CreateExternalPurchaseItemDto[];
}

export interface CreateExternalPurchaseItemDto {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

/**
 * Interface cho hóa đơn đã merge (system + external)
 */
export interface MergedPurchase {
  id: number | string;
  code: string;
  date: string;
  supplier: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  payment_method: string;
  source: 'system' | 'external';
  items: any[];
  notes?: string | undefined;
}
