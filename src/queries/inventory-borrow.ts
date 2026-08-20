import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { message } from "antd"
import apiClient from "@/utils/api"
import {
  CreateInventoryBorrowRequest,
  InventoryBorrow,
  InventoryBorrowStatus,
} from "@/models/inventory-borrow.model"
import { invalidateResourceQueries } from "@/utils/query-helpers"
import { handleApiError } from "@/utils/error-handler"

export const inventoryBorrowKeys = {
  all: ["inventory-borrows"] as const,
  list: (params?: Record<string, unknown>) => [...inventoryBorrowKeys.all, "list", params] as const,
  detail: (id: number) => [...inventoryBorrowKeys.all, "detail", id] as const,
}

export const useInventoryBorrowsQuery = (params?: {
  page?: number
  limit?: number
  keyword?: string
  status?: InventoryBorrowStatus
}) => {
  return useQuery({
    queryKey: inventoryBorrowKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.postRaw<{
        data: InventoryBorrow[]
        total: number
        page: number
        limit: number
      }>("/inventory/borrows/search", {
        page: params?.page || 1,
        limit: params?.limit || 100,
        ...(params?.keyword ? { keyword: params.keyword } : {}),
        ...(params?.status ? { status: params.status } : {}),
      })
      return response
    },
  })
}

export const useInventoryBorrowQuery = (id: number) => {
  return useQuery({
    queryKey: inventoryBorrowKeys.detail(id),
    queryFn: () => apiClient.get<InventoryBorrow>(`/inventory/borrows/${id}`),
    enabled: !!id,
  })
}

export const useCreateInventoryBorrowMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInventoryBorrowRequest) =>
      apiClient.postRaw<InventoryBorrow>("/inventory/borrows", data as any),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryBorrowKeys.all })
      invalidateResourceQueries("products")
      message.success("Tạo phiếu cho mượn thành công!")
    },
    onError: (error) => {
      handleApiError(error, "Tạo phiếu cho mượn thất bại!")
    },
  })
}

export const useApproveInventoryBorrowMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.postRaw<InventoryBorrow>(`/inventory/borrows/${id}/approve`),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: inventoryBorrowKeys.all })
      await queryClient.invalidateQueries({ queryKey: inventoryBorrowKeys.detail(id) })
      invalidateResourceQueries("products")
      message.success("Đã duyệt phiếu cho mượn và trừ tồn kho.")
    },
    onError: (error) => {
      handleApiError(error, "Duyệt phiếu cho mượn thất bại!")
    },
  })
}

export const useCancelInventoryBorrowMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.postRaw<InventoryBorrow>(`/inventory/borrows/${id}/cancel`),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: inventoryBorrowKeys.all })
      await queryClient.invalidateQueries({ queryKey: inventoryBorrowKeys.detail(id) })
      invalidateResourceQueries("products")
      message.success("Đã hủy phiếu cho mượn và hoàn tồn kho.")
    },
    onError: (error) => {
      handleApiError(error, "Hủy phiếu cho mượn thất bại!")
    },
  })
}

export const useReturnInventoryBorrowMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.postRaw<InventoryBorrow>(`/inventory/borrows/${id}/return`),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: inventoryBorrowKeys.all })
      await queryClient.invalidateQueries({ queryKey: inventoryBorrowKeys.detail(id) })
      invalidateResourceQueries("products")
      message.success("Đã ghi nhận trả hàng và hoàn tồn kho.")
    },
    onError: (error) => {
      handleApiError(error, "Trả hàng mượn thất bại!")
    },
  })
}

export const useDeleteInventoryBorrowMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<{ success: boolean }>(`/inventory/borrows/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryBorrowKeys.all })
      message.success("Đã xóa phiếu cho mượn.")
    },
    onError: (error) => {
      handleApiError(error, "Xóa phiếu cho mượn thất bại!")
    },
  })
}
