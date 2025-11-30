import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { handleApiError } from "@/utils/error-handler"

// ========== TYPES ==========
/**
 * Dữ liệu hàng ngày cho cảnh báo Bệnh Khô Vằn
 */
export interface SheathBlightDailyData {
  date: string
  dayOfWeek: string
  riskLevel: string
  riskScore: number
  tempAvg: number // Nhiệt độ (cần nóng 28-32°C)
  humidityAvg: number // Độ ẩm
}

/**
 * Cảnh báo Bệnh Khô Vằn
 */
export interface SheathBlightWarning {
  id: number
  generated_at: string
  risk_level: string // Enum: AN TOÀN | TRUNG BÌNH | CAO | ĐANG CHỜ CẬP NHẬT
  message: string
  peak_days: string | null
  daily_data: SheathBlightDailyData[]
  updated_at: string
}

// ========== QUERY KEYS ==========
export const sheathBlightKeys = {
  all: ["sheath-blight"] as const,
  warning: () => [...sheathBlightKeys.all, "warning"] as const,
} as const

// ========== WARNING HOOKS ==========

/**
 * Hook lấy cảnh báo Bệnh Khô Vằn mới nhất
 */
export const useSheathBlightWarningQuery = () => {
  return useQuery({
    queryKey: sheathBlightKeys.warning(),
    queryFn: async () => {
      const response = await api.get<SheathBlightWarning>("/ai-sheath-blight/warning")
      return response
    },
    // Tự động refetch mỗi 5 phút
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * Hook chạy phân tích Bệnh Khô Vằn ngay lập tức
 * Lưu ý: API này mất 5-10 giây để hoàn thành
 */
export const useRunSheathBlightAnalysisMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.postRaw<SheathBlightWarning>("/ai-sheath-blight/run-now", {})
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sheathBlightKeys.warning() })
      toast.success("Phân tích Bệnh Khô Vằn hoàn tất!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi chạy phân tích Bệnh Khô Vằn")
    },
  })
}
