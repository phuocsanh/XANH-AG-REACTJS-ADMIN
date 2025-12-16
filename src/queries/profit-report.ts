/**
 * React Query hooks cho báo cáo lợi nhuận (Profit Report)
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import type { ProfitReport } from '@/types/rice-farming.types';

// ==================== QUERY KEYS ====================

export const profitReportKeys = {
  all: ['profit-reports'] as const,
  byCrop: (cropId: number) => [...profitReportKeys.all, 'crop', cropId] as const,
  bySeason: (seasonId: number, customerId?: number) => 
    [...profitReportKeys.all, 'season', seasonId, customerId] as const,
};

// ==================== QUERIES ====================

/**
 * Báo cáo lợi nhuận theo Ruộng lúa
 */
export const useProfitReport = (cropId: number) => {
  return useQuery({
    queryKey: profitReportKeys.byCrop(cropId),
    queryFn: async () => {
      return await api.get<ProfitReport>(`/profit-reports/crop/${cropId}`);
    },
    enabled: !!cropId,
  });
};

/**
 * Báo cáo lợi nhuận theo mùa vụ
 */
export const useSeasonProfitReport = (seasonId: number, customerId?: number) => {
  return useQuery({
    queryKey: profitReportKeys.bySeason(seasonId, customerId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (customerId) params.append('customerId', customerId.toString());

      return await api.get<ProfitReport[]>(`/profit-reports/season/${seasonId}?${params.toString()}`);
    },
    enabled: !!seasonId,
  });
};
