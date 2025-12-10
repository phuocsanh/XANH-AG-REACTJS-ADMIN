import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { DebtNote, PayDebtDto, CreateDebtNoteDto } from "@/models/debt-note"
import { invalidateResourceQueries } from "@/utils/query-helpers"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"

// ========== QUERY KEYS ==========
export const debtNoteKeys = {
  all: ["debt-notes"] as const,
  lists: () => [...debtNoteKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...debtNoteKeys.lists(), params] as const,
  details: () => [...debtNoteKeys.all, "detail"] as const,
  detail: (id: number) => [...debtNoteKeys.details(), id] as const,
} as const

// ========== DEBT NOTE HOOKS ==========

/**
 * Hook lấy danh sách công nợ (dùng POST /debt-notes/search)
 * Trả về kèm statistics từ API
 */
export const useDebtNotesQuery = (params?: Record<string, unknown>) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 10
  const status = params?.status as string | undefined

  return useQuery({
    queryKey: debtNoteKeys.list(params),
    queryFn: async () => {
      // Build payload với flat params (không dùng filters array nữa)
      const payload: any = {
        page,
        limit,
      }

      // Thêm các flat params
      if (status) payload.status = status
      if (params?.customer_id) payload.customer_id = params.customer_id
      if (params?.season_id) payload.season_id = params.season_id
      if (params?.keyword) payload.keyword = params.keyword

      // Sort
      if (params?.sort_by) {
        const field = String(params.sort_by)
        const dir = String(params.sort_direction || 'DESC')
        payload.sort = `${field}:${dir}`
      }

      const response = await api.postRaw<{
        data: DebtNote[]
        total: number
        page: number
        limit: number
        summary: {
          total_debt: number
          overdue_count: number
          active_count: number
          paid_count: number
        }
      }>('/debt-notes/search', payload)

      // Transform response để phù hợp với PaginationResponse format
      return {
        data: {
          items: response.data,
          total: response.total,
          page: response.page,
          limit: response.limit,
          total_pages: Math.ceil(response.total / response.limit),
          has_next: response.page * response.limit < response.total,
          has_prev: response.page > 1,
          summary: response.summary // Thêm summary vào response
        },
        status: 200,
        message: 'Success',
        success: true
      }
    },
    refetchOnMount: true,
    staleTime: 0,
  })
}

/**
 * Hook lấy công nợ theo ID
 */
export const useDebtNoteQuery = (id: number) => {
  return useQuery({
    queryKey: debtNoteKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<DebtNote>(`/debt-notes/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo phiếu nợ
 */
export const useCreateDebtNoteMutation = () => {
  return useMutation({
    mutationFn: async (debtNote: CreateDebtNoteDto) => {
      const response = await api.postRaw<DebtNote>("/debt-notes", debtNote as any)
      return response
    },
    onSuccess: () => {
      invalidateResourceQueries("/debt-notes")
      toast.success("Tạo phiếu nợ thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo phiếu nợ")
    },
  })
}

/**
 * @deprecated Hook trả nợ cũ - KHÔNG SỬ DỤNG NỮA
 * 
 * Chức năng trả nợ đã được chuyển sang API mới:
 * - Endpoint: POST /payments/settle-debt
 * - Hook mới: useSettleAndRolloverMutation (trong payment.ts)
 * 
 * Lý do thay đổi:
 * - Backend tự động phân bổ thanh toán theo FIFO
 * - Hỗ trợ chốt sổ công nợ theo mùa vụ
 * - Tự động tạo phiếu thu và cập nhật phiếu nợ
 */
// export const usePayDebtMutation = () => { ... } - ĐÃ XÓA

/**
 * Hook xóa phiếu nợ
 */
export const useDeleteDebtNoteMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/debt-notes/${id}`)
      return response
    },
    onSuccess: () => {
      invalidateResourceQueries("/debt-notes")
      toast.success("Xóa phiếu nợ thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa phiếu nợ")
    },
  })
}
