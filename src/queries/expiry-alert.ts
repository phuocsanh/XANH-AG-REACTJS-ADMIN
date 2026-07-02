/**
 * React Query hooks cho chức năng quản lý cảnh báo lô hàng sắp hết hạn
 */
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { handleApiError } from "@/utils/error-handler"
import type {
  ExpiryAlert,
  ExpiryAlertStats,
  ExpiryAlertPaginatedResponse,
  ExpiryAlertListParams,
  ResolveMultipleRequest,
  ResolveMultipleResponse,
} from "@/models/expiry-alert.model"

// ========== QUERY KEYS ==========
export const expiryAlertKeys = {
  all: ["expiry-alert"] as const,
  lists: () => [...expiryAlertKeys.all, "list"] as const,
  list: (params: ExpiryAlertListParams) => [...expiryAlertKeys.lists(), params] as const,
  stats: () => [...expiryAlertKeys.all, "stats"] as const,
}

// ========== QUERIES ==========

/**
 * Lấy danh sách cảnh báo hết hạn có phân trang và bộ lọc
 */
export const useExpiryAlerts = (params: ExpiryAlertListParams = {}) => {
  return useQuery<ExpiryAlertPaginatedResponse>({
    queryKey: expiryAlertKeys.list(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.status) queryParams.append("status", params.status)
      if (params.type) queryParams.append("type", params.type)
      if (params.page) queryParams.append("page", String(params.page))
      if (params.limit) queryParams.append("limit", String(params.limit))

      return api.get<ExpiryAlertPaginatedResponse>(
        `/expiry-alert?${queryParams.toString()}`
      )
    },
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  })
}

/**
 * Lấy thống kê tổng hợp cảnh báo hết hạn (dùng cho các card thống kê)
 */
export const useExpiryAlertStats = () => {
  return useQuery<ExpiryAlertStats>({
    queryKey: expiryAlertKeys.stats(),
    queryFn: async () => {
      return api.get<ExpiryAlertStats>("/expiry-alert/stats")
    },
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    refetchInterval: 10 * 60 * 1000, // Tự refresh mỗi 10 phút
  })
}

// ========== MUTATIONS ==========

/**
 * Kích hoạt quét hạn dùng thủ công
 */
export const useManualCheckExpiry = () => {
  return useMutation<{ scanned: number; alertsCreated: number; alertsUpdated: number }, Error>({
    mutationFn: async () => {
      return api.postRaw<{ scanned: number; alertsCreated: number; alertsUpdated: number }>(
        "/expiry-alert/check",
        {}
      )
    },
    onSuccess: (result) => {
      toast.success(
        `✅ Quét xong: ${result.scanned} lô, tạo mới ${result.alertsCreated}, cập nhật ${result.alertsUpdated} cảnh báo.`
      )
      // Làm mới danh sách và thống kê sau khi quét
      queryClient.invalidateQueries({ queryKey: expiryAlertKeys.all })
    },
    onError: (error) => {
      handleApiError(error, "Lỗi khi quét hạn dùng")
    },
  })
}

/**
 * Đánh dấu một cảnh báo đã xử lý
 */
export const useResolveExpiryAlert = () => {
  return useMutation<ExpiryAlert, Error, { id: number; notes?: string }>({
    mutationFn: async ({ id, notes }) => {
      return api.patchRaw<ExpiryAlert>(`/expiry-alert/${id}/resolve`, { notes })
    },
    onSuccess: () => {
      toast.success("✅ Đã đánh dấu lô hàng xử lý xong!")
      queryClient.invalidateQueries({ queryKey: expiryAlertKeys.all })
    },
    onError: (error) => {
      handleApiError(error, "Lỗi khi xử lý cảnh báo")
    },
  })
}

/**
 * Đánh dấu nhiều cảnh báo đã xử lý cùng lúc
 */
export const useResolveMultipleAlerts = () => {
  return useMutation<ResolveMultipleResponse, Error, ResolveMultipleRequest>({
    mutationFn: async (payload) => {
      return api.postRaw<ResolveMultipleResponse>("/expiry-alert/resolve-multiple", payload)
    },
    onSuccess: (result) => {
      toast.success(`✅ Đã xử lý ${result.resolved} lô hàng!`)
      queryClient.invalidateQueries({ queryKey: expiryAlertKeys.all })
    },
    onError: (error) => {
      handleApiError(error, "Lỗi khi xử lý hàng loạt")
    },
  })
}
