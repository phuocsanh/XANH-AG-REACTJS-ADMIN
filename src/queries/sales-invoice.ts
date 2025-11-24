import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { SalesInvoice, CreateSalesInvoiceDto, AddPaymentDto } from "@/models/sales-invoice"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"

// ========== QUERY KEYS ==========
export const salesInvoiceKeys = {
  all: ["sales-invoices"] as const,
  lists: () => [...salesInvoiceKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...salesInvoiceKeys.lists(), params] as const,
  details: () => [...salesInvoiceKeys.all, "detail"] as const,
  detail: (id: number) => [...salesInvoiceKeys.details(), id] as const,
} as const

// ========== SALES INVOICE HOOKS ==========

/**
 * Hook lấy danh sách hóa đơn
 */
export const useSalesInvoicesQuery = (params?: Record<string, unknown>) => {
  return usePaginationQuery<SalesInvoice>("/sales/invoices", params)
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
