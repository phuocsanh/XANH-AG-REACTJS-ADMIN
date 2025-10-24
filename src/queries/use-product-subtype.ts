import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import productTypeService from "@/services/product-type.service"
import { productSubtypeService } from "@/services/product-subtype.service"
import { ProductSubtypeRequest } from "@/models/product-type.model"
import { queryClient } from "@/provider/app-provider-tanstack"

// Hook lấy danh sách loại phụ sản phẩm
export const useProductSubtypes = () => {
  return useQuery({
    queryKey: ["productSubtypes"],
    queryFn: () => productSubtypeService.getProductSubtypes(),
  })
}

// Hook lấy danh sách loại phụ theo loại sản phẩm
export const useProductSubtypesByType = (typeId: number) => {
  return useQuery({
    queryKey: ["productSubtypes", typeId],
    queryFn: () => productTypeService.getProductSubtypesByType(typeId),
    enabled: !!typeId, // Chỉ gọi API khi có typeId
  })
}

// Hook tạo loại phụ sản phẩm mới
export const useCreateProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: (productSubtype: ProductSubtypeRequest) =>
      productTypeService.createProductSubtype(productSubtype),
    onSuccess: () => {
      // Làm mới danh sách loại phụ sản phẩm sau khi tạo thành công
      queryClient.invalidateQueries({ queryKey: ["productSubtypes"] })
      toast.success("Tạo loại phụ sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khi tạo loại phụ sản phẩm:", error)
      toast.error("Đã xảy ra lỗi khi tạo loại phụ sản phẩm.")
    },
  })
}

// Hook cập nhật loại phụ sản phẩm
export const useUpdateProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: ({
      id,
      productSubtype,
    }: {
      id: number
      productSubtype: ProductSubtypeRequest
    }) => productTypeService.updateProductSubtype(id, productSubtype),
    onSuccess: () => {
      // Làm mới dữ liệu loại phụ sản phẩm sau khi cập nhật thành công
      queryClient.invalidateQueries({ queryKey: ["productSubtypes"] })
      toast.success("Cập nhật loại phụ sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khi cập nhật loại phụ sản phẩm:", error)
      toast.error("Đã xảy ra lỗi khi cập nhật loại phụ sản phẩm.")
    },
  })
}

// Hook xóa loại phụ sản phẩm
export const useDeleteProductSubtypeMutation = () => {
  return useMutation({
    mutationFn: (id: number) => productTypeService.deleteProductSubtype(id),
    onSuccess: () => {
      // Làm mới danh sách loại phụ sản phẩm sau khi xóa thành công
      queryClient.invalidateQueries({ queryKey: ["productSubtypes"] })
      toast.success("Xóa loại phụ sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khi xóa loại phụ sản phẩm:", error)
      toast.error("Đã xảy ra lỗi khi xóa loại phụ sản phẩm.")
    },
  })
}
