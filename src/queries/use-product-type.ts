import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import productTypeService from "@/services/product-type.service"
import { productSubtypeService } from "@/services/product-subtype.service"
import {
  ProductTypeRequest,
  ProductSubtypeRequest,
} from "@/models/product-type.model"

// Hook lấy danh sách loại sản phẩm
export const useProductTypes = () => {
  return useQuery({
    queryKey: ["productTypes"],
    queryFn: () => productTypeService.getProductTypes(),
    staleTime: 5 * 60 * 1000, // 5 phút
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
  const queryClient = useQueryClient()

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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      productType,
    }: {
      id: number
      productType: ProductTypeRequest
    }) => productTypeService.updateProductType(id, productType),
    onSuccess: (_, variables) => {
      // Làm mới dữ liệu loại sản phẩm sau khi cập nhật thành công
      queryClient.invalidateQueries({ queryKey: ["productTypes"] })
      queryClient.invalidateQueries({ queryKey: ["productType", variables.id] })
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
  const queryClient = useQueryClient()

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

// Hook lấy danh sách loại phụ sản phẩm
export const useProductSubtypes = () => {
  return useQuery({
    queryKey: ["productSubtypes"],
    queryFn: () => productSubtypeService.getProductSubtypes(),
    staleTime: 5 * 60 * 1000, // 5 phút
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
  const queryClient = useQueryClient()

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
  const queryClient = useQueryClient()

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
  const queryClient = useQueryClient()

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
