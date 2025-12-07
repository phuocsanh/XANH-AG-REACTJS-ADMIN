import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { invalidateResourceQueries } from "@/utils/query-helpers"
import { Payment, CreatePaymentDto, SettlePaymentDto, PaymentAllocation } from "@/models/payment"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"

// ========== QUERY KEYS ==========
export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...paymentKeys.lists(), params] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: number) => [...paymentKeys.details(), id] as const,
  allocations: (id: number) => [...paymentKeys.detail(id), "allocations"] as const,
} as const

// ========== PAYMENT HOOKS ==========

/**
 * Hook lấy danh sách thanh toán
 */
export const usePaymentsQuery = (params?: Record<string, unknown>) => {
  return usePaginationQuery<Payment>("/payments", params)
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
      invalidateResourceQueries("/payments")
      invalidateResourceQueries("/debt-notes")
      invalidateResourceQueries("/customers")
      // Invalidate customer search queries (key starts with "customers", not "/customers")
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Chốt sổ công nợ thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi chốt sổ")
    },
  })
}

/**
 * Hook xóa thanh toán
 */
export const useDeletePaymentMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/payments/${id}`)
      return response
    },
    onSuccess: () => {
      invalidateResourceQueries("/payments")
      toast.success("Xóa phiếu thu thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa phiếu thu")
    },
  })
}
