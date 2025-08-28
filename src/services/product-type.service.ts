import api from "@/utils/api"
import {
  ProductTypeRequest,
  ProductTypeResponse,
  ProductTypesListResponse,
  ProductSubtypeRequest,
  ProductSubtypeResponse,
  ProductSubtypesListResponse,
  ProductSubtypeMappingRequest,
} from "@/models/product-type.model"

// Service xử lý các chức năng liên quan đến loại sản phẩm
export const productTypeService = {
  // Lấy danh sách loại sản phẩm
  getProductTypes: async (): Promise<ProductTypesListResponse> => {
    try {
      const response = await api.get<ProductTypesListResponse>(
        "/products/type"
      )
      return response
    } catch (error) {
      console.error("Lỗi khi lấy danh sách loại sản phẩm:", error)
      throw error
    }
  },

  // Lấy chi tiết loại sản phẩm theo ID
  getProductTypeById: async (id: number): Promise<ProductTypeResponse> => {
    try {
      const response = await api.get<ProductTypeResponse>(
        `/products/type/${id}`
      )
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy loại sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Tạo loại sản phẩm mới
  createProductType: async (
    productType: ProductTypeRequest
  ): Promise<ProductTypeResponse> => {
    try {
      const response = await api.post<ProductTypeResponse>(
        "/products/type",
        productType
      )
      return response
    } catch (error) {
      console.error("Lỗi khi tạo loại sản phẩm mới:", error)
      throw error
    }
  },

  // Cập nhật loại sản phẩm
  updateProductType: async (
    id: number,
    productType: ProductTypeRequest
  ): Promise<ProductTypeResponse> => {
    try {
      const response = await api.patch<ProductTypeResponse>(
        `/products/type/${id}`,
        productType
      )
      return response
    } catch (error) {
      console.error(`Lỗi khi cập nhật loại sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Xóa loại sản phẩm
  deleteProductType: async (id: number): Promise<void> => {
    try {
      await api.delete(`/products/type/${id}`)
    } catch (error) {
      console.error(`Lỗi khi xóa loại sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Lấy danh sách loại phụ sản phẩm
  getProductSubtypes: async (): Promise<ProductSubtypesListResponse> => {
    try {
      const response = await api.get<ProductSubtypesListResponse>(
        "/products/subtype"
      )
      return response
    } catch (error) {
      console.error("Lỗi khi lấy danh sách loại phụ sản phẩm:", error)
      throw error
    }
  },

  // Lấy danh sách loại phụ theo loại sản phẩm
  getProductSubtypesByType: async (
    typeId: number
  ): Promise<ProductSubtypesListResponse> => {
    try {
      const response = await api.get<ProductSubtypesListResponse>(
        `/products/type/${typeId}/subtypes`
      )
      return response
    } catch (error) {
      console.error(
        `Lỗi khi lấy loại phụ cho loại sản phẩm ID ${typeId}:`,
        error
      )
      throw error
    }
  },

  // Lấy chi tiết loại phụ sản phẩm theo ID
  getProductSubtypeById: async (
    id: number
  ): Promise<ProductSubtypeResponse> => {
    try {
      const response = await api.get<ProductSubtypeResponse>(
        `/products/subtype/${id}`
      )
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy loại phụ sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Tạo loại phụ sản phẩm mới
  createProductSubtype: async (
    productSubtype: ProductSubtypeRequest
  ): Promise<ProductSubtypeResponse> => {
    try {
      const response = await api.post<ProductSubtypeResponse>(
        "/products/subtype",
        productSubtype
      )
      return response
    } catch (error) {
      console.error("Lỗi khi tạo loại phụ sản phẩm mới:", error)
      throw error
    }
  },

  // Cập nhật loại phụ sản phẩm
  updateProductSubtype: async (
    id: number,
    productSubtype: ProductSubtypeRequest
  ): Promise<ProductSubtypeResponse> => {
    try {
      const response = await api.patch<ProductSubtypeResponse>(
        `/products/subtype/${id}`,
        productSubtype
      )
      return response
    } catch (error) {
      console.error(`Lỗi khi cập nhật loại phụ sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Xóa loại phụ sản phẩm
  deleteProductSubtype: async (id: number): Promise<void> => {
    try {
      await api.delete(`/products/subtype/${id}`)
    } catch (error) {
      console.error(`Lỗi khi xóa loại phụ sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Thêm mapping giữa loại và loại phụ (deprecated - sử dụng product service)
  addProductSubtypeMapping: async (
    mapping: ProductSubtypeMappingRequest
  ): Promise<void> => {
    try {
      // Sử dụng endpoint mới từ product service
      await api.post(`/products/${mapping.typeId}/subtype/${mapping.subtypeId}`)
    } catch (error) {
      console.error("Lỗi khi thêm mapping loại phụ sản phẩm:", error)
      throw error
    }
  },

  // Xóa mapping giữa loại và loại phụ (deprecated - sử dụng product service)
  removeProductSubtypeMapping: async (
    mapping: ProductSubtypeMappingRequest
  ): Promise<void> => {
    try {
      // Sử dụng endpoint mới từ product service
      await api.delete(`/products/${mapping.typeId}/subtype/${mapping.subtypeId}`)
    } catch (error) {
      console.error("Lỗi khi xóa mapping loại phụ sản phẩm:", error)
      throw error
    }
  },
}

export default productTypeService
