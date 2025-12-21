import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { handleApiError } from "@/utils/error-handler"

// ========== TYPES ==========
/**
 * Dữ liệu hàng ngày cho cảnh báo Sâu Đục Thân
 */
export interface StemBorerDailyData {
  date: string
  dayOfWeek: string
  riskLevel: string
  riskScore: number
  tempAvg: number
  humidityAvg: number
  sunHours: number // Số giờ nắng - quan trọng cho bướm vũ hóa
}

/**
 * Cảnh báo Sâu Đục Thân
 */
export interface StemBorerWarning {
  id: number
  generated_at: string
  risk_level: string // Enum: AN TOÀN | TRUNG BÌNH | CAO | ĐANG CHỜ CẬP NHẬT
  message: string
  peak_days: string | null
  daily_data: StemBorerDailyData[]
  updated_at: string
}

// ========== QUERY KEYS ==========
export const stemBorerKeys = {
  all: ["stem-borer"] as const,
  warning: () => [...stemBorerKeys.all, "warning"] as const,
} as const

// ========== WARNING HOOKS ==========

/**
 * Hook lấy cảnh báo Sâu Đục Thân mới nhất
 */
export const useStemBorerWarningQuery = () => {
  return useQuery({
    queryKey: stemBorerKeys.warning(),
    queryFn: async () => {
      const response = await api.get<StemBorerWarning>("/ai-stem-borer/warning")
      return (response as any)?.data || response
    },
    // Tự động refetch mỗi 5 phút
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * Hook chạy phân tích Sâu Đục Thân ngay lập tức
 * Lưu ý: API này mất 5-10 giây để hoàn thành
 */
export const useRunStemBorerAnalysisMutation = () => {
  return useMutation({
    mutationFn: async () => {
      // Sử dụng api.instance để có thể set timeout lâu hơn (2 phút) cho tác vụ AI
      const response = await api.instance.post<StemBorerWarning>("/ai-stem-borer/run-now", {}, {
        timeout: 120000
      })
      return response as unknown as StemBorerWarning
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stemBorerKeys.warning() })
      toast.success("Phân tích Sâu Đục Thân hoàn tất!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi chạy phân tích Sâu Đục Thân")
    },
  })
}
