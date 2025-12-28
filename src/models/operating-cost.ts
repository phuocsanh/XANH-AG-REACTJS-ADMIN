import { OperatingCostCategory } from './operating-cost-category';

export interface CreateOperatingCostDto {
  name: string;
  value: number;
  category_id: number; // ← THAY ĐỔI: Trước đây là type: string
  description?: string;
  season_id?: number;
  rice_crop_id?: number;
  customer_id?: number; // ← MỚI
  expense_date?: string; // ISO String
}

export interface UpdateOperatingCostDto extends Partial<CreateOperatingCostDto> {}

export interface OperatingCost {
  id: number;
  name: string;
  value: string; // Decimal is often returned as string from API
  category_id?: number; // ← MỚI
  type?: string; // ← DEPRECATED (giữ lại để tương thích)
  description?: string;
  season_id?: number;
  rice_crop_id?: number;
  customer_id?: number; // ← MỚI
  expense_date?: string;
  created_at: string;
  updated_at: string;
  
  // Relations (optional based on API response)
  category?: OperatingCostCategory; // ← MỚI (relation)
  season?: {
    id: number;
    name: string;
  };
  rice_crop?: {
    id: number;
    field_name: string;
  };
  customer?: {
    id: number;
    name: string;
  };
}

export interface SearchOperatingCostDto {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, any>;
}
