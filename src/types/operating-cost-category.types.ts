/**
 * TypeScript types cho Loại chi phí vận hành
 */

export interface OperatingCostCategory {
  id: number;
  name: string;
  code?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOperatingCostCategoryDto {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdateOperatingCostCategoryDto {
  name?: string;
  code?: string;
  description?: string;
}

export interface OperatingCostCategoryFilters {
  page?: number;
  limit?: number;
  name?: string;
  code?: string;
}
