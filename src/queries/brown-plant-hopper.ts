import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { handleApiError } from "@/utils/error-handler"

// ========== TYPES ==========
/**
 * Dữ liệu hàng ngày cho cảnh báo Rầy Nâu
 */
export interface BrownPlantHopperDailyData {
  date: string
  dayOfWeek: string
  riskLevel: string
  riskScore: number
  tempAvg: number
  humidityAvg: number
  windSpeedAvg: number // Tốc độ gió (km/h) - quan trọng cho rầy di trú
  rainTotal: number // Lượng mưa (mm)
}

/**
 * Cảnh báo Rầy Nâu
 */
export interface BrownPlantHopperWarning {
  id: number
  generated_at: string
  risk_level: string // Enum: AN TOÀN | TRUNG BÌNH | CAO | ĐANG CHỜ CẬP NHẬT
  message: string
  peak_days: string | null
  daily_data: BrownPlantHopperDailyData[]
  updated_at: string
}

// ========== QUERY KEYS ==========
export const brownPlantHopperKeys = {
  all: ["brown-plant-hopper"] as const,
  warning: () => [...brownPlantHopperKeys.all, "warning"] as const,
} as const

// ========== WARNING HOOKS ==========

/**
 * Hook lấy cảnh báo Rầy Nâu mới nhất
 */
export const useBrownPlantHopperWarningQuery = () => {
  return useQuery({
    queryKey: brownPlantHopperKeys.warning(),
    queryFn: async () => {
      const response = await api.get<BrownPlantHopperWarning>("/ai-brown-plant-hopper/warning")
      return response
    },
    // Tự động refetch mỗi 5 phút
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * Hook chạy phân tích Rầy Nâu ngay lập tức
 * Lưu ý: API này mất 5-10 giây để hoàn thành
 */
export const useRunBrownPlantHopperAnalysisMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.postRaw<BrownPlantHopperWarning>("/ai-brown-plant-hopper/run-now", {})
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brownPlantHopperKeys.warning() })
      toast.success("Phân tích Rầy Nâu hoàn tất!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi chạy phân tích Rầy Nâu")
    },
  })
}
