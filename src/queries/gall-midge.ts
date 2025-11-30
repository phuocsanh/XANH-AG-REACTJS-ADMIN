import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { handleApiError } from "@/utils/error-handler"

// ========== TYPES ==========
/**
 * Dữ liệu hàng ngày cho cảnh báo Muỗi Hành
 */
export interface GallMidgeDailyData {
  date: string
  dayOfWeek: string
  riskLevel: string
  riskScore: number
  tempAvg: number
  humidityAvg: number
  cloudAvg: number // Độ che phủ mây (%) - quan trọng cho muỗi hành
}

/**
 * Cảnh báo Muỗi Hành
 */
export interface GallMidgeWarning {
  id: number
  generated_at: string
  risk_level: string // Enum: AN TOÀN | TRUNG BÌNH | CAO | ĐANG CHỜ CẬP NHẬT
  message: string
  daily_data: GallMidgeDailyData[]
  updated_at: string
}

// ========== QUERY KEYS ==========
export const gallMidgeKeys = {
  all: ["gall-midge"] as const,
  warning: () => [...gallMidgeKeys.all, "warning"] as const,
} as const

// ========== WARNING HOOKS ==========

/**
 * Hook lấy cảnh báo Muỗi Hành mới nhất
 */
export const useGallMidgeWarningQuery = () => {
  return useQuery({
    queryKey: gallMidgeKeys.warning(),
    queryFn: async () => {
      const response = await api.get<GallMidgeWarning>("/ai-gall-midge/warning")
      return response
    },
    // Tự động refetch mỗi 5 phút
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * Hook chạy phân tích Muỗi Hành ngay lập tức
 * Lưu ý: API này mất 5-10 giây để hoàn thành
 */
export const useRunGallMidgeAnalysisMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.postRaw<GallMidgeWarning>("/ai-gall-midge/run-now", {})
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gallMidgeKeys.warning() })
      toast.success("Phân tích Muỗi Hành hoàn tất!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi chạy phân tích Muỗi Hành")
    },
  })
}
