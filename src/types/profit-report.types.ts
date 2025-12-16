/**
 * TypeScript interfaces cho Báo cáo Lợi nhuận Bán hàng
 */

// ==================== Lợi nhuận Hóa đơn ====================

/** Chi tiết lợi nhuận từng sản phẩm trong hóa đơn */
export interface InvoiceItemProfit {
  product_name: string;
  quantity: number;
  unit_price: number;
  avg_cost: number;
  cogs: number; // Cost of Goods Sold
  profit: number;
  margin: number; // Tỷ suất lợi nhuận (%)
}

/** Báo cáo lợi nhuận của một hóa đơn */
export interface InvoiceProfit {
  invoice_id: number;
  invoice_code: string;
  customer_name: string;
  created_at: string;
  total_amount: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  gross_margin: number;
  // Quà tặng khi bán hàng
  gift_description?: string;
  gift_value: number;
  net_profit: number; // Lợi nhuận ròng = gross_profit - gift_value
  item_details: InvoiceItemProfit[];
}

// ==================== Lợi nhuận Ruộng lúa ====================

/** Thông tin hóa đơn trong báo cáo Ruộng lúa */
export interface RiceCropInvoice {
  invoice_id: number;
  invoice_code: string;
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  customer_name?: string;
}

/** Báo cáo lợi nhuận theo Ruộng lúa */
export interface RiceCropProfit {
  rice_crop_id: number;
  field_name: string;
  customer_name?: string;
  season_name?: string;
  summary: {
    total_invoices: number;
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    avg_margin: number;
  };
  invoices: RiceCropInvoice[];
}

// ==================== Lợi nhuận Mùa vụ ====================

/** Chi phí vận hành */
export interface OperatingCost {
  type: string;
  name: string;
  amount: number;
}

/** Thống kê giao hàng */
export interface DeliveryStats {
  total_deliveries: number;
  total_delivery_cost: number;
  avg_cost_per_delivery: number;
  total_distance?: number;
  cost_per_km?: number;
}

/** Top khách hàng */
export interface TopCustomer {
  customer_id: number;
  customer_name: string;
  total_invoices: number;
  total_revenue: number;
  total_profit: number;
  avg_margin: number;
}

/** Top sản phẩm */
export interface TopProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
  total_profit: number;
  margin: number;
}

/** Báo cáo lợi nhuận theo mùa vụ */
export interface SeasonProfit {
  season_id: number;
  season_name: string;
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_invoices: number;
    total_customers: number;
    total_revenue: number;
    cost_of_goods_sold: number;
    gross_profit: number;
    gross_margin: number;
    operating_costs: number;
    net_profit: number;
    net_margin: number;
  };
  operating_costs_breakdown: OperatingCost[];
  delivery_stats?: DeliveryStats;
  top_customers: TopCustomer[];
  top_products: TopProduct[];
}

// ==================== Lợi nhuận Khách hàng ====================

/** Hóa đơn trong báo cáo khách hàng */
export interface CustomerInvoice {
  invoice_id: number;
  invoice_code: string;
  date: string;
  revenue: number;
  profit: number;
  margin: number;
}

/** Báo cáo lợi nhuận theo khách hàng */
export interface CustomerProfit {
  customer_id: number;
  customer_name: string;
  total_revenue: number;
  total_profit: number;
  average_profit_margin: number;
  total_invoices: number;
  invoices: CustomerInvoice[];
}
