import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { Unit, CreateUnitDto, UpdateUnitDto } from "../models/unit.model"
import { handleApiError } from "@/utils/error-handler"

// Query keys cho unit
export const unitKeys = {
  all: ["units"] as const,
  lists: () => [...unitKeys.all, "list"] as const,
  list: (filters: string) => [...unitKeys.lists(), { filters }] as const,
  details: () => [...unitKeys.all, "detail"] as const,
  detail: (id: number) => [...unitKeys.details(), id] as const,
}

/**
 * Hook lấy danh sách đơn vị (POST /units/search)
 */
export const useUnitsQuery = () => {
  return useQuery({
    queryKey: unitKeys.all,
    queryFn: async () => {
      const response = await api.postRaw<{
        data: Unit[]
        total: number
        page: number
        limit: number
      }>('/units/search', {
        page: 1,
        limit: 1000, // Lấy tất cả units
      })

      return {
        data: {
          items: response.data,
          total: response.total,
          page: response.page,
          limit: response.limit,
          total_pages: Math.ceil(response.total / response.limit),
          has_next: response.page * response.limit < response.total,
          has_prev: response.page > 1,
        },
        status: 200,
        message: 'Success',
        success: true
      }
    },
    refetchOnMount: true,
    staleTime: 0,
  })
}

/**
 * Hook lấy thông tin đơn vị tính theo ID
 */
export const useUnitQuery = (id: number) => {
  return useQuery({
    queryKey: unitKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Unit>(`/units/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo mới đơn vị tính
 */
export const useCreateUnitMutation = () => {
  return useMutation({
    mutationFn: async (unitData: CreateUnitDto) => {
      const response = await api.postRaw<Unit>("/units", unitData)
      return response
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách units
      queryClient.invalidateQueries({
        queryKey: unitKeys.all,
      })
      toast.success("Tạo đơn vị tính thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error)
    },
  })
}

/**
 * Hook cập nhật đơn vị tính
 */
export const useUpdateUnitMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      unitData,
    }: {
      id: number
      unitData: UpdateUnitDto
    }) => {
      const response = await api.patchRaw<Unit>(`/units/${id}`, unitData)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({
        queryKey: unitKeys.all,
      })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables.id) })
      toast.success("Cập nhật đơn vị tính thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error)
    },
  })
}

/**
 * Hook kích hoạt đơn vị tính
 */
export const useActivateUnitMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.patchRaw<Unit>(`/units/${id}/activate`)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({
        queryKey: unitKeys.all,
      })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables) })
      toast.success("Kích hoạt đơn vị tính thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error)
    },
  })
}

/**
 * Hook vô hiệu hóa đơn vị tính
 */
export const useDeactivateUnitMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.patchRaw<Unit>(`/units/${id}/deactivate`)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({
        queryKey: unitKeys.all,
      })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables) })
      toast.success("Vô hiệu hóa đơn vị tính thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error)
    },
  })
}

/**
 * Hook lưu trữ đơn vị tính
 */
export const useArchiveUnitMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.patchRaw<Unit>(`/units/${id}/archive`)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({
        queryKey: unitKeys.all,
      })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables) })
      toast.success("Lưu trữ đơn vị tính thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error)
    },
  })
}

/**
 * Hook khôi phục đơn vị tính từ lưu trữ
 */
export const useRestoreUnitMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.patchRaw<Unit>(`/units/${id}/restore`)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({
        queryKey: unitKeys.all,
      })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables) })
      toast.success("Khôi phục đơn vị tính thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error)
    },
  })
}

/**
 * Hook xóa mềm đơn vị tính
 */
export const useDeleteUnitMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<void>(`/units/${id}/soft`)
      return response
    },
    onSuccess: () => {
      // Invalidate danh sách units
      queryClient.invalidateQueries({
        queryKey: unitKeys.all,
      })
      toast.success("Xóa đơn vị tính thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error)
    },
  })
}

/**
 * Hook xóa vĩnh viễn đơn vị tính
 */
export const usePermanentDeleteUnitMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<void>(`/units/${id}`)
      return response
    },
    onSuccess: () => {
      // Invalidate danh sách units
      queryClient.invalidateQueries({
        queryKey: unitKeys.all,
      })
      toast.success("Xóa vĩnh viễn đơn vị tính thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error)
    },
  })
}
