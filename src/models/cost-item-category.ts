/**
 * TypeScript types cho Loại chi phí canh tác (Nông dân)
 */

export interface CostItemCategory {
  id: number;
  name: string;
  code?: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCostItemCategoryDto {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdateCostItemCategoryDto {
  name?: string;
  code?: string;
  description?: string;
}

export interface CostItemCategoryFilters {
  page?: number;
  limit?: number;
  name?: string;
  code?: string;
}
