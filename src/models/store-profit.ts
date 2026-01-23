/**
 * TypeScript interfaces cho hệ thống báo cáo lợi nhuận cửa hàng
 * Tương ứng với các DTO từ backend
 */

// ==================== Lợi Nhuận Đơn Hàng ====================

/**
 * Chi tiết lợi nhuận từng sản phẩm trong hóa đơn
 */
export interface InvoiceItemProfit {
  product_name: string;
  quantity: number;
  unit_price: number;
  avg_cost: number;      // Giá vốn trung bình
  cogs: number;          // Cost of Goods Sold (Tổng giá vốn)
  profit: number;        // Lợi nhuận từ sản phẩm này
  margin: number;        // Tỷ suất lợi nhuận (%)
}

/**
 * Lợi nhuận tổng hợp của một đơn hàng
 */
export interface InvoiceProfit {
  invoice_id: number;
  invoice_code: string;
  customer_name: string;
  created_at: Date;
  sale_date?: Date;
  total_amount: number;        // Tổng doanh thu
  cost_of_goods_sold: number;  // Tổng giá vốn hàng bán
  gross_profit: number;        // Lợi nhuận gộp
  gross_margin: number;        // Tỷ suất lợi nhuận gộp (%)
  item_details: InvoiceItemProfit[];
  // Bổ sung các trường còn thiếu
  net_profit: number;          // Lợi nhuận ròng (sau khi trừ quà tặng/giảm giá nếu có)
  gift_value: number;          // Giá trị quà tặng
  gift_description?: string;   // Mô tả quà tặng
  delivery_cost?: number;      // Chi phí giao hàng
}

// ==================== Báo Cáo Mùa Vụ ====================

/**
 * Thống kê giao hàng
 */
export interface DeliveryStats {
  total_deliveries: number;
  total_delivery_cost: number;
  avg_cost_per_delivery: number;
  total_distance?: number;
  cost_per_km?: number;
}

/**
 * Chi phí vận hành theo loại
 */
export interface OperatingCostBreakdown {
  type: string;
  name: string;
  amount: number;
}

/**
 * Top khách hàng theo lợi nhuận
 */
export interface TopCustomerProfit {
  customer_id: number;
  customer_name: string;
  total_invoices: number;
  total_revenue: number;
  total_profit: number;
  avg_margin: number;
}

/**
 * Top sản phẩm theo lợi nhuận
 */
export interface TopProductProfit {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
  total_profit: number;
  margin: number;
}

/**
 * Tổng hợp lợi nhuận
 */
export interface ProfitSummary {
  total_invoices: number;
  total_customers: number;
  total_revenue: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  gross_margin: number;
  delivery_costs: number;     // Tổng chi phí giao hàng
  farm_service_costs: number;  // Chi phí dịch vụ/quà tặng cho nông dân
  operating_costs: number;     // Chi phí vận hành cửa hàng (điện, nước, mặt bằng...)
  net_profit: number;          // Lợi nhuận ròng
  net_margin: number;
}

/**
 * Báo cáo lợi nhuận theo mùa vụ
 */
export interface SeasonStoreProfit {
  season_id: number;
  season_name: string;
  period: {
    start_date?: Date;
    end_date?: Date;
  };
  summary: ProfitSummary;
  farm_service_costs_breakdown: OperatingCostBreakdown[];  // Chi tiết chi phí dịch vụ
  operating_costs_breakdown: OperatingCostBreakdown[];      // Chi tiết chi phí vận hành
  delivery_stats?: DeliveryStats;
  top_customers: TopCustomerProfit[];
  top_products: TopProductProfit[];
}

// ==================== Lợi Nhuận Khách Hàng ====================

export interface CustomerSummaryStats {
  total_invoices: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  avg_margin: number;
  delivery_costs: number;
  farm_service_costs: number;
  operating_costs: number;
  net_profit: number;
  season_name?: string;
}

/**
 * Thông tin đơn hàng trong báo cáo khách hàng
 */
export interface CustomerInvoice {
  invoice_id: number;
  invoice_code: string;
  date: Date;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  delivery_cost?: number;
  season_id?: number;
  season_name?: string;
}

/**
 * Tổng hợp theo mùa vụ cho khách hàng
 */
export interface CustomerSeasonSummary {
  season_id: number;
  season_name: string;
  total_invoices: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  avg_margin: number;
}

/**
 * Báo cáo lợi nhuận của một khách hàng
 */
export interface CustomerProfitReport {
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  
  // Tổng hợp (có thể là lifetime hoặc summary chung)
  summary: CustomerSummaryStats;
  
  // Các field bổ sung cho báo cáo chi tiết
  lifetime_summary?: CustomerSummaryStats;
  current_season_summary?: CustomerSummaryStats;

  invoices: CustomerInvoice[];
  by_season: CustomerSeasonSummary[];
}

// ==================== Lợi Nhuận Ruộng lúa (Rice Crop) ====================

export interface RiceCropProfit {
  rice_crop_id: number;
  field_name: string;
  customer_name: string;
  season_name: string;
  
  summary: {
    total_invoices: number;
    total_revenue: number;
    cost_of_goods_sold: number;
    gross_profit: number;
    
    // Chi phí dịch vụ/quà tặng của cửa hàng dành cho ruộng lúa
    farm_service_costs: number;
    operating_costs: number; // Chi phí vận hành gán cho ruộng
    delivery_costs?: number; // Chi phí giao hàng cho ruộng (đã đổi tên)
    delivery_cost?: number;  // Legacy (bỏ qua nếu không dùng)
    net_profit: number;
    net_margin: number;
    
    gift_value_from_invoices: number;
    avg_margin: number;
  };
  
  // Chi tiết chi phí dịch vụ/quà tặng
  farm_service_costs_breakdown?: {
      name: string;
      amount: number;
      date?: string;
      notes?: string;
      source?: string; // 'manual' hoặc 'gift_from_invoice'
  }[];

  // Chi tiết chi phí vận hành
  operating_costs_breakdown?: {
      name: string;
      amount: number;
      date?: string;
      notes?: string;
  }[];

  invoices: CustomerInvoice[];
}

// ==================== Báo Cáo Doanh Thu Theo Khoảng Thời Gian ====================

export interface PeriodSummary {
  total_revenue: number;
  revenue_with_invoice: number;
  revenue_no_invoice: number;
  taxable_revenue: number; // Doanh thu khai báo thuế (chỉ tính sản phẩm có hóa đơn đầu vào)
  total_cogs: number;
  cogs_with_invoice: number;
  cogs_no_invoice: number;
  gross_profit: number;
  total_operating_costs: number;
  total_gift_costs: number;
  net_profit: number;
  invoice_count: number;
}

export interface PeriodReport {
  summary: PeriodSummary;
  start_date: Date;
  end_date: Date;
}
