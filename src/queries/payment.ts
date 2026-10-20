import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { invalidateResourceQueries, invalidateCustomerRewardQueries } from "@/utils/query-helpers"
import { Payment, CreatePaymentDto, SettlePaymentDto, PaymentAllocation, PaymentRollbackPreview, PaymentRollbackHistoryItem } from "@/models/payment"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"

import { mapSearchResponse } from "@/utils/api-response-mapper"

// ========== QUERY KEYS ==========
export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...paymentKeys.lists(), params] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: number) => [...paymentKeys.details(), id] as const,
  allocations: (id: number) => [...paymentKeys.detail(id), "allocations"] as const,
  rollbackPreview: (id: number) => [...paymentKeys.detail(id), "rollback-preview"] as const,
  rollbackHistories: () => [...paymentKeys.all, "rollback-history"] as const,
  rollbackHistory: (params?: Record<string, unknown>) =>
    [...paymentKeys.rollbackHistories(), params] as const,
} as const

// ========== PAYMENT HOOKS ==========

// Helper define type for filter
interface FilterCondition {
  field: string;
  operator: string;
  value: any;
}

/**
 * Hook lấy danh sách thanh toán (POST /payments/search)
 */
export const usePaymentsQuery = (params?: Record<string, unknown>) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 10

  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: async () => {
      // API MỚI (theo Migration Guide & Source Code src copy):
      // 1. Không dùng filters array.
      // 2. Dùng Flat Params.
      // 3. DTO validation (whitelist) chặn các field lạ -> Phải map chính xác tên field trong SearchPaymentDto.
      
      const payload: any = {
        page,
        limit,
      };

      // --- Flat Fields ---
      if (params?.code) payload.code = params.code;
      if (params?.payment_method) payload.payment_method = params.payment_method;
      if (params?.debt_note_code) payload.debt_note_code = params.debt_note_code;

      // --- Mapped Fields ---
      // UI dùng customer_term -> Server DTO dùng customer_name (được map sang customer.name trong Service)
      if (params?.customer_term) {
        payload.customer_name = params.customer_term;
      }

      // --- Flat Fields ---
      if (params?.code) payload.code = params.code;
      if (params?.payment_method) payload.payment_method = params.payment_method;
      if (params?.debt_note_code) payload.debt_note_code = params.debt_note_code;

      // --- Mapped Fields ---
      // UI dùng customer_term -> Server DTO dùng customer_name
      if (params?.customer_term) {
        payload.customer_name = params.customer_term;
      }

      // UI dùng sort_by/direction -> Server dùng sort param (format: field:DIR)
      if (params?.sort_by) {
        const field = String(params.sort_by);
        const dir = String(params.sort_direction || 'DESC');
        // Backend hỗ trợ sort: 'amount:DESC'
        payload.sort = `${field}:${dir}`; 
      }

      // Global Search (keyword)
      if (params?.keyword) {
        payload.keyword = params.keyword;
      }

      // Note: Backend có thể chưa support start_date/end_date trong DTO strict mode, 
      // nhưng cần gửi lên để user thấy payload. Nếu backend strip thì phải báo backend dev thêm vào DTO.
      if (params?.start_date) {
        payload.start_date = params.start_date;
      }
      if (params?.end_date) {
        payload.end_date = params.end_date;
      }

      const response = await api.postRaw<{
        success: boolean
        data: Payment[]
        pagination: {
          total: number
          totalPages: number | null
        }
      }>('/payments/search', payload)

      return mapSearchResponse(response, page, limit)
    },
    refetchOnMount: true,
    staleTime: 0,
  })
}

/**
 * Hook lấy thanh toán theo ID
 */
export const usePaymentQuery = (id: number) => {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Payment>(`/payments/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook lấy phân bổ thanh toán
 */
export const usePaymentAllocationsQuery = (id: number) => {
  return useQuery({
    queryKey: paymentKeys.allocations(id),
    queryFn: async () => {
      const response = await api.get<PaymentAllocation[]>(`/payments/${id}/allocations`)
      return response
    },
    enabled: !!id,
  })
}



/**
 * Hook chốt sổ với phiếu nợ
 */
export const useSettlePaymentMutation = () => {
  return useMutation({
    mutationFn: async (data: SettlePaymentDto) => {
      const response = await api.postRaw<any>("/payments/settle-with-debt-note", data as any)
      return response
    },
    onSuccess: () => {
      invalidateCustomerRewardQueries()
      invalidateResourceQueries("/payments")
      invalidateResourceQueries("/debt-notes")
      invalidateResourceQueries("/customers")
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Chốt sổ thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi chốt sổ")
    },
  })
}

/**
 * Hook chốt sổ công nợ (API mới - settle-debt)
 * Thay thế cho usePayDebtMutation cũ
 * 
 * API này tự động:
 * - Phân bổ thanh toán theo FIFO (hóa đơn cũ trước)
 * - Tạo phiếu thu mới
 * - Cập nhật phiếu nợ (settled hoặc paid)
 * - Không tạo phiếu nợ mới (giữ nguyên nợ cũ nếu trả thiếu)
 */
export const useSettleAndRolloverMutation = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.postRaw<any>(
        "/payments/settle-debt", 
        data as any
      )
      return response
    },
    onSuccess: () => {
      invalidateCustomerRewardQueries()
      invalidateResourceQueries("/payments")
      invalidateResourceQueries("/debt-notes")
      invalidateResourceQueries("/customers")
      // Invalidate customer search queries (key starts with "customers", not "/customers")
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      // Invalidate debt-notes queries cụ thể
      queryClient.invalidateQueries({ queryKey: ["debt-notes"] })
      // 🔥 Invalidate preview tích lũy để cập nhật số tiền đã trả mới nhất
      queryClient.invalidateQueries({ queryKey: ["customer-reward-preview"] })
      toast.success("Thanh toán công nợ thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi chốt sổ")
    },
  })
}

/**
 * Hook hoàn tác thanh toán (Rollback)
 * Hoàn trả tiền vào công nợ và xóa payment
 */
export const useRollbackPaymentMutation = () => {
  return useMutation({
    mutationFn: async (input: { id: number; reason: string; preview_token: string }) => {
      const response = await api.postRaw<{
        success: boolean;
        message: string;
        payment: any;
        payment_kind: string;
        affected_invoices: number;
        affected_debt_notes: number;
      }>(`/payments/${input.id}/rollback`, { reason: input.reason, preview_token: input.preview_token })

      return response
    },
    onSuccess: (response) => {
      invalidateCustomerRewardQueries()
      
      // Invalidate payments queries: đánh dấu stale toàn bộ nhưng KHÔNG tự refetch để tránh
      // gọi lại /payments/:id/rollback-preview của phiếu vừa xóa (404) khi modal còn đang mở.
      queryClient.invalidateQueries({ queryKey: paymentKeys.all, refetchType: "none" })
      // Chỉ danh sách và lịch sử hoàn tác cần tải lại ngay.
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.rollbackHistories() })
      
      // Invalidate các queries liên quan
      invalidateResourceQueries("/debt-notes")
      invalidateResourceQueries("/sales")
      // Trang Công nợ/Hóa đơn dùng key dạng ["debt-notes", ...] và ["sales-invoices", ...]
      // nên phải invalidate đúng prefix này, nếu không danh sách giữ số liệu cũ sau khi hoàn tác.
      queryClient.invalidateQueries({ queryKey: ["debt-notes"] })
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] })
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      // Phiếu trả vay mở lại khoản vay; dashboard và lịch sử hoàn tác cũng đổi số liệu.
      queryClient.invalidateQueries({ queryKey: ["loans"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      
      toast.success(response.message || "Hoàn tác thanh toán thành công!")
    },
    onError: (error: unknown) => {
      console.error('❌ useRollbackPaymentMutation - onError:', error)
      handleApiError(error, "Có lỗi xảy ra khi hoàn tác thanh toán")
    },
  })
}

/**
 * Hook xem trước ảnh hưởng của việc hoàn tác phiếu thu.
 * Trả về danh sách hóa đơn/công nợ sẽ đổi, cảnh báo và lý do bị chặn.
 */
export const useRollbackPreviewQuery = (paymentId: number | null) => {
  return useQuery({
    queryKey: paymentKeys.rollbackPreview(paymentId || 0),
    queryFn: async () => {
      const response = await api.get<PaymentRollbackPreview>(
        `/payments/${paymentId}/rollback-preview`
      )
      return response
    },
    enabled: !!paymentId,
    staleTime: 0,
    retry: false,
  })
}

/**
 * Hook tra cứu lịch sử hoàn tác phiếu thu (đối soát).
 */
export const usePaymentRollbackHistoryQuery = (params?: Record<string, unknown>, enabled = true) => {
  return useQuery({
    queryKey: paymentKeys.rollbackHistory(params),
    queryFn: async () => {
      const response = await api.get<{
        data: PaymentRollbackHistoryItem[]
        total: number
        page: number
        limit: number
      }>("/payments/rollback-history", params)
      return response
    },
    enabled,
    staleTime: 0,
  })
}
