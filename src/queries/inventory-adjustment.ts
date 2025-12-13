// React Query hooks cho Phiếu Điều Chỉnh Kho (Adjustment)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import apiClient from '@/utils/api'
import {
  CreateAdjustmentRequest,
  InventoryAdjustment,
  AdjustmentApiResponse,
  mapApiResponseToAdjustment,
} from '@/models/inventory-adjustment.model'
import { invalidateResourceQueries } from '@/utils/query-helpers'

// Lấy danh sách phiếu điều chỉnh
export const useAdjustmentsQuery = () => {
  return useQuery({
    queryKey: ['adjustments'],
    queryFn: async () => {
      console.log('🔍 [DEBUG] useAdjustmentsQuery called at:', new Date().toISOString())
      console.trace('Call stack:')
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
      console.log('✅ [DEBUG] useAdjustmentsQuery response:', response)
      return response.data.map(mapApiResponseToAdjustment) as InventoryAdjustment[]
    },
  })
}

// Lấy chi tiết phiếu điều chỉnh
export const useAdjustmentQuery = (id: number) => {
  return useQuery({
    queryKey: ['adjustment', id],
    queryFn: async () => {
      const data = await apiClient.get<AdjustmentApiResponse>(`/inventory/adjustment/${id}`)
      return mapApiResponseToAdjustment(data) as InventoryAdjustment
    },
    enabled: !!id,
  })
}

// Tạo phiếu điều chỉnh
export const useCreateAdjustmentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateAdjustmentRequest) => {
      const response = await apiClient.postRaw<AdjustmentApiResponse>('/inventory/adjustment', data as any)
      return response
    },
    onSuccess: () => {
      invalidateResourceQueries('adjustments')
      message.success('Tạo phiếu điều chỉnh thành công!')
    },
    onError: () => {
      message.error('Tạo phiếu điều chỉnh thất bại!')
    },
  })
}

// Duyệt phiếu điều chỉnh
export const useApproveAdjustmentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.postRaw<AdjustmentApiResponse>(`/inventory/adjustment/${id}/approve`)
      return response
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adjustment', id] })
      invalidateResourceQueries('adjustments')
      message.success('Duyệt phiếu điều chỉnh thành công!')
    },
    onError: () => {
      message.error('Duyệt phiếu điều chỉnh thất bại!')
    },
  })
}

// Hoàn thành phiếu điều chỉnh (cập nhật kho)
export const useCompleteAdjustmentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.postRaw<AdjustmentApiResponse>(`/inventory/adjustment/${id}/complete`)
      return response
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adjustment', id] })
      invalidateResourceQueries('adjustments')
      // Invalidate inventory vì tồn kho đã thay đổi
      invalidateResourceQueries('products')
      message.success('Hoàn thành phiếu điều chỉnh! Tồn kho đã được cập nhật.')
    },
    onError: () => {
      message.error('Hoàn thành phiếu điều chỉnh thất bại!')
    },
  })
}

// Hủy phiếu điều chỉnh
export const useCancelAdjustmentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiClient.postRaw<AdjustmentApiResponse>(`/inventory/adjustment/${id}/cancel`, { reason })
      return response
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['adjustment', id] })
      invalidateResourceQueries('adjustments')
      message.success('Hủy phiếu điều chỉnh thành công!')
    },
    onError: () => {
      message.error('Hủy phiếu điều chỉnh thất bại!')
    },
  })
}

// Xóa phiếu điều chỉnh (chỉ draft/cancelled)
export const useDeleteAdjustmentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete<boolean>(`/inventory/adjustment/${id}`)
      return response
    },
    onSuccess: () => {
      invalidateResourceQueries('adjustments')
      message.success('Xóa phiếu điều chỉnh thành công!')
    },
    onError: () => {
      message.error('Xóa phiếu điều chỉnh thất bại!')
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
        `/inventory/adjustment/${adjustmentId}/upload-image`,
        { fileId, fieldName }
      )
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['adjustment-images', variables.adjustmentId],
      })
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
      }[]>(`/inventory/adjustment/${adjustmentId}/images`)
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
        `/inventory/adjustment/${adjustmentId}/image/${fileId}`
      )
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['adjustment-images', variables.adjustmentId],
      })
      message.success('Xóa ảnh thành công!')
    },
    onError: (error: Error) => {
      message.error(`Lỗi khi xóa ảnh: ${error.message}`)
    },
  })
}
