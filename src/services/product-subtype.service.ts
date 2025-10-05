import api from '@/utils/api';

// Interface cho ProductSubtype entity
export interface ProductSubtype {
  id: number;
  subtypeName: string;
  subtypeCode: string;
  productTypeId: number;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Interface cho tạo mới ProductSubtype
export interface CreateProductSubtypeDto {
  subtypeName: string;
  subtypeCode: string;
  productTypeId: number;
  description?: string;
  status?: 'active' | 'inactive' | 'archived';
  [key: string]: unknown;
}

// Interface cho cập nhật ProductSubtype
export interface UpdateProductSubtypeDto {
  subtypeName?: string;
  subtypeCode?: string;
  productTypeId?: number;
  description?: string;
  status?: 'active' | 'inactive' | 'archived';
  [key: string]: unknown;
}

// Service xử lý các chức năng liên quan đến loại phụ sản phẩm
export const productSubtypeService = {
  // Lấy danh sách tất cả loại phụ sản phẩm
  getProductSubtypes: async (): Promise<ProductSubtype[]> => {
    const response = await api.get<ProductSubtype[]>("/product-subtype");
    return response;
  },

  // Lấy thông tin loại phụ sản phẩm theo ID
  getProductSubtypeById: async (id: number): Promise<ProductSubtype> => {
    const response = await api.get<ProductSubtype>(`/product-subtype/${id}`);
    return response;
  },

  // Tạo mới loại phụ sản phẩm
  createProductSubtype: async (data: CreateProductSubtypeDto): Promise<ProductSubtype> => {
    const response = await api.post<ProductSubtype>("/product-subtype", data);
    return response;
  },

  // Cập nhật loại phụ sản phẩm
  updateProductSubtype: async (id: number, data: UpdateProductSubtypeDto): Promise<ProductSubtype> => {
    const response = await api.put<ProductSubtype>(`/product-subtype/${id}`, data);
    return response;
  },

  // Kích hoạt loại phụ sản phẩm
  activateProductSubtype: async (id: number): Promise<ProductSubtype> => {
    const response = await api.put<ProductSubtype>(`/product-subtype/${id}/activate`);
    return response;
  },

  // Vô hiệu hóa loại phụ sản phẩm
  deactivateProductSubtype: async (id: number): Promise<ProductSubtype> => {
    const response = await api.put<ProductSubtype>(`/product-subtype/${id}/deactivate`);
    return response;
  },

  // Lưu trữ loại phụ sản phẩm
  archiveProductSubtype: async (id: number): Promise<ProductSubtype> => {
    const response = await api.put<ProductSubtype>(`/product-subtype/${id}/archive`);
    return response;
  },

  // Khôi phục loại phụ sản phẩm từ lưu trữ
  restoreProductSubtype: async (id: number): Promise<ProductSubtype> => {
    const response = await api.put<ProductSubtype>(`/product-subtype/${id}/restore`);
    return response;
  },

  // Xóa mềm loại phụ sản phẩm
  deleteProductSubtype: async (id: number): Promise<void> => {
    await api.delete<void>(`/product-subtype/${id}`);
  },

  // Xóa vĩnh viễn loại phụ sản phẩm
  permanentDeleteProductSubtype: async (id: number): Promise<void> => {
    await api.delete<void>(`/product-subtype/${id}/permanent`);
  },

  // Lấy danh sách loại phụ sản phẩm đã bị xóa
  getDeletedProductSubtypes: async (): Promise<ProductSubtype[]> => {
    const response = await api.get<ProductSubtype[]>("/product-subtype/deleted");
    return response;
  },
};