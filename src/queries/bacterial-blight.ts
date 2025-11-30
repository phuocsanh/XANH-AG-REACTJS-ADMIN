import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { handleApiError } from "@/utils/error-handler"

// ========== TYPES ==========
export interface BacterialBlightDailyData {
  date: string
  dayOfWeek: string
  tempMin: number
  tempMax: number
  tempAvg: number
  humidityAvg: number
  rainTotal: number
  rainHours: number
  windSpeedMax: number
  windSpeedAvg: number
  rain3Days: number
  riskScore: number
  riskLevel: string
  breakdown: {
    tempScore: number
    rainScore: number
    windScore: number
    humidityScore: number
    floodScore: number
  }
}

export interface BacterialBlightWarning {
  id: number
  generated_at: string
  risk_level: string
  message: string
  peak_days: string
  daily_data: BacterialBlightDailyData[]
  updated_at: string
}

// ========== QUERY KEYS ==========
export const bacterialBlightKeys = {
  all: ["bacterial-blight"] as const,
  warning: () => [...bacterialBlightKeys.all, "warning"] as const,
} as const

// ========== WARNING HOOKS ==========

/**
 * Hook lấy cảnh báo bệnh cháy bìa lá mới nhất
 */
export const useBacterialBlightWarningQuery = () => {
  return useQuery({
    queryKey: bacterialBlightKeys.warning(),
    queryFn: async () => {
      const response = await api.get<BacterialBlightWarning>("/ai-bacterial-blight/warning")
      return response
    },
    // Tự động refetch mỗi 5 phút
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * Hook chạy phân tích bệnh cháy bìa lá ngay lập tức
 * Lưu ý: API này mất 5-10 giây để hoàn thành
 */
export const useRunBacterialBlightAnalysisMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.postRaw<BacterialBlightWarning>("/ai-bacterial-blight/run-now", {})
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bacterialBlightKeys.warning() })
      toast.success("Phân tích bệnh cháy bìa lá hoàn tất!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi chạy phân tích bệnh cháy bìa lá")
    },
  })
}
