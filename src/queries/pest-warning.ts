import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { handleApiError } from "@/utils/error-handler"

// ========== TYPES ==========
export interface PestDailyData {
  date: string
  dayOfWeek: string
  tempAvg: number
  humidityAvg: number
  rainTotal: number
  sunHours: number
  
  stemBorerScore: number
  gallMidgeScore: number
  
  stemBorerLevel: string
  gallMidgeLevel: string
}

export interface PestWarning {
  id: number
  generated_at: string
  stem_borer_risk: string
  gall_midge_risk: string
  message: string
  daily_data: PestDailyData[]
  updated_at: string
}

// ========== QUERY KEYS ==========
export const pestWarningKeys = {
  all: ["pest-warning"] as const,
  warning: () => [...pestWarningKeys.all, "warning"] as const,
} as const

// ========== WARNING HOOKS ==========

/**
 * Hook lấy cảnh báo sâu hại mới nhất
 */
export const usePestWarningQuery = () => {
  return useQuery({
    queryKey: pestWarningKeys.warning(),
    queryFn: async () => {
      const response = await api.get<PestWarning>("/ai-pest-warning/warning")
      return response
    },
    // Tự động refetch mỗi 5 phút
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * Hook chạy phân tích sâu hại ngay lập tức
 */
export const useRunPestAnalysisMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.postRaw<PestWarning>("/ai-pest-warning/run-now", {})
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pestWarningKeys.warning() })
      toast.success("Phân tích sâu hại hoàn tất!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi chạy phân tích sâu hại")
    },
  })
}
