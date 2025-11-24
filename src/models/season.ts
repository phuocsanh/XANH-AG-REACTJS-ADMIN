export interface Season {
  id: number;
  name: string;
  code: string;
  year: number;
  start_date?: Date | string;
  end_date?: Date | string;
  description?: string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateSeasonDto {
  name: string;
  code: string;
  year: number;
  start_date?: string;
  end_date?: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateSeasonDto extends Partial<CreateSeasonDto> {}
