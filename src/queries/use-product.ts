import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import productService from "@/services/product.service"
import {
  CreateProductRequest,
  ExtendedProductListParams,
  UpdateProductRequest,
} from "@/models/product.model"
import { queryClient } from "@/provider/app-provider-tanstack"

// Hook lấy danh sách sản phẩm
export const useProducts = (params?: ExtendedProductListParams) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productService.getProducts(params),
  })
}

// Hook lấy chi tiết sản phẩm theo ID
export const useProduct = (id: number) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id, // Chỉ gọi API khi có ID
  })
}

// Hook tạo sản phẩm mới
export const useCreateProductMutation = () => {
  return useMutation({
    mutationFn: (product: CreateProductRequest) =>
      productService.createProduct(product),
    onSuccess: () => {
      // Làm mới danh sách sản phẩm sau khi tạo thành công
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Tạo sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khi tạo sản phẩm:", error)
      toast.error("Đã xảy ra lỗi khi tạo sản phẩm.")
    },
  })
}

// Hook cập nhật sản phẩm
export const useUpdateProductMutation = () => {
  return useMutation({
    mutationFn: ({
      id,
      product,
    }: {
      id: number
      product: UpdateProductRequest
    }) => productService.updateProduct(id, product),
    onSuccess: (_, variables) => {
      // Làm mới dữ liệu sản phẩm sau khi cập nhật thành công
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] })
      toast.success("Cập nhật sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khi cập nhật sản phẩm:", error)
      toast.error("Đã xảy ra lỗi khi cập nhật sản phẩm.")
    },
  })
}

// Hook xóa sản phẩm
export const useDeleteProductMutation = () => {
  return useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: () => {
      // Làm mới danh sách sản phẩm sau khi xóa thành công
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Xóa sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khi xóa sản phẩm:", error)
      toast.error("Đã xảy ra lỗi khi xóa sản phẩm.")
    },
  })
}

// Hook tìm kiếm sản phẩm
export const useSearchProducts = (
  query: string,
  limit: number = 10,
  offset: number = 0
) => {
  return useQuery({
    queryKey: ["products", "search", query, limit, offset],
    queryFn: () => productService.searchProducts(query, limit, offset),
    enabled: !!query, // Chỉ gọi API khi có query
  })
}

// Hook lọc sản phẩm
export const useFilterProducts = (filters: Record<string, unknown>) => {
  return useQuery({
    queryKey: ["products", "filter", filters],
    queryFn: () =>
      productService.getProducts(filters as ExtendedProductListParams),
    enabled: Object.keys(filters).length > 0, // Chỉ gọi API khi có filter
  })
}
