import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ExtendedProductListParams,
  ProductApiResponse,
} from "@/models/product.model"

// Query keys cho product
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ExtendedProductListParams) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
}

/**
 * Hook lấy danh sách sản phẩm
 */
export const useProductsQuery = (params?: ExtendedProductListParams) => {
  return useQuery({
    queryKey: productKeys.list(params || {}),
    queryFn: async () => {
      const response = await api.get<ProductApiResponse[]>("/products", {
        params: { params },
      })
      return response
    },
  })
}

/**
 * Hook lấy thông tin chi tiết một sản phẩm
 */
export const useProductQuery = (id: number) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Product>(`/products/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo sản phẩm mới
 */
export const useCreateProductMutation = () => {
  return useMutation({
    mutationFn: async (productData: CreateProductRequest) => {
      const response = await api.post<Product>("/products", productData)
      return response
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách products
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success("Tạo sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi tạo sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi tạo sản phẩm")
    },
  })
}

/**
 * Hook cập nhật thông tin sản phẩm
 */
export const useUpdateProductMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      productData,
    }: {
      id: number
      productData: UpdateProductRequest
    }) => {
      const response = await api.patch<Product>(`/products/${id}`, productData)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      })
      toast.success("Cập nhật thông tin sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi cập nhật sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi cập nhật thông tin sản phẩm")
    },
  })
}

/**
 * Hook xóa sản phẩm
 */
export const useDeleteProductMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<void>(`/products/${id}`)
      return response
    },
    onSuccess: () => {
      // Invalidate danh sách products
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success("Xóa sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi xóa sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi xóa sản phẩm")
    },
  })
}
