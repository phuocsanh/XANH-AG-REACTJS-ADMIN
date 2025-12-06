import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { Customer, CreateCustomerDto, UpdateCustomerDto, CustomerDebtor } from "@/models/customer"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"
import { invalidateResourceQueries } from "@/utils/query-helpers"

// ========== QUERY KEYS ==========
export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: number) => [...customerKeys.details(), id] as const,
  invoices: (id: number) => [...customerKeys.detail(id), "invoices"] as const,
  debts: (id: number) => [...customerKeys.detail(id), "debts"] as const,
  search: (query: string) => [...customerKeys.all, "search", query] as const,
  debtorSearch: (query: string) => [...customerKeys.all, "debtorSearch", query] as const,
} as const

// ========== CUSTOMER HOOKS ==========

/**
 * Hook lấy danh sách khách hàng
 */
export const useCustomersQuery = (params?: Record<string, unknown>) => {
  return usePaginationQuery<Customer>("/customers", params)
}

/**
 * Hook tìm kiếm khách hàng
 */
export const useCustomerSearchQuery = (search: string) => {
  return useQuery({
    queryKey: customerKeys.search(search),
    queryFn: async () => {
      const response = await api.get<Customer[]>("/customers", { search })
      return response
    },
    enabled: search.length >= 1, // Cho phép tìm ngay từ 1 ký tự hoặc rỗng để load default list nếu muốn
  })
}

/**
 * Hook tìm kiếm khách hàng đang nợ (API Mới)
 */
export const useCustomerDebtorsSearchQuery = (search: string) => {
  return useQuery({
    queryKey: customerKeys.debtorSearch(search),
    queryFn: async () => {
      // Gọi API /customers/debtors
      const response = await api.get<any>("/customers/debtors", { 
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
    // Luôn enabled để load danh sách nợ mặc định khi mở modal
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
 * Hook lấy hóa đơn của khách hàng
 */
/**
 * Hook lấy hóa đơn của khách hàng (Cập nhật endpoint đúng)
 */
export const useCustomerInvoicesQuery = (id: number) => {
  return useQuery({
    queryKey: customerKeys.invoices(id),
    queryFn: async () => {
      // Gọi API danh sách hóa đơn, lọc theo customer_id
      const response = await api.get<any>(`/sales/invoices`, { 
        customer_id: id,
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
      // Gọi API danh sách phiếu nợ, lọc theo customer_id
      const response = await api.get<any>(`/debt-notes`, { 
        customer_id: id,
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
