export type CustomerType = 'regular' | 'vip' | 'wholesale';

export const getCustomerTypeText = (type: CustomerType): string => {
  const map: Record<CustomerType, string> = {
    'regular': 'Thành viên',
    'vip': 'Khách hàng thân thiết',
    'wholesale': 'Đại lý/Sỉ',
  };
  return map[type] || type;
};

export interface Customer {
  id: number;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  type: CustomerType;
  is_guest: boolean;
  tax_code?: string;
  notes?: string;
  total_purchases: number;
  total_spent: number;
  current_debt?: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateCustomerDto {
  code?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  type?: CustomerType;
  tax_code?: string;
  notes?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

export interface CustomerDebtor extends Customer {
  total_debt: number;
  debt_count: number;
}
