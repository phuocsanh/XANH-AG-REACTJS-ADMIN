/**
 * Interface cho chi phí canh tác
 */
export interface CostItem {
  id: number;
  rice_crop_id: number;
  item_name: string;
  category?: CostCategory;
  category_id?: number;
  total_cost: number;
  expense_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export enum CostCategory {
  SEED = 'seed',
  FERTILIZER = 'fertilizer',
  PESTICIDE = 'pesticide',
  LABOR = 'labor',
  MACHINERY = 'machinery',
  IRRIGATION = 'irrigation',
  OTHER = 'other',
}

export interface CreateCostItemDto {
  rice_crop_id: number;
  item_name: string;
  category?: CostCategory;
  category_id?: number;
  total_cost: number;
  expense_date: string;
  notes?: string;
}
