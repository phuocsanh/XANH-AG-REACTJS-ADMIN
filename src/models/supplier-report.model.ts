/**
 * Interfaces cho báo cáo thống kê nhà cung cấp
 */

export interface SupplierProductStat {
  product_id: number;
  product_code: string;
  product_name: string;
  quantity_sold: number;
  unit_name?: string;
  total_revenue: number; // Tổng giá trị bán ra (giá bán)
  total_cost: number;    // Tổng giá trị nhập vào (giá vốn/giá nhập)
  profit: number;        // Lợi nhuận
  margin: number;        // Tỷ suất lợi nhuận (%)
}

export interface SupplierStatsSummary {
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  gross_margin: number;
  product_count: number;
  invoice_count: number;
  period?: {
    start_date?: string;
    end_date?: string;
  };
}

export interface SupplierReport {
  supplier_id: number;
  supplier_name: string;
  summary: SupplierStatsSummary;
  products: SupplierProductStat[];
}
