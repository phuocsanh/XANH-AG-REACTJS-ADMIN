import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { SalesInvoice, CreateSalesInvoiceDto, AddPaymentDto } from "@/models/sales-invoice"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"

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
  const riceCropFilter = params?.rice_crop_filter as string | undefined

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
      if (riceCropFilter) payload.rice_crop_filter = riceCropFilter
      if (params?.customer_id) payload.customer_id = params.customer_id
      if (params?.keyword) payload.keyword = params.keyword

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
      const response = await api.get<SalesInvoice>(`/sales/invoices/${id}`)
      return response
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
      const response = await api.patchRaw<SalesInvoice>(`/sales/invoices/${id}`, invoice as any)
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
      const response = await api.delete(`/sales/invoices/${id}`)
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
