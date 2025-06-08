import api from './api';
import { 
  CreateProductRequest, 
  Product, 
  ProductListParams, 
  ProductListResponse, 
  ProductResponse, 
  UpdateProductRequest 
} from '@/models/product.model';

// Service xử lý các chức năng liên quan đến sản phẩm
export const productService = {
  // Lấy danh sách sản phẩm
  getProducts: async (params?: ProductListParams): Promise<ProductListResponse> => {
    try {
      const response = await api.get<ProductListResponse>('/manager/product', { params });
      return response;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', error);
      throw error;
    }
  },

  // Lấy chi tiết sản phẩm theo ID
  getProductById: async (id: number): Promise<ProductResponse> => {
    try {
      const response = await api.get<ProductResponse>(`/manager/product/${id}`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi lấy sản phẩm ID ${id}:`, error);
      throw error;
    }
  },

  // Tạo sản phẩm mới
  createProduct: async (product: CreateProductRequest): Promise<ProductResponse> => {
    try {
      const response = await api.post<ProductResponse>('/manager/product', product);
      return response;
    } catch (error) {
      console.error('Lỗi khi tạo sản phẩm mới:', error);
      throw error;
    }
  },

  // Cập nhật sản phẩm
  updateProduct: async (id: number, product: UpdateProductRequest): Promise<ProductResponse> => {
    try {
      const response = await api.put<ProductResponse>(`/manager/product/${id}`, product);
      return response;
    } catch (error) {
      console.error(`Lỗi khi cập nhật sản phẩm ID ${id}:`, error);
      throw error;
    }
  },

  // Xóa sản phẩm
  deleteProduct: async (id: number): Promise<void> => {
    try {
      await api.delete(`/manager/product/${id}`);
    } catch (error) {
      console.error(`Lỗi khi xóa sản phẩm ID ${id}:`, error);
      throw error;
    }
  },

  // Tìm kiếm sản phẩm
  searchProducts: async (query: string, limit: number = 10, offset: number = 0): Promise<ProductListResponse> => {
    try {
      const response = await api.get<ProductListResponse>('/manager/product/search', {
        params: { query, limit, offset }
      });
      return response;
    } catch (error) {
      console.error('Lỗi khi tìm kiếm sản phẩm:', error);
      throw error;
    }
  },

  // Lọc sản phẩm theo các tiêu chí
  filterProducts: async (filters: Record<string, any>): Promise<ProductListResponse> => {
    try {
      const response = await api.get<ProductListResponse>('/manager/product/filter', {
        params: filters
      });
      return response;
    } catch (error) {
      console.error('Lỗi khi lọc sản phẩm:', error);
      throw error;
    }
  }
};

export default productService;
