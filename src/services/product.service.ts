import {
  CreateProductRequest,
  ExtendedProductListParams,
  ProductListResponse,
  ProductResponse,
  UpdateProductRequest,
  ProductTypeResponse,
  ProductTypeListResponse,
  CreateProductTypeRequest,
  UpdateProductTypeRequest,
  ProductSubtypeResponse,
  ProductSubtypeListResponse,
  CreateProductSubtypeRequest,
  UpdateProductSubtypeRequest,
  ProductStatsResponse,
  Product,
  ProductApiResponse,
  mapApiResponseToProduct,
} from "@/models/product.model"
import api from "@/utils/api"

// Service xử lý các chức năng liên quan đến sản phẩm
export const productService = {
  // Lấy danh sách sản phẩm
  getProducts: async (
    params?: ExtendedProductListParams
  ): Promise<{ data: { items: Product[]; total: number }; code: number; message: string }> => {
    try {
      const apiData = await api.get<ProductApiResponse[]>("/products", {
        params: { params },
      })
      
      console.log("Raw API response:", apiData)
      
      // api.get trả về data trực tiếp (ProductApiResponse[])
      const mappedProducts = apiData.map(mapApiResponseToProduct)
      
      return {
        data: {
          items: mappedProducts,
          total: apiData.length // Sử dụng length của array làm total
        },
        code: 200,
        message: "Success"
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm:", error)
      throw error
    }
  },

  // Endpoint test để kiểm tra chuyển đổi ngày tháng
  testDate: async (testData: Record<string, unknown>): Promise<{ success: boolean; data: Record<string, unknown> }> => {
    try {
      const response = await api.post<{ success: boolean; data: Record<string, unknown> }>("/products/test-date", testData)
      return response
    } catch (error) {
      console.error("Lỗi khi test date:", error)
      throw error
    }
  },

  // Lấy chi tiết sản phẩm theo ID
  getProductById: async (id: number): Promise<ProductResponse> => {
    try {
      const response = await api.get<ProductResponse>(`/products/${id}`)
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
        "/products",
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
      const response = await api.patch<ProductResponse>(
        `/products/${id}`,
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
      await api.delete(`/products/${id}`)
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
        "/products/search",
        {
          params: { q: query, limit, offset },
        }
      )
      return response
    } catch (error) {
      console.error("Lỗi khi tìm kiếm sản phẩm:", error)
      throw error
    }
  },

  // Lấy sản phẩm theo loại sản phẩm
  getProductsByType: async (
    productType: string
  ): Promise<ProductListResponse> => {
    try {
      const response = await api.get<ProductListResponse>(
        `/products/type/${productType}/products`
      )
      return response
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm theo loại:", error)
      throw error
    }
  },

  // Lấy thống kê sản phẩm (giữ nguyên endpoint cũ vì server chưa có)
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
      const response = await api.get<ProductTypeListResponse>("/products/type")
      return response
    } catch (error) {
      console.error("Lỗi khi lấy danh sách loại sản phẩm:", error)
      throw error
    }
  },

  // Lấy chi tiết loại sản phẩm theo ID
  getProductTypeById: async (id: number): Promise<ProductTypeResponse> => {
    try {
      const response = await api.get<ProductTypeResponse>(`/products/type/${id}`)
      return response
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết loại sản phẩm:", error)
      throw error
    }
  },

  // Tạo loại sản phẩm mới
  createProductType: async (
    productType: CreateProductTypeRequest
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
    productType: UpdateProductTypeRequest
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

  // Lấy danh sách phân loại sản phẩm
  getProductSubtypes: async (): Promise<ProductSubtypeListResponse> => {
    try {
      const response = await api.get<ProductSubtypeListResponse>(
        "/products/subtype"
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
        "/products/subtype",
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
      const response = await api.patch<ProductSubtypeResponse>(
        `/products/subtype/${id}`,
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
      await api.delete(`/products/subtype/${id}`)
    } catch (error) {
      console.error(`Lỗi khi xóa phân loại sản phẩm ID ${id}:`, error)
      throw error
    }
  },

  // Lấy danh sách phân loại sản phẩm theo loại sản phẩm
  getProductSubtypesByType: async (typeId: number): Promise<ProductSubtypeListResponse> => {
    try {
      const response = await api.get<ProductSubtypeListResponse>(
        `/products/type/${typeId}/subtypes`
      )
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy phân loại sản phẩm theo loại ${typeId}:`, error)
      throw error
    }
  },

  // Lấy danh sách mối quan hệ loại phụ sản phẩm của một sản phẩm
  getProductSubtypeRelations: async (productId: number): Promise<ProductSubtypeListResponse> => {
    try {
      const response = await api.get<ProductSubtypeListResponse>(
        `/products/${productId}/subtypes`
      )
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy mối quan hệ phân loại của sản phẩm ${productId}:`, error)
      throw error
    }
  },

  // Thêm mối quan hệ loại phụ sản phẩm cho sản phẩm
  addProductSubtypeRelation: async (
    productId: number,
    subtypeId: number
  ): Promise<unknown> => {
    try {
      const response = await api.post(
        `/products/${productId}/subtype/${subtypeId}`
      )
      return response
    } catch (error) {
      console.error(
        `Lỗi khi thêm mối quan hệ sản phẩm ${productId} với phân loại ${subtypeId}:`,
        error
      )
      throw error
    }
  },

  // Xóa mối quan hệ loại phụ sản phẩm của sản phẩm
  removeProductSubtypeRelation: async (productId: number, subtypeId: number): Promise<void> => {
    try {
      await api.delete(`/products/${productId}/subtype/${subtypeId}`);
    } catch (error) {
      console.error(`Lỗi khi xóa mối quan hệ sản phẩm ${productId} với phân loại ${subtypeId}:`, error);
      throw error;
    }
  },

  // Xóa tất cả mối quan hệ loại phụ sản phẩm của sản phẩm
  removeAllProductSubtypeRelations: async (productId: number): Promise<void> => {
    try {
      await api.delete(`/products/${productId}/subtypes`);
    } catch (error) {
      console.error(`Lỗi khi xóa tất cả mối quan hệ phân loại của sản phẩm ${productId}:`, error);
      throw error;
    }
  }
};

export default productService
