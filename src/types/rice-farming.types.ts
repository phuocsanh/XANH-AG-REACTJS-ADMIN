/**
 * TypeScript types cho hệ thống quản lý mùa Ruộng lúa
 */

// ==================== ENUMS ====================

/** Giai đoạn sinh trưởng của lúa */
export enum GrowthStage {
  SEEDLING = 'seedling',      // Giai đoạn mạ
  TILLERING = 'tillering',    // Giai đoạn đẻ nhánh
  PANICLE = 'panicle',        // Giai đoạn làm đòng
  HEADING = 'heading',        // Giai đoạn trỗ bông
  RIPENING = 'ripening',      // Giai đoạn chín
  HARVESTED = 'harvested',    // Đã thu hoạch
}

/** Trạng thái Ruộng lúa */
export enum CropStatus {
  ACTIVE = 'active',          // Đang canh tác
  HARVESTED = 'harvested',    // Đã thu hoạch
  FAILED = 'failed',          // Thất bại
}

/** Loại chi phí */
export enum CostCategory {
  SEED = 'seed',              // Giống
  FERTILIZER = 'fertilizer',  // Phân bón
  PESTICIDE = 'pesticide',    // Thuốc BVTV
  LABOR = 'labor',            // Nhân công
  MACHINERY = 'machinery',    // Máy móc
  IRRIGATION = 'irrigation',  // Tưới tiêu
  OTHER = 'other',            // Khác
}

/** Loại hoạt động canh tác */
export enum ActivityType {
  SPRAYING = 'spraying',          // Phun thuốc
  FERTILIZING = 'fertilizing',    // Bón phân
  IRRIGATION = 'irrigation',      // Tưới nước
  WEEDING = 'weeding',            // Làm cỏ
  PEST_CONTROL = 'pest_control',  // Diệt sâu bệnh
  OBSERVATION = 'observation',    // Quan sát
  OTHER = 'other',                // Khác
}

/** Loại ứng dụng (cho ApplicationRecord) */
export enum ApplicationType {
  FERTILIZER = 'fertilizer',
  PESTICIDE = 'pesticide',
  OTHER = 'other',
}

/** Tình trạng sức khỏe cây trồng */
export enum HealthStatus {
  HEALTHY = 'healthy',      // Khỏe mạnh
  STRESSED = 'stressed',    // Bị stress
  DISEASED = 'diseased',    // Bị bệnh
}

/** Mức độ nghiêm trọng */
export enum Severity {
  LOW = 'low',          // Thấp
  MEDIUM = 'medium',    // Trung bình
  HIGH = 'high',        // Cao
  SEVERE = 'severe',    // Nghiêm trọng
}

/** Trạng thái thanh toán */
export enum PaymentStatus {
  PENDING = 'pending',  // Chưa thanh toán
  PARTIAL = 'partial',  // Thanh toán một phần
  PAID = 'paid',        // Đã thanh toán
}

/** Trạng thái lịch */
export enum ScheduleStatus {
  PENDING = 'pending',      // Chưa thực hiện
  COMPLETED = 'completed',  // Đã hoàn thành
  CANCELLED = 'cancelled',  // Đã hủy
  OVERDUE = 'overdue',      // Quá hạn
}

/** Loại công việc trong lịch canh tác */
export enum ScheduleType {
  SOWING = 'sowing',           // Gieo sạ
  FERTILIZING = 'fertilizing', // Bón phân
  SPRAYING = 'spraying',       // Phun thuốc
  HARVESTING = 'harvesting',   // Thu hoạch
  OTHER = 'other',             // Khác
}

// ==================== INTERFACES ====================

/** Vùng trồng/Lô đất */
export interface AreaOfEachPlotOfLand {
  id: number;
  name?: string;
  code?: string;
  acreage?: number;
}

/** Ruộng lúa */
export interface RiceCrop {
  id: number;
  customer_id: number;
  season_id: number;
  field_name: string;
  amount_of_land: number; // Đổi tên từ large_labor_days
  field_area: number;
  area_of_each_plot_of_land_id?: number; // Thêm trường này
  location?: string;
  rice_variety: string;
  seed_source?: string;
  sowing_date?: string;
  transplanting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  growth_stage: GrowthStage;
  status: CropStatus;
  yield_amount?: number;
  quality_grade?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customer?: any;  // Từ customer module
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  season?: any;    // Từ season module
  areaOfEachPlotOfLand?: AreaOfEachPlotOfLand; // Relation object
}

/** Chi phí */
export interface CostItem {
  id: number;
  rice_crop_id: number;
  category: CostCategory;
  item_name: string;
  quantity?: number;
  unit?: string;
  unit_price: number;
  total_cost: number;
  purchase_date?: string;
  invoice_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/** Bản ghi thu hoạch */
export interface HarvestRecord {
  id: number;
  rice_crop_id: number;
  harvest_date: string;
  yield_amount: number;
  moisture_content?: number;
  quality_grade: string;
  selling_price_per_unit: number;
  total_revenue: number;
  buyer?: string;
  payment_status: PaymentStatus;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/** Lịch canh tác */
export interface FarmingSchedule {
  id: number;
  rice_crop_id: number;
  activity_type: ActivityType;
  activity_name: string;
  scheduled_date: string;
  scheduled_time?: string;
  product_ids?: number[];
  estimated_quantity?: number;
  estimated_cost?: number;
  instructions?: string;
  weather_dependent: boolean;
  status: ScheduleStatus;
  reminder_enabled: boolean;
  reminder_time?: string;
  completed_date?: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
}

/** Sản phẩm trong nhật ký */
export interface ApplicationProduct {
  product_id: number;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

/** Nhật ký phun thuốc/bón phân */
export interface ApplicationRecord {
  id: number;
  rice_crop_id: number;
  farming_schedule_id?: number;
  type: ApplicationType; // Đổi từ activity_type sang type để khớp với frontend
  application_date: string;
  product_name: string; // Thêm trường này cho đơn giản hóa UI
  dosage: number;       // Thêm trường này
  unit: string;         // Thêm trường này
  area_applied?: number;
  applicator_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/** Theo dõi sinh trưởng */
export interface GrowthTracking {
  id: number;
  rice_crop_id: number;
  check_date: string; // Đổi từ tracking_date sang check_date
  stage: GrowthStage; // Đổi từ growth_stage sang stage
  height_cm?: number; // Đổi từ plant_height sang height_cm
  leaf_color?: string;
  pest_status?: string; // Đổi từ pest_disease_detected
  notes?: string;
  images?: string[]; // Đổi từ photo_urls
  created_at: string;
  updated_at: string;
}

/** Báo cáo lợi nhuận */
export interface ProfitReport {
  total_revenue: number;
  total_cost: number;
  net_profit: number;
  roi: number;
  cost_breakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

/** Tổng hợp chi phí */
export interface CostSummary {
  total: number;
  breakdown: Record<CostCategory, number>;
  items: CostItem[];
}

/** Thống kê khách hàng */
export interface CustomerStats {
  total: number;
  active: number;
  harvested: number;
  failed: number;
  totalArea: number;
  totalYield: number;
}

// ==================== DTOs ====================

/** DTO tạo Ruộng lúa */
export interface CreateRiceCropDto {
  customer_id: number;
  season_id: number;
  field_name: string;
  amount_of_land: number; // Đổi tên từ large_labor_days
  field_area: number;
  area_of_each_plot_of_land_id?: number; // Thêm trường này
  location?: string;
  rice_variety: string;
  seed_source?: string;
  sowing_date?: string;
  transplanting_date?: string;
  expected_harvest_date?: string;
  notes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;  // Index signature để tương thích với api.postRaw
}

/** DTO cập nhật Ruộng lúa */
export interface UpdateRiceCropDto {
  field_name?: string;
  amount_of_land?: number; // Đổi tên từ large_labor_days
  field_area?: number;
  area_of_each_plot_of_land_id?: number; // Thêm trường này
  location?: string;
  rice_variety?: string;
  expected_harvest_date?: string;
  yield_amount?: number;
  quality_grade?: string;
  notes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;  // Index signature để tương thích với api.patchRaw
}

/** DTO cập nhật giai đoạn sinh trưởng */
export interface UpdateGrowthStageDto {
  growth_stage: GrowthStage;
  notes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;  // Index signature để tương thích với api.patchRaw
}

/** DTO cập nhật trạng thái */
export interface UpdateStatusDto {
  status: CropStatus;
  notes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;  // Index signature để tương thích với api.patchRaw
}

/** DTO tạo chi phí */
export interface CreateCostItemDto {
  rice_crop_id: number;
  category: CostCategory;
  item_name: string;
  quantity?: number;
  unit?: string;
  unit_price: number;
  total_cost: number;
  purchase_date?: string;
  invoice_id?: number;
  notes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;  // Index signature để tương thích với api.postRaw
}

/** DTO tạo bản ghi thu hoạch */
export interface CreateHarvestRecordDto {
  rice_crop_id: number;
  harvest_date: string;
  yield_amount: number;
  moisture_content?: number;
  quality_grade: string;
  selling_price_per_unit: number;
  total_revenue: number;
  buyer?: string;
  payment_status: PaymentStatus;
  payment_date?: string;
  notes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;  // Index signature để tương thích với api.postRaw
}

/** DTO tạo lịch canh tác */
export interface CreateFarmingScheduleDto {
  rice_crop_id: number;
  type: ScheduleType;  // Đổi từ activity_type
  title: string;       // Đổi từ activity_name
  scheduled_date: string;
  actual_date?: string;
  status?: ScheduleStatus;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;  // Index signature để tương thích với api.postRaw
}

/** DTO tạo nhật ký */
export interface CreateApplicationRecordDto {
  rice_crop_id: number;
  farming_schedule_id?: number;
  type: ApplicationType;
  application_date: string;
  product_name: string;
  dosage: number;
  unit: string;
  area_applied?: number;
  applicator_name?: string;
  notes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Index signature để tránh lỗi dư thừa
}

/** DTO tạo theo dõi sinh trưởng */
export interface CreateGrowthTrackingDto {
  rice_crop_id: number;
  tracking_date: string;
  growth_stage: GrowthStage;
  plant_height?: number;
  tiller_count?: number;
  leaf_color?: string;
  health_status: HealthStatus;
  pest_disease_detected?: string;
  severity?: Severity;
  photo_urls?: string[];
  notes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;  // Index signature để tương thích với api.postRaw
}

// ==================== FILTER PARAMS ====================

/** Tham số lọc Ruộng lúa */
export interface RiceCropFilters {
  customer_id?: number;
  season_id?: number;
  status?: CropStatus;
  growth_stage?: GrowthStage;
}

/** Tham số lọc chi phí */
export interface CostItemFilters {
  rice_crop_id?: number;
  category?: CostCategory;
}

/** Tham số lọc lịch canh tác */
export interface FarmingScheduleFilters {
  rice_crop_id?: number;
  status?: ScheduleStatus;
  activity_type?: ActivityType;
}
