import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import {
  ProductType,
  ProductTypeRequest,
  ProductSubtypeRequest,
  ProductSubtypeMappingRequest,
  ProductSubtypesListResponse,
  ProductSubtypeResponse,
} from "@/models/product-type.model"

// Query keys cho product type
export const productTypeKeys = {
  all: ["productTypes"] as const,
  lists: () => [...productTypeKeys.all, "list"] as const,
  list: (filters: string) => [...productTypeKeys.lists(), { filters }] as const,
  details: () => [...productTypeKeys.all, "detail"] as const,
  detail: (id: number) => [...productTypeKeys.details(), id] as const,
  subtypes: {
    all: ["productSubtypes"] as const,
    lists: () => [...productTypeKeys.subtypes.all, "list"] as const,
    list: (typeId: number) =>
      [...productTypeKeys.subtypes.lists(), typeId] as const,
    details: () => [...productTypeKeys.subtypes.all, "detail"] as const,
    detail: (id: number) =>
      [...productTypeKeys.subtypes.details(), id] as const,
  },
}

/**
 * Hook lấy danh sách loại sản phẩm
 */
export const useProductTypesQuery = () => {
  return useQuery({
    queryKey: productTypeKeys.lists(),
    queryFn: async () => {
      const response = await api.get<{ items: ProductType[]; total: number }>(
        "/products/type"
      )
      return response
    },
  })
}

/**
 * Hook lấy danh sách loại sản phẩm (bổ sung từ service với endpoint khác)
 */
export const useAllProductTypesQuery = () => {
  return useQuery({
    queryKey: productTypeKeys.lists(),
    queryFn: async () => {
      const apiData = await api.get<ProductType[]>("/product-types")
      
      // API trả về array trực tiếp, cần wrap thành cấu trúc mong đợi
      return {
        items: apiData,
        total: apiData.length,
      }
    },
  })
}

/**
 * Hook lấy chi tiết loại sản phẩm theo ID
 */
export const useProductTypeQuery = (id: number) => {
  return useQuery({
    queryKey: productTypeKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ProductType>(`/products/type/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook lấy chi tiết loại sản phẩm theo ID (bổ sung từ service)
 */
export const useProductTypeByIdQuery = (id: number) => {
  return useQuery({
    queryKey: productTypeKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ProductType>(`/product-types/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo loại sản phẩm mới
 */
export const useCreateProductTypeMutation = () => {
  return useMutation({
    mutationFn: async (productTypeData: ProductTypeRequest) => {
      const response = await api.post<ProductType>(
        "/products/type",
        productTypeData
      )
      return response
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách product types
      queryClient.invalidateQueries({ queryKey: productTypeKeys.lists() })
      toast.success("Tạo loại sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi tạo loại sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi tạo loại sản phẩm")
    },
  })
}

/**
 * Hook cập nhật thông tin loại sản phẩm
 */
export const useUpdateProductTypeMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      productTypeData,
    }: {
      id: number
      productTypeData: ProductTypeRequest
    }) => {
      const response = await api.patch<ProductType>(
        `/products/type/${id}`,
        productTypeData
      )
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: productTypeKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: productTypeKeys.detail(variables.id),
      })
      toast.success("Cập nhật thông tin loại sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi cập nhật loại sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi cập nhật thông tin loại sản phẩm")
    },
  })
}

/**
 * Hook xóa loại sản phẩm
 */
export const useDeleteProductTypeMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<void>(`/products/type/${id}`)
      return response
    },
    onSuccess: () => {
      // Invalidate danh sách product types
      queryClient.invalidateQueries({ queryKey: productTypeKeys.lists() })
      toast.success("Xóa loại sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi xóa loại sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi xóa loại sản phẩm")
    },
  })
}

/**
 * Hook lấy danh sách loại phụ sản phẩm
 */
export const useProductSubtypesQuery = () => {
  return useQuery({
    queryKey: productTypeKeys.subtypes.lists(),
    queryFn: async () => {
      const response = await api.get<ProductSubtypesListResponse>(
        "/products/subtype"
      )
      return response
    },
  })
}

/**
 * Hook lấy danh sách loại phụ theo loại sản phẩm
 */
export const useProductSubtypesByTypeQuery = (typeId: number) => {
  return useQuery({
    queryKey: productTypeKeys.subtypes.list(typeId),
    queryFn: async () => {
      const response = await api.get<ProductSubtypesListResponse>(
        `/products/type/${typeId}/subtypes`
      )
      return response
    },
    enabled: !!typeId,
  })
}

/**
 * Hook lấy chi tiết loại phụ sản phẩm theo ID
 */
export const useProductSubtypeQuery = (id: number) => {
  return useQuery({
    queryKey: productTypeKeys.subtypes.detail(id),
    queryFn: async () => {
      const response = await api.get<ProductSubtypeResponse>(
        `/products/subtype/${id}`
      )
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook lấy chi tiết loại phụ sản phẩm theo ID (bổ sung từ service)
 */
export const useProductSubtypeByIdQuery = (id: number) => {
  return useQuery({
    queryKey: productTypeKeys.subtypes.detail(id),
    queryFn: async () => {
      const response = await api.get<ProductSubtypeResponse>(
        `/products/subtype/${id}`
      )
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo loại phụ sản phẩm mới
 */
export const useCreateProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: async (productSubtypeData: ProductSubtypeRequest) => {
      const response = await api.post<ProductSubtypeResponse>(
        "/products/subtype",
        productSubtypeData
      )
      return response
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách product subtypes
      queryClient.invalidateQueries({
        queryKey: productTypeKeys.subtypes.lists(),
      })
      toast.success("Tạo loại phụ sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi tạo loại phụ sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi tạo loại phụ sản phẩm")
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
      productSubtypeData,
    }: {
      id: number
      productSubtypeData: ProductSubtypeRequest
    }) => {
      const response = await api.patch<ProductSubtypeResponse>(
        `/products/subtype/${id}`,
        productSubtypeData
      )
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({
        queryKey: productTypeKeys.subtypes.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: productTypeKeys.subtypes.detail(variables.id),
      })
      toast.success("Cập nhật loại phụ sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi cập nhật loại phụ sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi cập nhật loại phụ sản phẩm")
    },
  })
}

/**
 * Hook xóa loại phụ sản phẩm
 */
export const useDeleteProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<void>(`/products/subtype/${id}`)
      return response
    },
    onSuccess: () => {
      // Invalidate danh sách product subtypes
      queryClient.invalidateQueries({
        queryKey: productTypeKeys.subtypes.lists(),
      })
      toast.success("Xóa loại phụ sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi xóa loại phụ sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi xóa loại phụ sản phẩm")
    },
  })
}

/**
 * Hook thêm mapping giữa loại và loại phụ
 */
export const useAddProductSubtypeMappingMutation = () => {
  return useMutation({
    mutationFn: async (mapping: ProductSubtypeMappingRequest) => {
      const response = await api.post<void>(
        `/products/${mapping.typeId}/subtype/${mapping.subtypeId}`
      )
      return response
    },
    onSuccess: () => {
      toast.success("Thêm mapping loại phụ sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi thêm mapping loại phụ sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi thêm mapping loại phụ sản phẩm")
    },
  })
}

/**
 * Hook xóa mapping giữa loại và loại phụ
 */
export const useRemoveProductSubtypeMappingMutation = () => {
  return useMutation({
    mutationFn: async (mapping: ProductSubtypeMappingRequest) => {
      const response = await api.delete<void>(
        `/products/${mapping.typeId}/subtype/${mapping.subtypeId}`
      )
      return response
    },
    onSuccess: () => {
      toast.success("Xóa mapping loại phụ sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi xóa mapping loại phụ sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi xóa mapping loại phụ sản phẩm")
    },
  })
}
