/**
 * React Query hooks cho báo cáo lợi nhuận cửa hàng (Store Profit Report)
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import type {
  InvoiceProfit,
  SeasonStoreProfit,
  CustomerProfitReport,
  RiceCropProfit,
} from '@/types/store-profit.types';

// ==================== QUERY KEYS ====================

export const storeProfitReportKeys = {
  all: ['store-profit-reports'] as const,
  invoice: (invoiceId: number) => [...storeProfitReportKeys.all, 'invoice', invoiceId] as const,
  season: (seasonId: number) => [...storeProfitReportKeys.all, 'season', seasonId] as const,
  customer: (customerId: number, filters?: {
    seasonId?: number;
    startDate?: string;
    endDate?: string;
  }) => [...storeProfitReportKeys.all, 'customer', customerId, filters] as const,
};

// ==================== QUERIES ====================

/**
 * Lấy báo cáo lợi nhuận chi tiết của một đơn hàng
 * @param invoiceId - ID của hóa đơn
 */
export const useInvoiceProfit = (invoiceId: number) => {
  return useQuery({
    queryKey: storeProfitReportKeys.invoice(invoiceId),
    queryFn: async () => {
      const response = await api.get<any>(`/store-profit-report/invoice/${invoiceId}`);
      return response.data as InvoiceProfit;
    },
    enabled: !!invoiceId && invoiceId > 0,
  });
};

/**
 * Lấy báo cáo lợi nhuận chi tiết của một đơn hàng theo mã (code)
 * @param code - Mã của hóa đơn
 */
export const useInvoiceProfitByCodeQuery = (code: string) => {
  return useQuery({
    queryKey: [...storeProfitReportKeys.all, 'invoice-code', code] as const,
    queryFn: async () => {
      const response = await api.get<any>(`/store-profit-report/invoice/code/${code}`);
      return response.data as InvoiceProfit;
    },
    enabled: !!code && code.length > 0,
  });
};

/**
 * Lấy báo cáo lợi nhuận tổng hợp theo mùa vụ
 * Bao gồm: Doanh thu, Giá vốn, Chi phí vận hành, Lợi nhuận ròng, Top customers, Top products
 * @param seasonId - ID của mùa vụ
 */
export const useSeasonStoreProfit = (seasonId: number) => {
  return useQuery({
    queryKey: storeProfitReportKeys.season(seasonId),
    queryFn: async () => {
      const response = await api.get<any>(`/store-profit-report/season/${seasonId}`);
      return response.data as SeasonStoreProfit;
    },
    enabled: !!seasonId && seasonId > 0,
  });
};

/**
 * Lấy báo cáo lợi nhuận theo khách hàng
 * Xem lịch sử lợi nhuận từ các đơn hàng của một khách hàng cụ thể
 * @param customerId - ID của khách hàng
 * @param seasonId - (Optional) Lọc theo mùa vụ
 * @param startDate - (Optional) Lọc từ ngày (YYYY-MM-DD)
 * @param endDate - (Optional) Lọc đến ngày (YYYY-MM-DD)
 */
export const useCustomerProfitReport = (
  customerId: number,
  filters?: {
    seasonId?: number;
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQuery({
    queryKey: storeProfitReportKeys.customer(customerId, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.seasonId) params.append('seasonId', filters.seasonId.toString());
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString();
      const url = `/store-profit-report/customer/${customerId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<any>(url);
      return response.data as CustomerProfitReport;
    },
    enabled: !!customerId && customerId > 0,
  });
};

/**
 * Lấy báo cáo lợi nhuận theo Ruộng lúa (Rice Crop)
 * @param riceCropId - ID của Ruộng lúa
 */
export const useRiceCropProfitQuery = (riceCropId: number) => {
  return useQuery({
    queryKey: [...storeProfitReportKeys.all, 'rice-crop', riceCropId] as const,
    queryFn: async () => {
      const response = await api.get<any>(`/store-profit-report/rice-crop/${riceCropId}`);
      return response.data as RiceCropProfit;
    },
    enabled: !!riceCropId && riceCropId > 0,
  });
};
