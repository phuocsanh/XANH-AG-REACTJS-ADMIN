import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { Customer, CreateCustomerDto, UpdateCustomerDto, CustomerDebtor } from "@/models/customer"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"
import { invalidateResourceQueries } from "@/utils/query-helpers"

import { mapSearchResponse } from "@/utils/api-response-mapper"

// ========== QUERY KEYS ==========
export const customerKeys = {
  all: ["/customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: number) => [...customerKeys.details(), id] as const,
  invoices: (id: number) => [...customerKeys.all, "invoices", id] as const,
  debts: (id: number) => [...customerKeys.all, "debts", id] as const,
  search: (query: string) => [...customerKeys.all, "search", query] as const,
  debtorSearch: (query: string) => [...customerKeys.all, "debtorSearch", query] as const,
  debtors: (search?: string) => [...customerKeys.all, "debtors", search] as const,
} as const

// ========== CUSTOMER HOOKS ==========

/**
 * Hook lấy danh sách khách hàng (POST /customers/search)
 */
export const useCustomersQuery = (params?: Record<string, unknown>) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 10
  const search = params?.search as string | undefined

  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: async () => {
      const response = await api.postRaw<{
        success: boolean
        data: Customer[]
        pagination: {
          total: number
          totalPages: number | null
        }
      }>('/customers/search', {
        page,
        limit,
        ...params // Spread all params to support filtering (code, name, phone, etc.)
      })

      return mapSearchResponse(response, page, limit)
    },
    refetchOnMount: true,
    staleTime: 0,
  })
}

/**
 * Hook tìm kiếm khách hàng
 */
export const useCustomerSearchQuery = (search: string) => {
  return useQuery({
    queryKey: customerKeys.search(search),
    queryFn: async () => {
      const response = await api.postRaw<{
        success: boolean
        data: Customer[]
        pagination: any
      }>('/customers/search', {
        search,
        page: 1,
        limit: 20
      })
      
      // API search trả về { data: Customer[], ... }
      // Chúng ta cần trả về mảng Customer[] cho component Autocomplete
      return response.data || []
    },
    enabled: search.length >= 1, 
  })
}

/**
 * Hook tìm kiếm khách hàng đang nợ (API Mới)
 */
export const useCustomerDebtorsSearchQuery = (search: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: customerKeys.debtorSearch(search),
    queryFn: async () => {
      // Gọi API POST /customers/debtors
      const response = await api.postRaw<any>("/customers/debtors", { 
        search,
        page: 1,
        limit: 50 
      })
      
      // Kiểm tra cấu trúc response để lấy data chính xác
      let data: CustomerDebtor[] = [];
      if (Array.isArray(response)) data = response;
      else if (response && Array.isArray(response.data)) data = response.data;
      else if (response && response.data && Array.isArray(response.data.data)) data = response.data.data;
      
      return data;
    },
    enabled: options?.enabled,
  })
}

/**
 * Hook lấy khách hàng theo ID
 */
export const useCustomerQuery = (id: number) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Customer>(`/customers/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook lấy tổng nợ và số phiếu nợ của khách hàng
 */
export const useCustomerDebtSummaryQuery = (id: number) => {
  return useQuery({
    queryKey: [...customerKeys.detail(id), 'debt-summary'],
    queryFn: async () => {
      const response = await api.get<{
        customer_id: number
        total_debt: number
        debt_note_count: number
      }>(`/customers/${id}/debt-summary`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook lấy hóa đơn của khách hàng
 */
/**
 * Hook lấy hóa đơn của khách hàng (Cập nhật endpoint đúng)
 */
export const useCustomerInvoicesQuery = (id: number) => {
  return useQuery({
    queryKey: customerKeys.invoices(id),
    queryFn: async () => {
      // Gọi API search với POST, lọc theo customer_id
      const response = await api.postRaw<any>('/sales/invoices/search', { 
        customer_id: id,
        page: 1,
        limit: 100 // Lấy số lượng lớn để tính nợ
      })
      
      // Xử lý response để lấy danh sách items
      let items: any[] = [];
      
      // LOGIC MỚI: Check nếu response chính là Array (do interceptor trả về data.data)
      if (Array.isArray(response)) {
          items = response;
      } else if (response && response.data && Array.isArray(response.data.items)) {
        items = response.data.items;
      } else if (response && Array.isArray(response.data)) { 
          items = response.data;
      } else if (response && response.items && Array.isArray(response.items)) { 
          items = response.items;
      }

      // Filter client-side để chắc chắn chỉ lấy hóa đơn còn nợ
      return items.filter((inv: any) => (inv.remaining_amount || 0) > 0);
    },
    enabled: !!id,
  })
}

/**
 * Hook lấy công nợ của khách hàng (Cập nhật endpoint đúng)
 */
export const useCustomerDebtsQuery = (id: number) => {
  return useQuery({
    queryKey: customerKeys.debts(id),
    queryFn: async () => {
      // Gọi API search với POST, lọc theo customer_id
      const response = await api.postRaw<any>('/debt-notes/search', { 
        customer_id: id,
        page: 1,
        limit: 100
      })

      // Xử lý response
      let items: any[] = [];
      
      // LOGIC MỚI: Check nếu response chính là Array
      if (Array.isArray(response)) {
          items = response;
      } else if (response && response.data && Array.isArray(response.data.items)) {
        items = response.data.items;
      } else if (response && Array.isArray(response.data)) {
          items = response.data;
      } else if (response && response.items && Array.isArray(response.items)) {
          items = response.items;
      }
      
      // Filter client-side
      return items.filter((debt: any) => (debt.remaining_amount || 0) > 0);
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo khách hàng mới
 */
export const useCreateCustomerMutation = () => {
  return useMutation({
    mutationFn: async (customer: CreateCustomerDto) => {
      const response = await api.postRaw<Customer>("/customers", customer as any)
      return response
    },
    onSuccess: () => {
      invalidateResourceQueries("/customers")
      toast.success("Tạo khách hàng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo khách hàng")
    },
  })
}

/**
 * Hook cập nhật khách hàng
 */
export const useUpdateCustomerMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      customer,
    }: {
      id: number
      customer: UpdateCustomerDto
    }) => {
      const response = await api.patchRaw<Customer>(`/customers/${id}`, customer as any)
      return response
    },
    onSuccess: () => {
      invalidateResourceQueries("/customers")
      toast.success("Cập nhật khách hàng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật khách hàng")
    },
  })
}

/**
 * Hook xóa khách hàng
 */
export const useDeleteCustomerMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/customers/${id}`)
      return response
    },
    onSuccess: () => {
      invalidateResourceQueries("/customers")
      toast.success("Xóa khách hàng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa khách hàng")
    },
  })
}
