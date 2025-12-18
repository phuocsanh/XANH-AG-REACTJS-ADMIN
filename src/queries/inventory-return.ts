// React Query hooks cho Phiếu Xuất Trả Hàng (Return)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import apiClient from '@/utils/api'
import {
  CreateReturnRequest,
  InventoryReturn,
  ReturnApiResponse,
  mapApiResponseToReturn,
} from '@/models/inventory-return.model'
import { invalidateResourceQueries } from '@/utils/query-helpers'
import { handleApiError } from '@/utils/error-handler'

// Lấy danh sách phiếu trả hàng
export const useReturnsQuery = () => {
  return useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      // Gọi đúng API tìm kiếm phiếu trả hàng nhập
      const response = await apiClient.postRaw<{
        data: ReturnApiResponse[]
        total: number
        page: number
        limit: number
      }>('/inventory/returns/search', {
        limit: 1000, // Lấy tất cả
        offset: 0
      })
      // Backend trả về 'data' không phải 'items'
      return response.data.map(mapApiResponseToReturn) as InventoryReturn[]
    },
  })
}

// Lấy chi tiết phiếu trả hàng
export const useReturnQuery = (id: number) => {
  return useQuery({
    queryKey: ['return', id],
    queryFn: async () => {
      const response = await apiClient.get<any>(`/inventory/return/${id}`)
      // Unwrap data từ response wrapper { success, data, meta }
      const returnData = response.data || response
      return mapApiResponseToReturn(returnData) as InventoryReturn
    },
    enabled: !!id,
  })
}

// Tạo phiếu trả hàng
export const useCreateReturnMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateReturnRequest) => {
      // Sử dụng postRaw cho JSON body
      const response = await apiClient.postRaw<ReturnApiResponse>('/inventory/return', data as any)
      return response
    },
    onSuccess: () => {
      invalidateResourceQueries('returns')
      message.success('Tạo phiếu trả hàng thành công!')
    },
    onError: (error) => {
      handleApiError(error, 'Tạo phiếu trả hàng thất bại!')
    },
  })
}

// Cập nhật phiếu trả hàng
export const useUpdateReturnMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateReturnRequest> }) => {
      const response = await apiClient.patchRaw<ReturnApiResponse>(`/inventory/return/${id}`, data)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['return', variables.id] })
      invalidateResourceQueries('returns')
      message.success('Cập nhật phiếu trả hàng thành công!')
    },
    onError: (error) => {
      handleApiError(error, 'Cập nhật phiếu trả hàng thất bại!')
    },
  })
}

// Duyệt phiếu trả hàng (và tự động trừ kho)
export const useApproveReturnMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.postRaw<ReturnApiResponse>(`/inventory/return/${id}/approve`)
      return response
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['return', id] })
      invalidateResourceQueries('returns')
      // Invalidate inventory vì tồn kho đã thay đổi
      invalidateResourceQueries('products')
      message.success('Duyệt phiếu trả hàng thành công! Tồn kho đã được cập nhật.')
    },
    onError: (error) => {
      handleApiError(error, 'Duyệt phiếu trả hàng thất bại!')
    },
  })
}

// Hủy phiếu trả hàng
export const useCancelReturnMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiClient.postRaw<ReturnApiResponse>(`/inventory/return/${id}/cancel`, { reason })
      return response
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['return', id] })
      invalidateResourceQueries('returns')
      message.success('Hủy phiếu trả hàng thành công!')
    },
    onError: (error) => {
      handleApiError(error, 'Hủy phiếu trả hàng thất bại!')
    },
  })
}

// Xóa phiếu trả hàng (chỉ draft/cancelled)
export const useDeleteReturnMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete<boolean>(`/inventory/return/${id}`)
      return response
    },
    onSuccess: () => {
      invalidateResourceQueries('returns')
      message.success('Xóa phiếu trả hàng thành công!')
    },
    onError: (error) => {
      handleApiError(error, 'Xóa phiếu trả hàng thất bại!')
    },
  })
}

// ========== UPLOAD IMAGE HOOKS FOR RETURN ==========

/**
 * Hook gắn ảnh vào phiếu trả hàng
 */
export const useAttachImageToReturnMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      returnId,
      fileId,
      fieldName,
    }: {
      returnId: number
      fileId: number
      fieldName?: string
    }) => {
      const response = await apiClient.postRaw(
        `/inventory/return/${returnId}/upload-image`,
        { fileId, fieldName }
      )
      return response
    },
    onSuccess: (_, variables) => {
      // Invalidate return query để reload images
      queryClient.invalidateQueries({
        queryKey: ['return', variables.returnId],
      })
      message.success('Gắn ảnh vào phiếu thành công!')
    },
    onError: (error: Error) => {
      message.error(`Lỗi khi gắn ảnh: ${error.message}`)
    },
  })
}

/**
 * Hook xóa ảnh khỏi phiếu trả hàng
 */
export const useDeleteReturnImageMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      returnId,
      fileId,
    }: {
      returnId: number
      fileId: number
    }) => {
      const response = await apiClient.delete(
        `/inventory/return/${returnId}/image/${fileId}`
      )
      return response
    },
    onSuccess: (_, variables) => {
      // Invalidate return query để reload images
      queryClient.invalidateQueries({
        queryKey: ['return', variables.returnId],
      })
      message.success('Xóa ảnh thành công!')
    },
    onError: (error: Error) => {
      message.error(`Lỗi khi xóa ảnh: ${error.message}`)
    },
  })
}
