import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { Unit, CreateUnitDto, UpdateUnitDto } from "../models/unit.model"

// Query keys cho unit
export const unitKeys = {
  all: ["units"] as const,
  lists: () => [...unitKeys.all, "list"] as const,
  list: (filters: string) => [...unitKeys.lists(), { filters }] as const,
  details: () => [...unitKeys.all, "detail"] as const,
  detail: (id: number) => [...unitKeys.details(), id] as const,
}

/**
 * Hook lấy danh sách tất cả đơn vị tính
 */
export const useUnitsQuery = () => {
  return useQuery({
    queryKey: unitKeys.lists(),
    queryFn: async () => {
      const response = await api.get<Unit[]>("/units")
      return response
    },
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
      const response = await api.post<Unit>("/units", unitData)
      return response
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách units
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() })
      toast.success("Tạo đơn vị tính thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi tạo đơn vị tính:", error)
      toast.error("Có lỗi xảy ra khi tạo đơn vị tính")
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
      const response = await api.patch<Unit>(`/units/${id}`, unitData)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables.id) })
      toast.success("Cập nhật đơn vị tính thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi cập nhật đơn vị tính:", error)
      toast.error("Có lỗi xảy ra khi cập nhật đơn vị tính")
    },
  })
}

/**
 * Hook kích hoạt đơn vị tính
 */
export const useActivateUnitMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.patch<Unit>(`/units/${id}/activate`)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables) })
      toast.success("Kích hoạt đơn vị tính thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi kích hoạt đơn vị tính:", error)
      toast.error("Có lỗi xảy ra khi kích hoạt đơn vị tính")
    },
  })
}

/**
 * Hook vô hiệu hóa đơn vị tính
 */
export const useDeactivateUnitMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.patch<Unit>(`/units/${id}/deactivate`)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables) })
      toast.success("Vô hiệu hóa đơn vị tính thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi vô hiệu hóa đơn vị tính:", error)
      toast.error("Có lỗi xảy ra khi vô hiệu hóa đơn vị tính")
    },
  })
}

/**
 * Hook lưu trữ đơn vị tính
 */
export const useArchiveUnitMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.patch<Unit>(`/units/${id}/archive`)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables) })
      toast.success("Lưu trữ đơn vị tính thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi lưu trữ đơn vị tính:", error)
      toast.error("Có lỗi xảy ra khi lưu trữ đơn vị tính")
    },
  })
}

/**
 * Hook khôi phục đơn vị tính từ lưu trữ
 */
export const useRestoreUnitMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.patch<Unit>(`/units/${id}/restore`)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables) })
      toast.success("Khôi phục đơn vị tính thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khôi phục đơn vị tính:", error)
      toast.error("Có lỗi xảy ra khi khôi phục đơn vị tính")
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
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() })
      toast.success("Xóa đơn vị tính thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi xóa đơn vị tính:", error)
      toast.error("Có lỗi xảy ra khi xóa đơn vị tính")
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
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() })
      toast.success("Xóa vĩnh viễn đơn vị tính thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi xóa vĩnh viễn đơn vị tính:", error)
      toast.error("Có lỗi xảy ra khi xóa vĩnh viễn đơn vị tính")
    },
  })
}
