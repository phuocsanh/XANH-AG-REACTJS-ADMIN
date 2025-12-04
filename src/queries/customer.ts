import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { Customer, CreateCustomerDto, UpdateCustomerDto } from "@/models/customer"
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
    enabled: search.length >= 2,
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
export const useCustomerInvoicesQuery = (id: number) => {
  return useQuery({
    queryKey: customerKeys.invoices(id),
    queryFn: async () => {
      const response = await api.get<any>(`/customers/${id}/invoices`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook lấy công nợ của khách hàng
 */
export const useCustomerDebtsQuery = (id: number) => {
  return useQuery({
    queryKey: customerKeys.debts(id),
    queryFn: async () => {
      const response = await api.get<any>(`/customers/${id}/debts`)
      return response
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
