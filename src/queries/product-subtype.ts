import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import {
  ProductSubtype,
  CreateProductSubtypeDto,
  UpdateProductSubtypeDto,
} from "@/models/product-subtype.model"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"
import { invalidateResourceQueries } from "@/utils/query-helpers"

// Query keys cho product subtype
export const productSubtypeKeys = {
  all: ["productSubtypes"] as const,
  lists: () => [...productSubtypeKeys.all, "list"] as const,
  list: (filters: string) =>
    [...productSubtypeKeys.lists(), { filters }] as const,
  details: () => [...productSubtypeKeys.all, "detail"] as const,
  detail: (id: number) => [...productSubtypeKeys.details(), id] as const,
}

/**
 * Hook lấy danh sách tất cả loại phụ sản phẩm
 */
export const useProductSubtypesQuery = (params?: Record<string, unknown>) => {
  return usePaginationQuery<ProductSubtype>("/product-subtype", params)
}

/**
 * Hook lấy thông tin loại phụ sản phẩm theo ID
 */
export const useProductSubtypeQuery = (id: number) => {
  return useQuery({
    queryKey: productSubtypeKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ProductSubtype>(`/product-subtype/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo mới loại phụ sản phẩm
 */
export const useCreateProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: async (subtypeData: CreateProductSubtypeDto) => {
      const response = await api.postRaw<ProductSubtype>(
        "/product-subtype",
        subtypeData
      )
      return response
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách product subtypes
      invalidateResourceQueries("/product-subtype")
      toast.success("Tạo loại phụ sản phẩm thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo loại phụ sản phẩm")
    },
  })
}

/**
 * Hook cập nhật loại phụ sản phẩm
 */
export const useUpdateProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      subtypeData,
    }: {
      id: number
      subtypeData: UpdateProductSubtypeDto
    }) => {
      const response = await api.putRaw<ProductSubtype>(
        `/product-subtype/${id}`,
        subtypeData
      )
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      invalidateResourceQueries("/product-subtype")
      queryClient.invalidateQueries({
        queryKey: productSubtypeKeys.detail(variables.id),
      })
      toast.success("Cập nhật loại phụ sản phẩm thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật loại phụ sản phẩm")
    },
  })
}

/**
 * Hook kích hoạt loại phụ sản phẩm
 */
export const useActivateProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.putRaw<ProductSubtype>(
        `/product-subtype/${id}/activate`
      )
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      invalidateResourceQueries("/product-subtype")
      queryClient.invalidateQueries({
        queryKey: productSubtypeKeys.detail(variables),
      })
      toast.success("Kích hoạt loại phụ sản phẩm thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi kích hoạt loại phụ sản phẩm")
    },
  })
}

/**
 * Hook vô hiệu hóa loại phụ sản phẩm
 */
export const useDeactivateProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.putRaw<ProductSubtype>(
        `/product-subtype/${id}/deactivate`
      )
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      invalidateResourceQueries("/product-subtype")
      queryClient.invalidateQueries({
        queryKey: productSubtypeKeys.detail(variables),
      })
      toast.success("Vô hiệu hóa loại phụ sản phẩm thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi vô hiệu hóa loại phụ sản phẩm")
    },
  })
}

/**
 * Hook lưu trữ loại phụ sản phẩm
 */
export const useArchiveProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.putRaw<ProductSubtype>(
        `/product-subtype/${id}/archive`
      )
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      invalidateResourceQueries("/product-subtype")
      queryClient.invalidateQueries({
        queryKey: productSubtypeKeys.detail(variables),
      })
      toast.success("Lưu trữ loại phụ sản phẩm thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi lưu trữ loại phụ sản phẩm")
    },
  })
}

/**
 * Hook khôi phục loại phụ sản phẩm từ lưu trữ
 */
export const useRestoreProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.putRaw<ProductSubtype>(
        `/product-subtype/${id}/restore`
      )
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      invalidateResourceQueries("/product-subtype")
      queryClient.invalidateQueries({
        queryKey: productSubtypeKeys.detail(variables),
      })
      toast.success("Khôi phục loại phụ sản phẩm thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi khôi phục loại phụ sản phẩm")
    },
  })
}

/**
 * Hook xóa mềm loại phụ sản phẩm
 */
export const useDeleteProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<void>(`/product-subtype/${id}`)
      return response
    },
    onSuccess: () => {
      // Invalidate danh sách product subtypes
      invalidateResourceQueries("/product-subtype")
      toast.success("Xóa loại phụ sản phẩm thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa loại phụ sản phẩm")
    },
  })
}

/**
 * Hook xóa vĩnh viễn loại phụ sản phẩm
 */
export const usePermanentDeleteProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<void>(
        `/product-subtype/${id}/permanent`
      )
      return response
    },
    onSuccess: () => {
      // Invalidate danh sách product subtypes
      invalidateResourceQueries("/product-subtype")
      toast.success("Xóa vĩnh viễn loại phụ sản phẩm thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa vĩnh viễn loại phụ sản phẩm")
    },
  })
}

/**
 * Hook lấy danh sách loại phụ sản phẩm đã bị xóa
 */
export const useDeletedProductSubtypesQuery = () => {
  return useQuery({
    queryKey: [...productSubtypeKeys.lists(), "deleted"],
    queryFn: async () => {
      const response = await api.get<ProductSubtype[]>(
        "/product-subtype/deleted"
      )
      return response
    },
  })
}
