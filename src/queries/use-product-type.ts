import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import productTypeService from "@/services/product-type.service"
import { ProductTypeRequest } from "@/models/product-type.model"
import { queryClient } from "@/provider/app-provider-tanstack"

// Hook lấy danh sách loại sản phẩm
export const useProductTypes = () => {
  return useQuery({
    queryKey: ["productTypes"],
    queryFn: () => productTypeService.getProductTypes(),
  })
}

// Hook lấy chi tiết loại sản phẩm theo ID
export const useProductType = (id: number) => {
  return useQuery({
    queryKey: ["productType", id],
    queryFn: () => productTypeService.getProductTypeById(id),
    enabled: !!id, // Chỉ gọi API khi có ID
  })
}

// Hook tạo loại sản phẩm mới
export const useCreateProductTypeMutation = () => {
  return useMutation({
    mutationFn: (productType: ProductTypeRequest) =>
      productTypeService.createProductType(productType),
    onSuccess: () => {
      // Làm mới danh sách loại sản phẩm sau khi tạo thành công
      queryClient.invalidateQueries({ queryKey: ["productTypes"] })
      toast.success("Tạo loại sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khi tạo loại sản phẩm:", error)
      toast.error("Đã xảy ra lỗi khi tạo loại sản phẩm.")
    },
  })
}

// Hook cập nhật loại sản phẩm
export const useUpdateProductTypeMutation = () => {
  return useMutation({
    mutationFn: ({
      id,
      productType,
    }: {
      id: number
      productType: ProductTypeRequest
    }) => productTypeService.updateProductType(id, productType),
    onSuccess: () => {
      // Làm mới dữ liệu loại sản phẩm sau khi cập nhật thành công
      queryClient.invalidateQueries({ queryKey: ["productTypes"] })
      toast.success("Cập nhật loại sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khi cập nhật loại sản phẩm:", error)
      toast.error("Đã xảy ra lỗi khi cập nhật loại sản phẩm.")
    },
  })
}

// Hook xóa loại sản phẩm
export const useDeleteProductTypeMutation = () => {
  return useMutation({
    mutationFn: (id: number) => productTypeService.deleteProductType(id),
    onSuccess: () => {
      // Làm mới danh sách loại sản phẩm sau khi xóa thành công
      queryClient.invalidateQueries({ queryKey: ["productTypes"] })
      toast.success("Xóa loại sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khi xóa loại sản phẩm:", error)
      toast.error("Đã xảy ra lỗi khi xóa loại sản phẩm.")
    },
  })
}
