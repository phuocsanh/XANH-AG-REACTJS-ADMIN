/**
 * TypeScript interfaces cho Farm Service Cost (Chi phí dịch vụ/quà tặng cho nông dân)
 */

export interface FarmServiceCost {
  id: number;
  name: string;
  amount: number;
  season_id: number;
  customer_id: number;
  rice_crop_id?: number;
  notes?: string;
  expense_date: string;
  source: 'manual' | 'gift_from_invoice';
  invoice_id?: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  season?: {
    id: number;
    name: string;
    year: string;
  };
  customer?: {
    id: number;
    name: string;
    phone?: string;
  };
  rice_crop?: {
    id: number;
    field_name: string;
  };
}

export interface CreateFarmServiceCostDto {
  name: string;
  amount: number;
  season_id: number;
  customer_id: number;
  rice_crop_id?: number;
  notes?: string;
  expense_date: string;
  source?: string;
  invoice_id?: number;
}

export interface UpdateFarmServiceCostDto {
  name?: string;
  amount?: number;
  season_id?: number;
  customer_id?: number;
  rice_crop_id?: number;
  notes?: string;
  expense_date?: string;
  source?: string;
  invoice_id?: number;
}

export interface SearchFarmServiceCostDto {
  season_id?: number;
  customer_id?: number;
  rice_crop_id?: number;
  source?: string;
  start_date?: string;
  end_date?: string;
  keyword?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}
