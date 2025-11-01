import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import {
  SalesInvoice,
  SalesInvoiceItem,
  CreateSalesInvoiceRequest,
  UpdateSalesInvoiceRequest,
  SalesStats,
  SalesReport,
  TopSellingProduct,
} from "@/models/sales.model"
import { handleApiError } from "@/utils/error-handler"

// ========== QUERY KEYS ==========
export const salesKeys = {
  all: ["sales"] as const,
  invoices: () => [...salesKeys.all, "invoices"] as const,
  invoicesList: () => [...salesKeys.invoices(), "list"] as const,
  invoice: (id: number) => [...salesKeys.invoices(), "detail", id] as const,
  invoiceByCode: (code: string) =>
    [...salesKeys.invoices(), "code", code] as const,
  invoiceItems: (invoiceId: number) =>
    [...salesKeys.invoices(), "items", invoiceId] as const,
  stats: () => [...salesKeys.all, "stats"] as const,
  reports: () => [...salesKeys.all, "reports"] as const,
  dailyReport: (startDate: string, endDate: string) =>
    [...salesKeys.reports(), "daily", startDate, endDate] as const,
  topSelling: (limit: number) =>
    [...salesKeys.reports(), "top-selling", limit] as const,
} as const

// ========== SALES INVOICE HOOKS ==========

/**
 * Hook tạo hóa đơn bán hàng mới
 */
export const useCreateInvoiceMutation = () => {
  return useMutation({
    mutationFn: async (invoiceData: CreateSalesInvoiceRequest) => {
      const response = await api.postRaw<SalesInvoice>(
        "/sales/invoices",
        invoiceData
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.invoices() })
      toast.success("Tạo hóa đơn bán hàng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo hóa đơn bán hàng")
    },
  })
}

/**
 * Hook lấy danh sách tất cả hóa đơn bán hàng
 */
export const useInvoicesQuery = () => {
  return useQuery({
    queryKey: salesKeys.invoicesList(),
    queryFn: async () => {
      const response = await api.get<SalesInvoice[]>("/sales/invoices")
      return response
    },
  })
}

/**
 * Hook lấy thông tin chi tiết hóa đơn bán hàng theo ID
 */
export const useInvoiceQuery = (id: number) => {
  return useQuery({
    queryKey: salesKeys.invoice(id),
    queryFn: async () => {
      const response = await api.get<SalesInvoice>(`/sales/invoices/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook lấy thông tin hóa đơn bán hàng theo mã
 */
export const useInvoiceByCodeQuery = (code: string) => {
  return useQuery({
    queryKey: salesKeys.invoiceByCode(code),
    queryFn: async () => {
      const response = await api.get<SalesInvoice>(
        `/sales/invoices/code/${code}`
      )
      return response
    },
    enabled: !!code,
  })
}

/**
 * Hook cập nhật thông tin hóa đơn bán hàng
 */
export const useUpdateInvoiceMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      invoiceData,
    }: {
      id: number
      invoiceData: UpdateSalesInvoiceRequest
    }) => {
      const response = await api.patchRaw<SalesInvoice>(
        `/sales/invoices/${id}`,
        invoiceData
      )
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(salesKeys.invoice(variables.id), data)
      queryClient.invalidateQueries({ queryKey: salesKeys.invoices() })
      toast.success("Cập nhật hóa đơn bán hàng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật hóa đơn bán hàng")
    },
  })
}

/**
 * Hook xóa hóa đơn bán hàng
 */
export const useDeleteInvoiceMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/sales/invoices/${id}`)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.removeQueries({ queryKey: salesKeys.invoice(variables) })
      queryClient.invalidateQueries({ queryKey: salesKeys.invoices() })
      toast.success("Xóa hóa đơn bán hàng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa hóa đơn bán hàng")
    },
  })
}

/**
 * Hook cập nhật trạng thái thanh toán của hóa đơn
 */
export const useUpdatePaymentStatusMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      paymentStatus,
    }: {
      id: number
      paymentStatus: "PENDING" | "PAID" | "CANCELLED"
    }) => {
      const response = await api.patchRaw<SalesInvoice>(
        `/sales/invoices/${id}/payment-status`,
        {
          paymentStatus,
        }
      )
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(salesKeys.invoice(variables.id), data)
      queryClient.invalidateQueries({ queryKey: salesKeys.invoices() })
      toast.success("Cập nhật trạng thái thanh toán thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật trạng thái thanh toán")
    },
  })
}

// ========== INVOICE ITEM HOOKS ==========

/**
 * Hook lấy danh sách chi tiết hóa đơn bán hàng
 */
export const useInvoiceItemsQuery = (invoiceId: number) => {
  return useQuery({
    queryKey: salesKeys.invoiceItems(invoiceId),
    queryFn: async () => {
      const response = await api.get<SalesInvoiceItem[]>(
        `/sales/invoices/${invoiceId}/items`
      )
      return response
    },
    enabled: !!invoiceId,
  })
}

/**
 * Hook cập nhật chi tiết hóa đơn bán hàng
 */
export const useUpdateInvoiceItemMutation = () => {
  return useMutation({
    mutationFn: async ({
      itemId,
      itemData,
    }: {
      itemId: number
      itemData: Partial<SalesInvoiceItem>
    }) => {
      const response = await api.patchRaw<SalesInvoiceItem>(
        `/sales/invoices/items/${itemId}`,
        itemData
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.invoices() })
      toast.success("Cập nhật chi tiết hóa đơn thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật chi tiết hóa đơn")
    },
  })
}

/**
 * Hook xóa chi tiết hóa đơn bán hàng
 */
export const useDeleteInvoiceItemMutation = () => {
  return useMutation({
    mutationFn: async (itemId: number) => {
      const response = await api.delete(`/sales/invoices/items/${itemId}`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.invoices() })
      toast.success("Xóa chi tiết hóa đơn thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa chi tiết hóa đơn")
    },
  })
}

// ========== REPORTING HOOKS ==========

/**
 * Hook lấy thống kê bán hàng tổng quan
 */
export const useSalesStatsQuery = () => {
  return useQuery({
    queryKey: salesKeys.stats(),
    queryFn: async () => {
      const response = await api.get<SalesStats>("/sales/reports/stats")
      return response
    },
  })
}

/**
 * Hook lấy báo cáo bán hàng theo ngày
 */
export const useDailySalesReportQuery = (
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: salesKeys.dailyReport(startDate, endDate),
    queryFn: async () => {
      const response = await api.get<SalesReport[]>("/sales/reports/daily", {
        params: {
          startDate,
          endDate,
        },
      })
      return response
    },
  })
}

/**
 * Hook lấy danh sách sản phẩm bán chạy
 */
export const useTopSellingProductsQuery = (limit: number = 10) => {
  return useQuery({
    queryKey: salesKeys.topSelling(limit),
    queryFn: async () => {
      const response = await api.get<TopSellingProduct[]>(
        "/sales/reports/top-selling",
        {
          params: {
            limit,
          },
        }
      )
      return response
    },
  })
}
