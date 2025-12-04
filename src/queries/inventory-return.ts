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

// Lấy danh sách phiếu trả hàng
export const useReturnsQuery = () => {
  return useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      // apiClient trả về data đã unwrap (response.data.data)
      const data = await apiClient.get<ReturnApiResponse[]>('/inventory/returns')
      return data.map(mapApiResponseToReturn) as InventoryReturn[]
    },
  })
}

// Lấy chi tiết phiếu trả hàng
export const useReturnQuery = (id: number) => {
  return useQuery({
    queryKey: ['return', id],
    queryFn: async () => {
      const data = await apiClient.get<ReturnApiResponse>(`/inventory/return/${id}`)
      return mapApiResponseToReturn(data) as InventoryReturn
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
      const response = await apiClient.postRaw<ReturnApiResponse>('/inventory/return', data)
      return response
    },
    onSuccess: () => {
      invalidateResourceQueries(queryClient, 'returns', { exact: false })
      message.success('Tạo phiếu trả hàng thành công!')
    },
    onError: () => {
      message.error('Tạo phiếu trả hàng thất bại!')
    },
  })
}

// Duyệt phiếu trả hàng
export const useApproveReturnMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.postRaw<ReturnApiResponse>(`/inventory/return/${id}/approve`)
      return response
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['return', id] })
      invalidateResourceQueries(queryClient, 'returns', { exact: false })
      message.success('Duyệt phiếu trả hàng thành công!')
    },
    onError: () => {
      message.error('Duyệt phiếu trả hàng thất bại!')
    },
  })
}

// Hoàn thành phiếu trả hàng (xuất kho)
export const useCompleteReturnMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.postRaw<ReturnApiResponse>(`/inventory/return/${id}/complete`)
      return response
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['return', id] })
      invalidateResourceQueries(queryClient, 'returns', { exact: false })
      // Invalidate inventory vì tồn kho đã thay đổi
      invalidateResourceQueries(queryClient, 'products', { exact: false })
      message.success('Hoàn thành phiếu trả hàng! Tồn kho đã được cập nhật.')
    },
    onError: () => {
      message.error('Hoàn thành phiếu trả hàng thất bại!')
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
      invalidateResourceQueries(queryClient, 'returns', { exact: false })
      message.success('Hủy phiếu trả hàng thành công!')
    },
    onError: () => {
      message.error('Hủy phiếu trả hàng thất bại!')
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
      invalidateResourceQueries(queryClient, 'returns', { exact: false })
      message.success('Xóa phiếu trả hàng thành công!')
    },
    onError: () => {
      message.error('Xóa phiếu trả hàng thất bại!')
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
      queryClient.invalidateQueries({
        queryKey: ['return-images', variables.returnId],
      })
      message.success('Gắn ảnh vào phiếu thành công!')
    },
    onError: (error: Error) => {
      message.error(`Lỗi khi gắn ảnh: ${error.message}`)
    },
  })
}

/**
 * Hook lấy danh sách ảnh của phiếu trả hàng
 */
export const useReturnImagesQuery = (returnId: number) => {
  return useQuery({
    queryKey: ['return-images', returnId],
    queryFn: async () => {
      const response = await apiClient.get<{
        id: number
        url: string
        name: string
        type: string
        size: number
        created_at: string
      }[]>(`/inventory/return/${returnId}/images`)
      return response
    },
    enabled: !!returnId,
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
      queryClient.invalidateQueries({
        queryKey: ['return-images', variables.returnId],
      })
      message.success('Xóa ảnh thành công!')
    },
    onError: (error: Error) => {
      message.error(`Lỗi khi xóa ảnh: ${error.message}`)
    },
  })
}
