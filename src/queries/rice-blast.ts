import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { Location, RiceBlastWarning, UpdateLocationDto } from "@/models/rice-blast"
import { handleApiError } from "@/utils/error-handler"

// ========== QUERY KEYS ==========
export const riceBlastKeys = {
  all: ["rice-blast"] as const,
  location: () => [...riceBlastKeys.all, "location"] as const,
  warning: () => [...riceBlastKeys.all, "warning"] as const,
} as const

// ========== LOCATION HOOKS ==========

/**
 * Hook lấy vị trí ruộng lúa hiện tại
 */
export const useLocationQuery = () => {
  return useQuery({
    queryKey: riceBlastKeys.location(),
    queryFn: async () => {
      const response = await api.get<Location>("/location")
      return response
    },
  })
}

/**
 * Hook cập nhật vị trí ruộng lúa
 * Lưu ý: Sau khi cập nhật, cần gọi riêng run-now cho từng bệnh
 */
export const useUpdateLocationMutation = () => {
  return useMutation({
    mutationFn: async (location: UpdateLocationDto) => {
      const response = await api.postRaw<Location>("/location", location as any)
      return response
    },
    onSuccess: () => {
      // Invalidate location và cả 2 warning vì có thể cần phân tích lại
      queryClient.invalidateQueries({ queryKey: riceBlastKeys.location() })
      queryClient.invalidateQueries({ queryKey: riceBlastKeys.warning() })
      toast.success("Cập nhật vị trí thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật vị trí")
    },
  })
}

// ========== WARNING HOOKS ==========

/**
 * Hook lấy cảnh báo bệnh đạo ôn mới nhất
 */
export const useWarningQuery = () => {
  return useQuery({
    queryKey: riceBlastKeys.warning(),
    queryFn: async () => {
      const response = await api.get<RiceBlastWarning>("/ai-rice-blast/warning")
      return response
    },
    // Tự động refetch mỗi 5 phút
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * Hook chạy phân tích bệnh đạo ôn ngay lập tức
 * Lưu ý: API này mất 5-10 giây để hoàn thành
 */
export const useRunAnalysisMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.postRaw<RiceBlastWarning>("/ai-rice-blast/run-now", {})
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riceBlastKeys.warning() })
      toast.success("Phân tích hoàn tất!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi chạy phân tích")
    },
  })
}

