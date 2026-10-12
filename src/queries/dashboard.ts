import { useQuery } from "@tanstack/react-query";
import api from "@/utils/api";
import type {
  DashboardStats,
  RevenueResponse,
  ReceivablesResponse,
  InventoryResponse,
  SalesPerformanceResponse,
  DashboardQueryParams,
} from "@/models/dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (params?: DashboardQueryParams) => [...dashboardKeys.all, "stats", params] as const,
  revenue: (params?: DashboardQueryParams) => [...dashboardKeys.all, "revenue", params] as const,
  receivables: (params?: DashboardQueryParams) => [...dashboardKeys.all, "receivables", params] as const,
  inventory: (params?: DashboardQueryParams) => [...dashboardKeys.all, "inventory", params] as const,
  performance: (params?: DashboardQueryParams, type?: string) =>
    [...dashboardKeys.all, "performance", type, params] as const,
} as const;

const buildParams = (params?: DashboardQueryParams): Record<string, unknown> => {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
  );
};

/**
 * Hook lấy thống kê tổng quan Dashboard
 * - Doanh thu, lợi nhuận, chi phí
 * - Công nợ phải thu (tổng, quá hạn, hoạt động)
 * - Tồn kho (số lượng, giá trị, sản phẩm hết, sắp hết hạn)
 */
export const useDashboardStats = (params?: DashboardQueryParams) => {
  return useQuery<DashboardStats>({
    queryKey: dashboardKeys.stats(params),
    queryFn: async () => {
      const data = await api.get<DashboardStats>("/dashboard/stats", buildParams(params));
      return data;
    },
  });
};

/**
 * Hook lấy dữ liệu doanh thu theo thời gian (có so sánh YoY)
 */
export const useDashboardRevenue = (params?: DashboardQueryParams) => {
  return useQuery<RevenueResponse>({
    queryKey: dashboardKeys.revenue(params),
    queryFn: async () => {
      const data = await api.get<RevenueResponse>("/dashboard/revenue", buildParams(params));
      return data;
    },
  });
};

/**
 * Hook lấy dữ liệu công nợ phải thu (tổng, theo khách, aging)
 */
export const useDashboardReceivables = (params?: DashboardQueryParams) => {
  return useQuery<ReceivablesResponse>({
    queryKey: dashboardKeys.receivables(params),
    queryFn: async () => {
      const data = await api.get<ReceivablesResponse>("/dashboard/receivables", buildParams(params));
      return data;
    },
  });
};

/**
 * Hook lấy dữ liệu tồn kho (tổng giá trị, sản phẩm sắp hết, sắp hết hạn, thấp tồn)
 */
export const useDashboardInventory = (params?: DashboardQueryParams) => {
  return useQuery<InventoryResponse>({
    queryKey: dashboardKeys.inventory(params),
    queryFn: async () => {
      const data = await api.get<InventoryResponse>("/dashboard/inventory", buildParams(params));
      return data;
    },
  });
};

/**
 * Hook lấy top sản phẩm bán chạm
 */
export const useTopProducts = (params?: DashboardQueryParams) => {
  return useQuery<SalesPerformanceResponse>({
    queryKey: dashboardKeys.performance(params, "top-products"),
    queryFn: async () => {
      const data = await api.get<SalesPerformanceResponse>(
        "/dashboard/sales-performance/top-products",
        buildParams(params),
      );
      return data;
    },
  });
};

/**
 * Hook lấy top khách hàng mua nhiều nhất
 */
export const useTopCustomers = (params?: DashboardQueryParams) => {
  return useQuery<SalesPerformanceResponse>({
    queryKey: dashboardKeys.performance(params, "top-customers"),
    queryFn: async () => {
      const data = await api.get<SalesPerformanceResponse>(
        "/dashboard/sales-performance/top-customers",
        buildParams(params),
      );
      return data;
    },
  });
};

/**
 * Hook lấy top nhân viên bán hàng xuất sắc
 */
export const useTopEmployees = (params?: DashboardQueryParams) => {
  return useQuery<SalesPerformanceResponse>({
    queryKey: dashboardKeys.performance(params, "top-employees"),
    queryFn: async () => {
      const data = await api.get<SalesPerformanceResponse>(
        "/dashboard/sales-performance/top-employees",
        buildParams(params),
      );
      return data;
    },
  });
};

/**
 * Hook lấy tất cả dữ liệu dashboard trong một lần gọi (cho trang Dashboard chính)
 */
export const useDashboardOverview = (params?: DashboardQueryParams) => {
  return {
    stats: useDashboardStats(params),
    revenue: useDashboardRevenue(params),
    receivables: useDashboardReceivables(params),
    inventory: useDashboardInventory(params),
    topProducts: useTopProducts(params),
    topCustomers: useTopCustomers(params),
  };
};
