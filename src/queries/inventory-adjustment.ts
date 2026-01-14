// React Query hooks cho Phiếu Điều Chỉnh Kho (Adjustment)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import apiClient from '@/utils/api'
import {
  CreateAdjustmentRequest,
  InventoryAdjustment,
  AdjustmentApiResponse,
  mapApiResponseToAdjustment,
  getAdjustmentStatusText,
} from '@/models/inventory-adjustment.model'
import { invalidateResourceQueries } from '@/utils/query-helpers'
import { handleApiError } from '@/utils/error-handler'

// Lấy danh sách phiếu điều chỉnh
export const useAdjustmentsQuery = () => {
  return useQuery({
    queryKey: ['adjustments'],
    queryFn: async () => {
      // Đổi từ GET /inventory/adjustments sang POST /inventory/adjustments/search
      const response = await apiClient.postRaw<{
        data: AdjustmentApiResponse[]
        total: number
        page: number
        limit: number
      }>('/inventory/adjustments/search', {
        limit: 1000,
        offset: 0
      })
      return response.data.map(mapApiResponseToAdjustment) as InventoryAdjustment[]
    },
  })
}

// Lấy chi tiết phiếu điều chỉnh
export const useAdjustmentQuery = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['adjustment', id],
    queryFn: async () => {
      const response = await apiClient.get<InventoryAdjustment>(`/inventory/adjustments/${id}`)
      const adjustmentData = response
      
      // Map status sang tiếng Việt nếu cần, nhưng GIỮ NGUYÊN images
      return {
        ...adjustmentData,
        status: getAdjustmentStatusText(adjustmentData.status),
      } as InventoryAdjustment
    },
    enabled: options?.enabled !== false && !!id,
  })
}

// Tạo phiếu điều chỉnh
export const useCreateAdjustmentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateAdjustmentRequest) => {
      const response = await apiClient.postRaw<InventoryAdjustment>('/inventory/adjustments', data as any)
      return response
    },
    onSuccess: async () => {
      // Refetch để refresh danh sách ngay lập tức
      await queryClient.refetchQueries({ queryKey: ['adjustments'] })
      // Invalidate products vì tồn kho có thể đã thay đổi (nếu tạo với trạng thái approved)
      invalidateResourceQueries('products')
      message.success('Tạo phiếu điều chỉnh thành công!')
    },
    onError: (error) => {
      handleApiError(error, 'Tạo phiếu điều chỉnh thất bại!')
    },
  })
}

// Cập nhật phiếu điều chỉnh
export const useUpdateAdjustmentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CreateAdjustmentRequest }) => {
      // Revert lại PUT theo chuẩn RESTful
      const response = await apiClient.putRaw<InventoryAdjustment>(`/inventory/adjustments/${id}`, data as any)
      return response
    },
    onSuccess: async (_, { id }) => {
      await queryClient.refetchQueries({ queryKey: ['adjustments'] })
      await queryClient.refetchQueries({ queryKey: ['adjustment', id] })
      message.success('Cập nhật phiếu điều chỉnh thành công!')
    },
    onError: (error) => {
      handleApiError(error, 'Cập nhật phiếu điều chỉnh thất bại!')
    },
  })
}

// Duyệt phiếu điều chỉnh (và tự động tác động kho)
export const useApproveAdjustmentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.postRaw<InventoryAdjustment>(`/inventory/adjustments/${id}/approve`)
      return response
    },
    onSuccess: async (_, id) => {
      await queryClient.refetchQueries({ queryKey: ['adjustments'] })
      await queryClient.refetchQueries({ queryKey: ['adjustment', id] })
      // Invalidate inventory vì tồn kho đã thay đổi
      invalidateResourceQueries('products')
      message.success('Duyệt phiếu điều chỉnh thành công! Tồn kho đã được cập nhật.')
    },
    onError: (error) => {
      handleApiError(error, 'Duyệt phiếu điều chỉnh thất bại!')
    },
  })
}

// Hủy phiếu điều chỉnh
export const useCancelAdjustmentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiClient.postRaw<InventoryAdjustment>(`/inventory/adjustments/${id}/cancel`, { reason })
      return response
    },
    onSuccess: async (_, { id }) => {
      await queryClient.refetchQueries({ queryKey: ['adjustments'] })
      await queryClient.refetchQueries({ queryKey: ['adjustment', id] })
      message.success('Hủy phiếu điều chỉnh thành công!')
    },
    onError: (error) => {
      handleApiError(error, 'Hủy phiếu điều chỉnh thất bại!')
    },
  })
}

// Xóa phiếu điều chỉnh (chỉ draft/cancelled)
export const useDeleteAdjustmentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete<any>(`/inventory/adjustments/${id}`)
      return response
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['adjustments'] })
      message.success('Xóa phiếu điều chỉnh thành công!')
    },
    onError: (error) => {
      handleApiError(error, 'Xóa phiếu điều chỉnh thất bại!')
    },
  })
}

// ========== UPLOAD IMAGE HOOKS FOR ADJUSTMENT ==========

/**
 * Hook gắn ảnh vào phiếu điều chỉnh
 */
export const useAttachImageToAdjustmentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      adjustmentId,
      fileId,
      fieldName,
    }: {
      adjustmentId: number
      fileId: number
      fieldName?: string
    }) => {
      const response = await apiClient.postRaw(
        `/inventory/adjustments/${adjustmentId}/attach-image`,
        { fileId, fieldName }
      )
      return response
    },
    onSuccess: async (_, variables) => {
      // Refresh cả danh sách ảnh riêng lẻ (nếu còn dùng) và chi tiết phiếu
      await queryClient.refetchQueries({ queryKey: ['adjustment-images', variables.adjustmentId] })
      await queryClient.refetchQueries({ queryKey: ['adjustment', variables.adjustmentId] })
      message.success('Gắn ảnh vào phiếu thành công!')
    },
    onError: (error: Error) => {
      message.error(`Lỗi khi gắn ảnh: ${error.message}`)
    },
  })
}

/**
 * Hook lấy danh sách ảnh của phiếu điều chỉnh
 */
export const useAdjustmentImagesQuery = (adjustmentId: number) => {
  return useQuery({
    queryKey: ['adjustment-images', adjustmentId],
    queryFn: async () => {
      const response = await apiClient.get<{
        id: number
        url: string
        name: string
        type: string
        size: number
        created_at: string
      }[]>(`/inventory/adjustments/${adjustmentId}/images`)
      return response
    },
    enabled: !!adjustmentId,
  })
}

/**
 * Hook xóa ảnh khỏi phiếu điều chỉnh
 */
export const useDeleteAdjustmentImageMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      adjustmentId,
      fileId,
    }: {
      adjustmentId: number
      fileId: number
    }) => {
      const response = await apiClient.delete(
        `/inventory/adjustments/${adjustmentId}/image/${fileId}`
      )
      return response
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({ queryKey: ['adjustment-images', variables.adjustmentId] })
      await queryClient.refetchQueries({ queryKey: ['adjustment', variables.adjustmentId] })
      message.success('Xóa ảnh thành công!')
    },
    onError: (error: Error) => {
      message.error(`Lỗi khi xóa ảnh: ${error.message}`)
    },
  })
}
