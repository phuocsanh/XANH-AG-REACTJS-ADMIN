/**
 * React Query hooks cho báo cáo thống kê nhà cung cấp
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import type { SupplierReport } from '@/models/supplier-report.model';

// ==================== QUERY KEYS ====================

export const supplierReportKeys = {
  all: ['supplier-reports'] as const,
  bySupplier: (supplierId: number, filters?: { 
    startDate?: string; 
    endDate?: string; 
  }) => [...supplierReportKeys.all, 'supplier', supplierId, filters] as const,
};

// ==================== QUERIES ====================

/**
 * Lấy báo cáo thống kê các sản phẩm đã bán và lợi nhuận của một nhà cung cấp
 * @param supplierId - ID của nhà cung cấp
 * @param filters - Bộ lọc ngày (tùy chọn)
 */
export const useSupplierSalesStats = (
  supplierId: number,
  filters?: {
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQuery({
    queryKey: supplierReportKeys.bySupplier(supplierId, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString();
      const url = `/supplier-report/stats/${supplierId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<SupplierReport>(url);
      return response;
    },
    enabled: !!supplierId && supplierId > 0,
  });
};
