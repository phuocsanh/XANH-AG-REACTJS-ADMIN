import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { handleApiError } from "@/utils/error-handler"

// ========== TYPES ==========
/**
 * Dữ liệu hàng ngày cho cảnh báo Bệnh Lem Lép Hạt
 */
export interface GrainDiscolorationDailyData {
  date: string
  dayOfWeek: string
  riskLevel: string
  riskScore: number
  tempAvg: number
  humidityAvg: number
  rainTotal: number // Lượng mưa (mm) - quan trọng nhất
  windSpeedAvg: number // Tốc độ gió (km/h)
}

/**
 * Cảnh báo Bệnh Lem Lép Hạt
 */
export interface GrainDiscolorationWarning {
  id: number
  generated_at: string
  risk_level: string // Enum: AN TOÀN | TRUNG BÌNH | CAO | ĐANG CHỜ CẬP NHẬT
  message: string
  peak_days: string | null
  daily_data: GrainDiscolorationDailyData[]
  updated_at: string
}

// ========== QUERY KEYS ==========
export const grainDiscolorationKeys = {
  all: ["grain-discoloration"] as const,
  warning: () => [...grainDiscolorationKeys.all, "warning"] as const,
} as const

// ========== WARNING HOOKS ==========

/**
 * Hook lấy cảnh báo Bệnh Lem Lép Hạt mới nhất
 */
export const useGrainDiscolorationWarningQuery = () => {
  return useQuery({
    queryKey: grainDiscolorationKeys.warning(),
    queryFn: async () => {
      const response = await api.get<GrainDiscolorationWarning>("/ai-grain-discoloration/warning")
      return response
    },
    // Tự động refetch mỗi 5 phút
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * Hook chạy phân tích Bệnh Lem Lép Hạt ngay lập tức
 * Lưu ý: API này mất 5-10 giây để hoàn thành
 */
export const useRunGrainDiscolorationAnalysisMutation = () => {
  return useMutation({
    mutationFn: async () => {
      // Sử dụng api.instance để có thể set timeout lâu hơn (2 phút) cho tác vụ AI
      const response = await api.instance.post<GrainDiscolorationWarning>("/ai-grain-discoloration/run-now", {}, {
        timeout: 120000
      })
      return response as unknown as GrainDiscolorationWarning
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: grainDiscolorationKeys.warning() })
      toast.success("Phân tích Bệnh Lem Lép Hạt hoàn tất!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi chạy phân tích Bệnh Lem Lép Hạt")
    },
  })
}
