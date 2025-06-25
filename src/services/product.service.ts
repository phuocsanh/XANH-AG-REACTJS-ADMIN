import {
  CreateProductRequest,
  Product,
  ProductListParams,
  ProductListResponse,
  ProductResponse,
  UpdateProductRequest,
  ProductType,
  ProductTypeResponse,
  ProductTypeListResponse,
  CreateProductTypeRequest,
  UpdateProductTypeRequest,
  ProductSubtype,
  ProductSubtypeResponse,
  ProductSubtypeListResponse,
  CreateProductSubtypeRequest,
  UpdateProductSubtypeRequest,
  ProductStatsResponse,
} from "@/models/product.model"
import api from "@/utils/api"

// Service xử lý các chức năng liên quan đến sản phẩm
export const productService = {
  // Lấy danh sách sản phẩm
  getProducts: async (
    params?: ProductListParams
  ): Promise<ProductListResponse> => {
    try {
      const response = await api.get<ProductListResponse>("/manage/product", {
        params,
      })
      return response
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm:", error)
      throw error
    }
  },

  // Lấy chi tiết sản phẩm theo ID
  getProductById: async (id: number): Promise<ProductResponse> => {
    try {
      const response = await api.get<ProductResponse>(`/manage/product/${id}`)
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Tạo sản phẩm mới
  createProduct: async (
    product: CreateProductRequest
  ): Promise<ProductResponse> => {
    try {
      const response = await api.post<ProductResponse>(
        "/manage/product",
        product
      )
      return response
    } catch (error) {
      console.error("Lỗi khi tạo sản phẩm mới:", error)
      throw error
    }
  },

  // Cập nhật sản phẩm
  updateProduct: async (
    id: number,
    product: UpdateProductRequest
  ): Promise<ProductResponse> => {
    try {
      const response = await api.put<ProductResponse>(
        `/manage/product/${id}`,
        product
      )
      return response
    } catch (error) {
      console.error(`Lỗi khi cập nhật sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Xóa sản phẩm
  deleteProduct: async (id: number): Promise<void> => {
    try {
      await api.delete(`/manage/product/${id}`)
    } catch (error) {
      console.error(`Lỗi khi xóa sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Tìm kiếm sản phẩm
  searchProducts: async (
    query: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<ProductListResponse> => {
    try {
      const response = await api.get<ProductListResponse>(
        "/manage/product/search",
        {
          params: { query, limit, offset },
        }
      )
      return response
    } catch (error) {
      console.error("Lỗi khi tìm kiếm sản phẩm:", error)
      throw error
    }
  },

  // Lọc sản phẩm theo các tiêu chí
  filterProducts: async (
    filters: Record<string, any>
  ): Promise<ProductListResponse> => {
    try {
      const response = await api.get<ProductListResponse>(
        "/manage/product/filter",
        {
          params: filters,
        }
      )
      return response
    } catch (error) {
      console.error("Lỗi khi lọc sản phẩm:", error)
      throw error
    }
  },

  // Lấy thống kê sản phẩm
  getProductStats: async (): Promise<ProductStatsResponse> => {
    try {
      const response = await api.get<ProductStatsResponse>(
        "/manage/product/stats"
      )
      return response
    } catch (error) {
      console.error("Lỗi khi lấy thống kê sản phẩm:", error)
      throw error
    }
  },

  // Lấy danh sách loại sản phẩm
  getProductTypes: async (): Promise<ProductTypeListResponse> => {
    try {
      const response = await api.get<ProductTypeListResponse>(
        "/manage/product-type"
      )
      return response
    } catch (error) {
      console.error("Lỗi khi lấy danh sách loại sản phẩm:", error)
      throw error
    }
  },

  // Tạo loại sản phẩm mới
  createProductType: async (
    productType: CreateProductTypeRequest
  ): Promise<ProductTypeResponse> => {
    try {
      const response = await api.post<ProductTypeResponse>(
        "/manage/product-type",
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
    productType: UpdateProductTypeRequest
  ): Promise<ProductTypeResponse> => {
    try {
      const response = await api.put<ProductTypeResponse>(
        `/manage/product-type/${id}`,
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
      await api.delete(`/manage/product-type/${id}`)
    } catch (error) {
      console.error(`Lỗi khi xóa loại sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Lấy danh sách phân loại sản phẩm
  getProductSubtypes: async (): Promise<ProductSubtypeListResponse> => {
    try {
      const response = await api.get<ProductSubtypeListResponse>(
        "/manage/product-subtype"
      )
      return response
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phân loại sản phẩm:", error)
      throw error
    }
  },

  // Tạo phân loại sản phẩm mới
  createProductSubtype: async (
    productSubtype: CreateProductSubtypeRequest
  ): Promise<ProductSubtypeResponse> => {
    try {
      const response = await api.post<ProductSubtypeResponse>(
        "/manage/product-subtype",
        productSubtype
      )
      return response
    } catch (error) {
      console.error("Lỗi khi tạo phân loại sản phẩm mới:", error)
      throw error
    }
  },

  // Cập nhật phân loại sản phẩm
  updateProductSubtype: async (
    id: number,
    productSubtype: UpdateProductSubtypeRequest
  ): Promise<ProductSubtypeResponse> => {
    try {
      const response = await api.put<ProductSubtypeResponse>(
        `/manage/product-subtype/${id}`,
        productSubtype
      )
      return response
    } catch (error) {
      console.error(`Lỗi khi cập nhật phân loại sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Xóa phân loại sản phẩm
  deleteProductSubtype: async (id: number): Promise<void> => {
    try {
      await api.delete(`/manage/product-subtype/${id}`)
    } catch (error) {
      console.error(`Lỗi khi xóa phân loại sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Thêm sản phẩm vào phân loại
  addProductToSubtype: async (
    productId: number,
    subtypeId: number
  ): Promise<any> => {
    try {
      const response = await api.post(
        `/manage/product-subtype/${subtypeId}/products/${productId}`
      )
      return response
    } catch (error) {
      console.error(
        `Lỗi khi thêm sản phẩm ${productId} vào phân loại ${subtypeId}:`,
        error
      )
      throw error
    }
  },
  // Xóa sản phẩm khỏi phân loại
  removeProductFromSubtype: async (productId: number, subtypeId: number): Promise<void> => {
    try {
      await api.delete(`/manage/product-subtype/${subtypeId}/products/${productId}`);
    } catch (error) {
      console.error(`Lỗi khi xóa sản phẩm ${productId} khỏi phân loại ${subtypeId}:`, error);
      throw error;
    }
  }
};

export default productService
