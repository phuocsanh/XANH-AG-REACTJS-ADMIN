export enum DashboardPeriod {
  ALL = 'all',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export interface DashboardStats {
  period: string;
  start_date: string | null;
  end_date: string | null;
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalCost: number;
    totalProfit: number;
    grossProfit: number;
    netProfit: number;
    grossProfitMargin: number;
    netProfitMargin: number;
    operatingCost: number;
    totalGiftCost: number;
    totalExtraCost: number;
    totalDiscount: number;
    totalDebt: number;
    totalGiftValue: number;
    totalCustomers: number;
    giftCosts: {
      invoiceGiftValue: number;
      manualGiftCost: number;
      accumulatedGiftCost: number;
      campaignGiftCost: number;
      totalGiftCost: number;
    };
    loans: {
      activeCount: number;
      paidCount: number;
      activePrincipal: number;
      estimatedInterest: number;
      activeReceivable: number;
      storedRemaining: number;
      realizedInterest: number;
      paidAmount: number;
    };
    debt: {
      totalAmount: number;
      totalPaid: number;
      totalRemaining: number;
      overdueCount: number;
      activeCount: number;
      paidCount: number;
      overdueAfterMonths?: number;
    };
    inventory: {
      totalBatches: number;
      totalValue: number;
      lowStockCount: number;
      expiringCount: number;
      expiringValue: number;
    };
  };
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  count: number;
  profit: number;
  cost: number;
}

export interface RevenueComparisonDataPoint {
  month: string;
  revenue: number;
}

export interface RevenueResponse {
  period: string;
  start_date: string | null;
  end_date: string | null;
  monthly: RevenueDataPoint[];
  comparison: RevenueComparisonDataPoint[];
  growth: {
    yoy: number;
    mom: number;
  };
  totals: {
    currentPeriod: number;
    comparePeriod: number;
  };
}

export interface AgingBucket {
  count: number;
  amount: number;
}

export interface ReceivableInvoice {
  code: string;
  remaining: number;
  dueDate: string | null;
  status: string;
}

export interface ReceivableCustomer {
  customerId: number;
  customerName: string;
  totalDebt: number;
  overdueAmount: number;
  activeCount: number;
  overdueCount: number;
  lastDueDate: string | null;
  invoices: ReceivableInvoice[];
}

export interface ReceivablesResponse {
  totalAmount: number;
  overdueAmount: number;
  activeAmount: number;
  overdueCount: number;
  activeCount: number;
  overdueAfterMonths?: number;
  aging: {
    '0_7_days': AgingBucket;
    '8_30_days': AgingBucket;
    '31_90_days': AgingBucket;
    '90_plus': AgingBucket;
  };
  byCustomer: ReceivableCustomer[];
}

export interface ExpiringSoonInfo {
  count: number;
  value: number;
}

export interface LowStockProduct {
  id: number;
  code: string;
  name: string;
  quantity: number;
  price: number;
}

export interface LowStockInfo {
  count: number;
  products: LowStockProduct[];
}

export interface InventoryResponse {
  totalBatches: number;
  totalQuantity: number;
  totalValue: number;
  expiringSoon: ExpiringSoonInfo;
  expired: ExpiringSoonInfo;
  lowStock: LowStockInfo;
}

export interface SalesPerformanceItem {
  [key: string]: unknown;
}

export interface SalesPerformanceResponse {
  type: string;
  period: { start: string | null; end: string | null };
  items: SalesPerformanceItem[];
}

export interface DashboardQueryParams {
  period?: string;
  year?: number;
  month?: number;
  quarter?: number;
  start_date?: string;
  end_date?: string;
  compare_year?: number;
  limit?: number;
  season_id?: number;
}
