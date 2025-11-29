/**
 * Interface cho dữ liệu chi tiết từng ngày
 */
export interface DailyRiskData {
  date: string; // Định dạng: DD/MM
  dayOfWeek: string; // Thứ trong tuần (T2, T3, ...)
  tempMin: number; // Nhiệt độ thấp nhất (°C)
  tempMax: number; // Nhiệt độ cao nhất (°C)
  tempAvg: number; // Nhiệt độ trung bình (°C)
  humidityAvg: number; // Độ ẩm trung bình (%)
  lwdHours: number; // Số giờ lá ướt (0-24)
  rainTotal: number; // Tổng lượng mưa (mm)
  rainHours: number; // Số giờ có mưa
  fogHours: number; // Số giờ có sương mù
  cloudCoverAvg: number; // Độ che phủ mây trung bình (%)
  visibilityAvg: number; // Tầm nhìn trung bình (m)
  riskScore: number; // Điểm nguy cơ tổng (0-135)
  riskLevel: string; // Mức độ nguy cơ
  breakdown: {
    tempScore: number; // Điểm nhiệt độ
    lwdScore: number; // Điểm lá ướt
    humidityScore: number; // Điểm độ ẩm
    rainScore: number; // Điểm mưa
    fogScore: number; // Điểm sương mù
  };
}

/**
 * Mức độ nguy cơ bệnh đạo ôn
 */
export type RiskLevel = 
  | 'AN TOÀN' 
  | 'THẤP' 
  | 'TRUNG BÌNH' 
  | 'CAO' 
  | 'RẤT CAO' 
  | 'ĐANG CHỜ CẬP NHẬT';

/**
 * Entity cảnh báo bệnh đạo ôn
 */
export interface RiceBlastWarning {
  id: number; // Luôn = 1
  generated_at: string; // ISO timestamp
  risk_level: RiskLevel; // Mức độ nguy cơ
  probability: number; // Xác suất nhiễm bệnh (0-100%)
  message: string; // Tin nhắn cảnh báo chi tiết
  peak_days: string | null; // Ngày cao điểm (VD: "30/11 – 02/12")
  daily_data: DailyRiskData[]; // Dữ liệu chi tiết 7 ngày
  updated_at: string; // ISO timestamp
}

/**
 * Entity vị trí ruộng lúa
 */
export interface Location {
  id: number; // Luôn = 1
  name: string; // Tên vị trí
  lat: number; // Vĩ độ (-90 đến 90)
  lon: number; // Kinh độ (-180 đến 180)
  updated_at: string; // ISO timestamp
}

/**
 * DTO cập nhật vị trí
 */
export interface UpdateLocationDto {
  name: string;
  lat: number;
  lon: number;
}
