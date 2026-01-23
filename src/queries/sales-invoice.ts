import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { SalesInvoice, CreateSalesInvoiceDto, AddPaymentDto } from "@/models/sales-invoice"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"
import { deliveryLogKeys } from "./delivery-logs"

import { mapSearchResponse } from "@/utils/api-response-mapper"

// ========== QUERY KEYS ==========
export const salesInvoiceKeys = {
  all: ["sales-invoices"] as const,
  lists: () => [...salesInvoiceKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...salesInvoiceKeys.lists(), params] as const,
  details: () => [...salesInvoiceKeys.all, "detail"] as const,
  detail: (id: number) => [...salesInvoiceKeys.details(), id] as const,
  latestByCustomer: (customerId: number) => 
    [...salesInvoiceKeys.all, "latest-by-customer", customerId] as const,
} as const

// ========== SALES INVOICE HOOKS ==========

/**
 * Hook lấy danh sách hóa đơn (POST /sales/invoices/search)
 */
export const useSalesInvoicesQuery = (params?: Record<string, unknown>) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 10
  const status = params?.status as string | undefined
  const paymentStatus = params?.payment_status as string | undefined
  const riceCropId = params?.rice_crop_id as string | number | undefined

  return useQuery({
    queryKey: salesInvoiceKeys.list(params),
    queryFn: async () => {
      // Build payload với flat params (không dùng filters array nữa)
      const payload: any = {
        page,
        limit,
      }

      // Thêm các flat params
      if (status) payload.status = status
      if (paymentStatus) payload.payment_status = paymentStatus
      if (riceCropId) payload.rice_crop_id = riceCropId
      if (params?.customer_id) payload.customer_id = params.customer_id
      if (params?.keyword) payload.keyword = params.keyword
      if (params?.search) payload.keyword = params.search 
      
      // Thêm các filter từ FilterHeader
      if (params?.code) payload.code = params.code
      if (params?.customer_name) payload.customer_name = params.customer_name
      if (params?.customer_phone) payload.customer_phone = params.customer_phone
      if (params?.season_id) payload.season_id = params.season_id
      
      // Date range filter
      if (params?.start_date) payload.sale_date_start = params.start_date
      if (params?.end_date) payload.sale_date_end = params.end_date
      if (params?.sale_date_start) payload.sale_date_start = params.sale_date_start
      if (params?.sale_date_end) payload.sale_date_end = params.sale_date_end

      // Sort
      if (params?.sort_by) {
        const field = String(params.sort_by)
        const dir = String(params.sort_direction || 'DESC')
        payload.sort = `${field}:${dir}`
      }

      const response = await api.postRaw<{
        success: boolean
        data: SalesInvoice[]
        pagination: {
          total: number
          totalPages: number | null
        }
      }>('/sales/invoices/search', payload)

      return mapSearchResponse(response, page, limit)
    },
    refetchOnMount: true,
    staleTime: 0,
  })
}

/**
 * Hook lấy hóa đơn theo ID
 */
export const useSalesInvoiceQuery = (id: number) => {
  return useQuery({
    queryKey: salesInvoiceKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<any>(`/sales/invoice/${id}`)
      // Unwrap data if it's wrapped in { success: true, data: ... }
      return (response?.success && response?.data) ? response.data : response
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo hóa đơn mới
 */
export const useCreateSalesInvoiceMutation = () => {
  return useMutation({
    mutationFn: async (invoice: CreateSalesInvoiceDto) => {
      const response = await api.postRaw<SalesInvoice>("/sales/invoice", invoice as any)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deliveryLogKeys.lists() })
      toast.success("Tạo hóa đơn thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo hóa đơn")
    },
  })
}

/**
 * Hook thêm thanh toán vào hóa đơn
 */
export const useAddPaymentMutation = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AddPaymentDto }) => {
      const response = await api.patchRaw<any>(`/sales/invoice/${id}/add-payment`, data as any)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["merged-purchases"] })
      toast.success("Thanh toán thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi thanh toán")
    },
  })
}

/**
 * Hook cập nhật hóa đơn
 */
export const useUpdateSalesInvoiceMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      invoice,
    }: {
      id: number
      invoice: Partial<CreateSalesInvoiceDto>
    }) => {
      const response = await api.patchRaw<SalesInvoice>(`/sales/invoice/${id}`, invoice as any)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.lists() })
      toast.success("Cập nhật hóa đơn thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật hóa đơn")
    },
  })
}

/**
 * Hook xóa hóa đơn
 */
export const useDeleteSalesInvoiceMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/sales/invoice/${id}`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.lists() })
      toast.success("Xóa hóa đơn thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa hóa đơn")
    },
  })
}

/**
 * Hook lấy hóa đơn gần nhất của khách hàng
 */
export const useLatestInvoiceByCustomerQuery = (customerId: number | undefined) => {
  return useQuery({
    queryKey: customerId ? salesInvoiceKeys.latestByCustomer(customerId) : [],
    queryFn: async () => {
      if (!customerId) return null
      
      try {
        const response = await api.get<SalesInvoice>(`/sales/invoice/customer/${customerId}/latest`)
        return response
      } catch (error) {
        // Nếu không tìm thấy đơn hàng trước đó, trả về null thay vì throw error
        console.log(`No previous invoice found for customer ${customerId}`)
        return null
      }
    },
    enabled: !!customerId,
  })
}

/**
 * Hook lấy thống kê khách hàng trong mùa vụ (tổng tiền mua và tổng nợ)
 */
export const useCustomerSeasonStatsQuery = (customerId: number | undefined, seasonId: number | undefined) => {
  return useQuery({
    queryKey: [...salesInvoiceKeys.all, 'customer-season-stats', customerId, seasonId],
    queryFn: async () => {
      if (!customerId || !seasonId) {
        return { totalPurchase: 0, totalDebt: 0 }
      }

      const response = await api.postRaw<{
        success: boolean
        data: SalesInvoice[]
      }>('/sales/invoices/search', {
        customer_id: customerId,
        season_id: seasonId,
        limit: 1000, // Lấy tất cả
      })

      if (response.success && response.data) {
        const invoices = response.data

        // Tính tổng tiền mua hàng (final_amount)
        const totalPurchase = invoices.reduce((sum, inv) => {
          return sum + Number(inv.final_amount || 0)
        }, 0)

        // Tính tổng nợ (remaining_amount)
        const totalDebt = invoices.reduce((sum, inv) => {
          return sum + Number(inv.remaining_amount || 0)
        }, 0)

        return { totalPurchase, totalDebt }
      }

      return { totalPurchase: 0, totalDebt: 0 }
    },
    enabled: !!customerId && !!seasonId,
    staleTime: 30000, // Cache 30 giây
  })
}
